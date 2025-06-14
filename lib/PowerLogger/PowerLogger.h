#ifndef POWER_LOGGER_H
#define POWER_LOGGER_H

#include <M5StickCPlus.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>
#include <functional>
#include "../../include/config.h"

class PowerLogger {
public:
    // Constructor
    PowerLogger(const DeviceConfig& config);
    
    // Destructor
    ~PowerLogger();
    
    // Initialization
    bool begin();
    
    // Main loop processing
    void loop();
    
    // Event logging
    bool logPowerEvent(PowerEventType eventType, const String& message = "");
    
    // WiFi management
    bool connectWiFi();
    bool isWiFiConnected();
    void disconnectWiFi();
    
    // HTTP communication
    bool sendHttpRequest(const JsonDocument& payload);
    
    // Status management
    SystemStatus getSystemStatus() const;
    void setSystemStatus(SystemStatus status);
    
    // Battery management
    float getBatteryVoltage();
    uint8_t getBatteryPercentage();
    bool isBatteryLow();
    
    // Device information
    String getDeviceId() const;
    String getDeviceInfo();
    
    // Callback setters
    void onWiFiConnected(std::function<void()> callback);
    void onWiFiDisconnected(std::function<void()> callback);
    void onHttpSuccess(std::function<void(const String&)> callback);
    void onHttpError(std::function<void(const String&)> callback);
    void onBatteryLow(std::function<void(uint8_t)> callback);
    void onSystemError(std::function<void(const String&)> callback);

private:
    DeviceConfig m_config;
    SystemStatus m_systemStatus;
    HTTPClient m_httpClient;
    WiFiClient m_wifiClient;
    
    // Timing variables
    unsigned long m_lastWiFiCheck;
    unsigned long m_lastBatteryCheck;
    unsigned long m_lastHttpRetry;
    unsigned long m_bootTime;
    
    // State variables
    bool m_isInitialized;
    bool m_wifiConnected;
    uint8_t m_httpRetryCount;
    float m_lastBatteryVoltage;
    bool m_lastPowerState;
    
    // Callback functions
    std::function<void()> m_onWiFiConnected;
    std::function<void()> m_onWiFiDisconnected;
    std::function<void(const String&)> m_onHttpSuccess;
    std::function<void(const String&)> m_onHttpError;
    std::function<void(uint8_t)> m_onBatteryLow;
    std::function<void(const String&)> m_onSystemError;
    
    // Private methods
    void initializeDeviceId();
    void initializeTime();
    bool checkWiFiConnection();
    void handleWiFiEvents();
    void checkBatteryStatus();
    bool validateConfig();
    String generateEventPayload(PowerEventType eventType, const String& message);
    String getCurrentTimestamp();
    void logMessage(uint8_t level, const String& message);
    bool retryHttpRequest(const JsonDocument& payload);
    void handleSystemError(const String& error);
    
    // Power state management
    bool detectPowerStateChange();
    void processPowerStateChange(bool isPluggedIn);
    
    // Network utilities
    String getLocalIP();
    int32_t getSignalStrength();
    
    // JSON utilities
    bool createEventJson(JsonDocument& doc, PowerEventType eventType, const String& message);
    
    // Constants
    static const uint16_t JSON_BUFFER_SIZE = 1024;
    static const uint32_t WIFI_CHECK_INTERVAL = 30000; // 30 seconds
    static const uint32_t BATTERY_CHECK_INTERVAL = 10000; // 10 seconds
    static const uint32_t HTTP_RETRY_BASE_DELAY = 1000; // 1 second
};

#endif // POWER_LOGGER_H
