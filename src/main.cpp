#include <M5StickCPlus2.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <esp_system.h>
#include "config.h"

// Global variables
String deviceId;
bool powerState = false;
bool lastPowerState = false;
unsigned long lastCheck = 0;
HTTPClient http;

void setup() {
    auto cfg = M5.config();
    M5.begin(cfg);
    
    Serial.begin(115200);
    delay(1000);
    
    // Generate unique device ID
    generateDeviceId();
    
    // Initialize display
    M5.Display.setRotation(1);
    M5.Display.setTextSize(1);
    M5.Display.fillScreen(BLACK);
    
    // Connect to WiFi
    connectWiFi();
    
    // Initialize power monitoring
    initPowerMonitoring();
    
    Serial.println("M5StickC Plus2 Power Logger initialized");
    Serial.println("Device ID: " + deviceId);
}

void loop() {
    M5.update();
    
    if (millis() - lastCheck > POWER_CHECK_INTERVAL) {
        checkPowerState();
        lastCheck = millis();
    }
    
    updateDisplay();
    delay(100);
}

void generateDeviceId() {
    uint64_t chipid = ESP.getEfuseMac();
    deviceId = String(DEVICE_ID_PREFIX) + String((uint32_t)(chipid >> 32), HEX);
}

void connectWiFi() {
    M5.Display.setCursor(0, 0);
    M5.Display.print("Connecting WiFi...");
    
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(1000);
        M5.Display.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("WiFi connected");
        Serial.println("IP: " + WiFi.localIP().toString());
        M5.Display.fillScreen(BLACK);
        M5.Display.setCursor(0, 0);
        M5.Display.println("WiFi Connected");
        M5.Display.println("IP: " + WiFi.localIP().toString());
    } else {
        Serial.println("WiFi connection failed");
        M5.Display.fillScreen(BLACK);
        M5.Display.setCursor(0, 0);
        M5.Display.println("WiFi Failed");
    }
    
    delay(2000);
}

void initPowerMonitoring() {
    // Initialize power monitoring
    float voltage = M5.Power.getBatteryVoltage();
    powerState = voltage > POWER_ON_THRESHOLD;
    lastPowerState = powerState;
    
    Serial.println("Initial power state: " + String(powerState ? "ON" : "OFF"));
    Serial.println("Battery voltage: " + String(voltage) + "V");
}

void checkPowerState() {
    float voltage = M5.Power.getBatteryVoltage();
    bool currentPowerState = voltage > POWER_ON_THRESHOLD;
    
    // Check for power state change
    if (currentPowerState != lastPowerState) {
        powerState = currentPowerState;
        
        String event = powerState ? "power_on" : "power_off";
        Serial.println("Power state changed: " + event);
        Serial.println("Voltage: " + String(voltage) + "V");
        
        // Send HTTP POST
        sendPowerEvent(event, voltage);
        
        lastPowerState = powerState;
    }
}

void sendPowerEvent(String event, float voltage) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi not connected, cannot send event");
        return;
    }
    
    http.begin(HTTP_SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(HTTP_TIMEOUT);
    
    // Create JSON payload
    JsonDocument doc;
    doc["device_id"] = deviceId;
    doc["event"] = event;
    doc["timestamp"] = millis();
    doc["voltage"] = voltage;
    doc["ip_address"] = WiFi.localIP().toString();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    Serial.println("Sending: " + jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.println("HTTP Response: " + String(httpResponseCode));
        Serial.println("Response: " + response);
    } else {
        Serial.println("HTTP Error: " + String(httpResponseCode));
    }
    
    http.end();
}

void updateDisplay() {
    M5.Display.fillScreen(BLACK);
    M5.Display.setCursor(0, 0);
    M5.Display.setTextColor(WHITE);
    
    // Device info
    M5.Display.println("Power Logger");
    M5.Display.println("ID: " + deviceId);
    M5.Display.println("");
    
    // WiFi status
    if (WiFi.status() == WL_CONNECTED) {
        M5.Display.setTextColor(GREEN);
        M5.Display.println("WiFi: Connected");
        M5.Display.setTextColor(WHITE);
        M5.Display.println("IP: " + WiFi.localIP().toString());
    } else {
        M5.Display.setTextColor(RED);
        M5.Display.println("WiFi: Disconnected");
        M5.Display.setTextColor(WHITE);
    }
    
    M5.Display.println("");
    
    // Power status
    float voltage = M5.Power.getBatteryVoltage();
    M5.Display.println("Battery: " + String(voltage, 2) + "V");
    
    if (powerState) {
        M5.Display.setTextColor(GREEN);
        M5.Display.println("Power: ON");
    } else {
        M5.Display.setTextColor(RED);
        M5.Display.println("Power: OFF");
    }
    
    M5.Display.setTextColor(WHITE);
    M5.Display.println("");
    M5.Display.println("Uptime: " + String(millis() / 1000) + "s");
}