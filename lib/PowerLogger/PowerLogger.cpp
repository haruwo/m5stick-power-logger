#include "PowerLogger.h"
#include <esp32-hal-log.h>
#include <esp_chip_info.h>
#include <esp_system.h>

PowerLogger::PowerLogger(const DeviceConfig& config) 
    : m_config(config)
    , m_systemStatus(SystemStatus::INITIALIZING)
    , m_lastWiFiCheck(0)
    , m_lastBatteryCheck(0)
    , m_lastHttpRetry(0)
    , m_bootTime(0)
    , m_isInitialized(false)
    , m_wifiConnected(false)
    , m_httpRetryCount(0)
    , m_lastBatteryVoltage(0.0f)
    , m_lastPowerState(false) {
    
    logMessage(LOG_LEVEL_INFO, "PowerLogger initialized");
}

PowerLogger::~PowerLogger() {
    disconnectWiFi();
    m_httpClient.end();
    logMessage(LOG_LEVEL_INFO, "PowerLogger destroyed");
}

bool PowerLogger::begin() {
    logMessage(LOG_LEVEL_INFO, "Starting PowerLogger initialization...");
    
    if (!validateConfig()) {
        handleSystemError("Invalid configuration");
        return false;
    }
    
    // Initialize device ID
    initializeDeviceId();
    
    // Initialize time
    initializeTime();
    
    // Record boot time
    m_bootTime = millis();
    
    // Initialize power state
    m_lastPowerState = (getBatteryVoltage() > 4.0f); // Rough USB power detection
    
    // Set initial status
    setSystemStatus(SystemStatus::WIFI_CONNECTING);
    
    // Log initialization complete
    logMessage(LOG_LEVEL_INFO, "PowerLogger initialization completed");
    logMessage(LOG_LEVEL_INFO, "Device ID: " + m_config.deviceId);
    logMessage(LOG_LEVEL_INFO, "Endpoint: " + m_config.httpEndpoint);
    
    m_isInitialized = true;
    
    // Send power on event
    return logPowerEvent(PowerEventType::POWER_ON, "System initialized");
}

void PowerLogger::loop() {
    if (!m_isInitialized) {
        return;
    }
    
    unsigned long currentTime = millis();
    
    // Check WiFi connection periodically
    if (currentTime - m_lastWiFiCheck >= WIFI_CHECK_INTERVAL) {
        checkWiFiConnection();
        m_lastWiFiCheck = currentTime;
    }
    
    // Check battery status periodically
    if (currentTime - m_lastBatteryCheck >= BATTERY_CHECK_INTERVAL) {
        checkBatteryStatus();
        m_lastBatteryCheck = currentTime;
    }
    
    // Detect power state changes
    if (detectPowerStateChange()) {
        bool currentPowerState = (getBatteryVoltage() > 4.0f);
        processPowerStateChange(currentPowerState);
        m_lastPowerState = currentPowerState;
    }
    
    // Handle WiFi events
    handleWiFiEvents();
    
    // Small delay to prevent tight loop
    delay(10);
}

bool PowerLogger::logPowerEvent(PowerEventType eventType, const String& message) {
    logMessage(LOG_LEVEL_INFO, "Logging power event: " + String((int)eventType) + " - " + message);
    
    if (!m_isInitialized) {
        logMessage(LOG_LEVEL_ERROR, "PowerLogger not initialized");
        return false;
    }
    
    // Create JSON payload
    DynamicJsonDocument doc(JSON_BUFFER_SIZE);
    if (!createEventJson(doc, eventType, message)) {
        logMessage(LOG_LEVEL_ERROR, "Failed to create event JSON");
        return false;
    }
    
    // Try to send HTTP request
    bool success = sendHttpRequest(doc);
    
    if (success && m_onHttpSuccess) {
        m_onHttpSuccess("Event logged successfully");
    } else if (!success && m_onHttpError) {
        m_onHttpError("Failed to log event");
    }
    
    return success;
}

bool PowerLogger::connectWiFi() {
    if (m_wifiConnected) {
        return true;
    }
    
    logMessage(LOG_LEVEL_INFO, "Connecting to WiFi: " + m_config.wifiSSID);
    setSystemStatus(SystemStatus::WIFI_CONNECTING);
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(m_config.wifiSSID.c_str(), m_config.wifiPassword.c_str());
    
    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED && (millis() - startTime) < WIFI_TIMEOUT_MS) {
        delay(500);
        logMessage(LOG_LEVEL_DEBUG, "WiFi connecting...");
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        m_wifiConnected = true;
        setSystemStatus(SystemStatus::WIFI_CONNECTED);
        logMessage(LOG_LEVEL_INFO, "WiFi connected. IP: " + getLocalIP());
        
        if (m_onWiFiConnected) {
            m_onWiFiConnected();
        }
        
        // Send WiFi reconnection status event
        logPowerEvent(PowerEventType::WIFI_RECONNECTED, 
                     "WiFi connected - IP: " + getLocalIP() + 
                     ", RSSI: " + String(getSignalStrength()) + " dBm");
        
        return true;
    } else {
        setSystemStatus(SystemStatus::WIFI_DISCONNECTED);
        logMessage(LOG_LEVEL_ERROR, "WiFi connection failed");
        return false;
    }
}

bool PowerLogger::isWiFiConnected() {
    return m_wifiConnected && (WiFi.status() == WL_CONNECTED);
}

void PowerLogger::disconnectWiFi() {
    if (m_wifiConnected) {
        WiFi.disconnect();
        m_wifiConnected = false;
        setSystemStatus(SystemStatus::WIFI_DISCONNECTED);
        logMessage(LOG_LEVEL_INFO, "WiFi disconnected");
        
        if (m_onWiFiDisconnected) {
            m_onWiFiDisconnected();
        }
    }
}

bool PowerLogger::sendHttpRequest(const JsonDocument& payload) {
    if (!isWiFiConnected()) {
        logMessage(LOG_LEVEL_WARN, "WiFi not connected, attempting to connect...");
        if (!connectWiFi()) {
            return false;
        }
    }
    
    setSystemStatus(SystemStatus::HTTP_SENDING);
    
    m_httpClient.begin(m_wifiClient, m_config.httpEndpoint);
    m_httpClient.setTimeout(m_config.httpTimeout);
    m_httpClient.addHeader("Content-Type", "application/json");
    m_httpClient.addHeader("User-Agent", String(DEVICE_MODEL) + "/" + String(FIRMWARE_VERSION));
    m_httpClient.addHeader("X-Device-ID", m_config.deviceId);
    
    String jsonString;
    serializeJson(payload, jsonString);
    
    logMessage(LOG_LEVEL_DEBUG, "Sending HTTP POST: " + jsonString);
    
    int httpCode = m_httpClient.POST(jsonString);
    String response = m_httpClient.getString();
    
    m_httpClient.end();
    
    if (httpCode >= 200 && httpCode < 300) {
        setSystemStatus(SystemStatus::HTTP_SUCCESS);
        logMessage(LOG_LEVEL_INFO, "HTTP request successful. Code: " + String(httpCode));
        m_httpRetryCount = 0;
        return true;
    } else {
        setSystemStatus(SystemStatus::HTTP_FAILED);
        logMessage(LOG_LEVEL_ERROR, "HTTP request failed. Code: " + String(httpCode) + ", Response: " + response);
        
        // Retry logic
        if (m_httpRetryCount < m_config.httpRetryAttempts) {
            m_httpRetryCount++;
            logMessage(LOG_LEVEL_INFO, "Retrying HTTP request (" + String(m_httpRetryCount) + "/" + String(m_config.httpRetryAttempts) + ")");
            delay(m_config.httpRetryDelay * m_httpRetryCount); // Exponential backoff
            return retryHttpRequest(payload);
        } else {
            m_httpRetryCount = 0;
            return false;
        }
    }
}

SystemStatus PowerLogger::getSystemStatus() const {
    return m_systemStatus;
}

void PowerLogger::setSystemStatus(SystemStatus status) {
    if (m_systemStatus != status) {
        m_systemStatus = status;
        logMessage(LOG_LEVEL_DEBUG, "System status changed to: " + String((int)status));
    }
}

float PowerLogger::getBatteryVoltage() {
    // M5StickC Plus2 specific implementation
    return analogRead(35) * 2 * 3.3f / 4095.0f; // Approximate voltage divider
}

uint8_t PowerLogger::getBatteryPercentage() {
    float voltage = getBatteryVoltage();
    // Simple linear mapping (adjust based on actual battery characteristics)
    if (voltage >= 4.2f) return 100;
    if (voltage <= 3.3f) return 0;
    return (uint8_t)((voltage - 3.3f) / (4.2f - 3.3f) * 100);
}

bool PowerLogger::isBatteryLow() {
    return getBatteryPercentage() <= m_config.batteryLowThreshold;
}

String PowerLogger::getDeviceId() const {
    return m_config.deviceId;
}

String PowerLogger::getDeviceInfo() {
    DynamicJsonDocument doc(512);
    
    doc["device_id"] = m_config.deviceId;
    doc["model"] = DEVICE_MODEL;
    doc["firmware_version"] = FIRMWARE_VERSION;
    doc["uptime_ms"] = millis() - m_bootTime;
    doc["battery_percentage"] = getBatteryPercentage();
    doc["battery_voltage"] = getBatteryVoltage();
    doc["wifi_connected"] = isWiFiConnected();
    doc["local_ip"] = getLocalIP();
    doc["signal_strength"] = getSignalStrength();
    doc["free_heap"] = ESP.getFreeHeap();
    doc["chip_revision"] = ESP.getChipRevision();
    
    String result;
    serializeJson(doc, result);
    return result;
}

// Private methods implementation

void PowerLogger::initializeDeviceId() {
    if (m_config.deviceId.isEmpty()) {
        uint64_t chipId = ESP.getEfuseMac();
        m_config.deviceId = String(DEVICE_ID_PREFIX) + String((uint32_t)(chipId >> 16), HEX);
    }
}

void PowerLogger::initializeTime() {
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    logMessage(LOG_LEVEL_INFO, "Time synchronization initiated");
}

bool PowerLogger::checkWiFiConnection() {
    if (WiFi.status() != WL_CONNECTED) {
        if (m_wifiConnected) {
            m_wifiConnected = false;
            setSystemStatus(SystemStatus::WIFI_DISCONNECTED);
            logMessage(LOG_LEVEL_WARN, "WiFi connection lost");
            
            if (m_onWiFiDisconnected) {
                m_onWiFiDisconnected();
            }
        }
        
        // Attempt to reconnect
        return connectWiFi();
    }
    
    return true;
}

void PowerLogger::handleWiFiEvents() {
    // Handle WiFi events if needed
}

void PowerLogger::checkBatteryStatus() {
    float currentVoltage = getBatteryVoltage();
    uint8_t percentage = getBatteryPercentage();
    
    // Check for low battery
    if (isBatteryLow() && !m_lastBatteryVoltage || (m_lastBatteryVoltage > m_config.batteryLowThreshold && percentage <= m_config.batteryLowThreshold)) {
        logMessage(LOG_LEVEL_WARN, "Battery low: " + String(percentage) + "%");
        logPowerEvent(PowerEventType::BATTERY_LOW, "Battery at " + String(percentage) + "%");
        
        if (m_onBatteryLow) {
            m_onBatteryLow(percentage);
        }
    }
    
    m_lastBatteryVoltage = currentVoltage;
}

bool PowerLogger::validateConfig() {
    if (m_config.wifiSSID.isEmpty()) {
        logMessage(LOG_LEVEL_ERROR, "WiFi SSID not configured");
        return false;
    }
    
    if (m_config.httpEndpoint.isEmpty()) {
        logMessage(LOG_LEVEL_ERROR, "HTTP endpoint not configured");
        return false;
    }
    
    return true;
}

String PowerLogger::generateEventPayload(PowerEventType eventType, const String& message) {
    DynamicJsonDocument doc(JSON_BUFFER_SIZE);
    createEventJson(doc, eventType, message);
    
    String result;
    serializeJson(doc, result);
    return result;
}

String PowerLogger::getCurrentTimestamp() {
    struct tm timeInfo;
    if (getLocalTime(&timeInfo)) {
        char timestamp[64];
        strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeInfo);
        return String(timestamp);
    }
    return String(millis()); // Fallback to millis if time not available
}

void PowerLogger::logMessage(uint8_t level, const String& message) {
    if (level <= m_config.logLevel) {
        String prefix;
        switch (level) {
            case LOG_LEVEL_ERROR: prefix = "[ERROR] "; break;
            case LOG_LEVEL_WARN:  prefix = "[WARN]  "; break;
            case LOG_LEVEL_INFO:  prefix = "[INFO]  "; break;
            case LOG_LEVEL_DEBUG: prefix = "[DEBUG] "; break;
            default: prefix = "[LOG]   "; break;
        }
        
        Serial.println(prefix + getCurrentTimestamp() + ": " + message);
    }
}

bool PowerLogger::retryHttpRequest(const JsonDocument& payload) {
    delay(HTTP_RETRY_BASE_DELAY * m_httpRetryCount);
    return sendHttpRequest(payload);
}

void PowerLogger::handleSystemError(const String& error) {
    setSystemStatus(SystemStatus::ERROR);
    logMessage(LOG_LEVEL_ERROR, "System error: " + error);
    
    if (m_onSystemError) {
        m_onSystemError(error);
    }
    
    // Log error event if possible
    if (m_isInitialized) {
        logPowerEvent(PowerEventType::SYSTEM_ERROR, error);
    }
}

bool PowerLogger::detectPowerStateChange() {
    bool currentPowerState = (getBatteryVoltage() > 4.0f);
    return currentPowerState != m_lastPowerState;
}

void PowerLogger::processPowerStateChange(bool isPluggedIn) {
    if (isPluggedIn) {
        logMessage(LOG_LEVEL_INFO, "Power connected");
        logPowerEvent(PowerEventType::POWER_ON, "External power connected");
    } else {
        logMessage(LOG_LEVEL_INFO, "Power disconnected");
        logPowerEvent(PowerEventType::POWER_OFF, "External power disconnected");
    }
}

String PowerLogger::getLocalIP() {
    return WiFi.localIP().toString();
}

int32_t PowerLogger::getSignalStrength() {
    return WiFi.RSSI();
}

bool PowerLogger::createEventJson(JsonDocument& doc, PowerEventType eventType, const String& message) {
    doc["device_id"] = m_config.deviceId;
    doc["timestamp"] = getCurrentTimestamp();
    doc["uptime_ms"] = millis() - m_bootTime;
    
    switch (eventType) {
        case PowerEventType::POWER_ON:
            doc["event_type"] = "power_on";
            break;
        case PowerEventType::POWER_OFF:
            doc["event_type"] = "power_off";
            break;
        case PowerEventType::BATTERY_LOW:
            doc["event_type"] = "battery_low";
            break;
        case PowerEventType::SYSTEM_ERROR:
            doc["event_type"] = "system_error";
            break;
        case PowerEventType::WIFI_RECONNECTED:
            doc["event_type"] = "wifi_reconnected";
            break;
        default:
            doc["event_type"] = "unknown";
            break;
    }
    
    doc["message"] = message;
    doc["battery_percentage"] = getBatteryPercentage();
    doc["battery_voltage"] = getBatteryVoltage();
    doc["wifi_signal_strength"] = getSignalStrength();
    doc["free_heap"] = ESP.getFreeHeap();
    
    return true;
}

// Callback setters
void PowerLogger::onWiFiConnected(std::function<void()> callback) {
    m_onWiFiConnected = callback;
}

void PowerLogger::onWiFiDisconnected(std::function<void()> callback) {
    m_onWiFiDisconnected = callback;
}

void PowerLogger::onHttpSuccess(std::function<void(const String&)> callback) {
    m_onHttpSuccess = callback;
}

void PowerLogger::onHttpError(std::function<void(const String&)> callback) {
    m_onHttpError = callback;
}

void PowerLogger::onBatteryLow(std::function<void(uint8_t)> callback) {
    m_onBatteryLow = callback;
}

void PowerLogger::onSystemError(std::function<void(const String&)> callback) {
    m_onSystemError = callback;
}