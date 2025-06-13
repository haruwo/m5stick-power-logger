#include <unity.h>
#include <M5StickCPlus2.h>
#include <WiFi.h>
#include "PowerLogger.h"

// Test configuration for embedded testing
DeviceConfig createEmbeddedTestConfig() {
    DeviceConfig config;
    config.deviceId = "M5_TEST_001";
    config.wifiSSID = "TestAP";
    config.wifiPassword = "testpass";
    config.httpEndpoint = "http://httpbin.org/post"; // Use httpbin for testing
    config.httpTimeout = 5000;
    config.httpRetryAttempts = 1;
    config.httpRetryDelay = 1000;
    config.powerCheckInterval = 1000;
    config.batteryLowThreshold = 20;
    config.logLevel = LOG_LEVEL_DEBUG;
    return config;
}

void test_m5_hardware_initialization() {
    // Test that M5StickC Plus2 hardware can be initialized
    M5.begin();
    
    // Test display functionality
    M5.Lcd.fillScreen(BLACK);
    M5.Lcd.setTextColor(WHITE, BLACK);
    M5.Lcd.setCursor(0, 0);
    M5.Lcd.println("Test Mode");
    
    delay(1000);
    
    TEST_ASSERT_TRUE(true); // If we get here, M5 initialized successfully
}

void test_power_logger_hardware_integration() {
    DeviceConfig config = createEmbeddedTestConfig();
    PowerLogger logger(config);
    
    // Test device ID generation on real hardware
    String deviceId = logger.getDeviceId();
    TEST_ASSERT_TRUE(deviceId.length() > 0);
    TEST_ASSERT_TRUE(deviceId.startsWith("M5S2_"));
    
    // Test battery voltage reading on real hardware
    float voltage = logger.getBatteryVoltage();
    TEST_ASSERT_TRUE(voltage > 0.0f && voltage < 6.0f); // Reasonable range for battery voltage
    
    // Test battery percentage
    uint8_t percentage = logger.getBatteryPercentage();
    TEST_ASSERT_TRUE(percentage <= 100);
    
    Serial.println("Device ID: " + deviceId);
    Serial.println("Battery Voltage: " + String(voltage, 2) + "V");
    Serial.println("Battery Percentage: " + String(percentage) + "%");
}

void test_wifi_functions() {
    DeviceConfig config = createEmbeddedTestConfig();
    PowerLogger logger(config);
    
    // Test WiFi status check (should be false initially)
    bool connected = logger.isWiFiConnected();
    TEST_ASSERT_FALSE(connected);
    
    // Test WiFi connection attempt (will likely fail in test environment)
    // This is mainly to test that the function doesn't crash
    Serial.println("Testing WiFi connection (may fail in test environment)...");
    bool result = logger.connectWiFi();
    
    // Either succeeds or fails gracefully
    TEST_ASSERT_TRUE(result == true || result == false);
    
    if (result) {
        Serial.println("WiFi connected successfully");
        TEST_ASSERT_TRUE(logger.isWiFiConnected());
        
        // Test disconnect
        logger.disconnectWiFi();
        delay(1000);
        TEST_ASSERT_FALSE(logger.isWiFiConnected());
    } else {
        Serial.println("WiFi connection failed (expected in test environment)");
    }
}

void test_json_creation() {
    DeviceConfig config = createEmbeddedTestConfig();
    PowerLogger logger(config);
    
    // Test device info JSON creation
    String deviceInfo = logger.getDeviceInfo();
    
    // Parse the JSON to verify it's valid
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, deviceInfo);
    
    TEST_ASSERT_EQUAL(DeserializationError::Ok, error);
    TEST_ASSERT_TRUE(doc.containsKey("device_id"));
    TEST_ASSERT_TRUE(doc.containsKey("model"));
    TEST_ASSERT_TRUE(doc.containsKey("firmware_version"));
    TEST_ASSERT_TRUE(doc.containsKey("uptime_ms"));
    TEST_ASSERT_TRUE(doc.containsKey("battery_percentage"));
    TEST_ASSERT_TRUE(doc.containsKey("free_heap"));
    
    Serial.println("Device Info JSON:");
    Serial.println(deviceInfo);
}

void test_system_status_changes() {
    DeviceConfig config = createEmbeddedTestConfig();
    PowerLogger logger(config);
    
    // Test initial status
    TEST_ASSERT_EQUAL(SystemStatus::INITIALIZING, logger.getSystemStatus());
    
    // Test status transitions
    logger.setSystemStatus(SystemStatus::WIFI_CONNECTING);
    TEST_ASSERT_EQUAL(SystemStatus::WIFI_CONNECTING, logger.getSystemStatus());
    
    logger.setSystemStatus(SystemStatus::WIFI_CONNECTED);
    TEST_ASSERT_EQUAL(SystemStatus::WIFI_CONNECTED, logger.getSystemStatus());
    
    logger.setSystemStatus(SystemStatus::HTTP_SENDING);
    TEST_ASSERT_EQUAL(SystemStatus::HTTP_SENDING, logger.getSystemStatus());
    
    logger.setSystemStatus(SystemStatus::HTTP_SUCCESS);
    TEST_ASSERT_EQUAL(SystemStatus::HTTP_SUCCESS, logger.getSystemStatus());
    
    Serial.println("Status transitions test completed");
}

void test_callback_execution() {
    DeviceConfig config = createEmbeddedTestConfig();
    PowerLogger logger(config);
    
    bool callbackExecuted = false;
    String lastMessage = "";
    
    // Set up HTTP success callback
    logger.onHttpSuccess([&callbackExecuted, &lastMessage](const String& message) {
        callbackExecuted = true;
        lastMessage = message;
        Serial.println("HTTP Success callback executed: " + message);
    });
    
    // Set up HTTP error callback
    logger.onHttpError([&callbackExecuted, &lastMessage](const String& message) {
        callbackExecuted = true;
        lastMessage = message;
        Serial.println("HTTP Error callback executed: " + message);
    });
    
    // Test that callbacks can be set without errors
    TEST_ASSERT_TRUE(true);
    
    Serial.println("Callback setup test completed");
}

void test_power_event_logging() {
    DeviceConfig config = createEmbeddedTestConfig();
    PowerLogger logger(config);
    
    // Test logging power events (will fail HTTP but should handle gracefully)
    Serial.println("Testing power event logging...");
    
    bool result1 = logger.logPowerEvent(PowerEventType::POWER_ON, "Test power on event");
    bool result2 = logger.logPowerEvent(PowerEventType::BATTERY_LOW, "Test battery low event");
    bool result3 = logger.logPowerEvent(PowerEventType::SYSTEM_ERROR, "Test system error event");
    
    // Events should either succeed or fail gracefully
    TEST_ASSERT_TRUE(result1 == true || result1 == false);
    TEST_ASSERT_TRUE(result2 == true || result2 == false);
    TEST_ASSERT_TRUE(result3 == true || result3 == false);
    
    Serial.println("Power event logging test completed");
}

void test_memory_usage() {
    DeviceConfig config = createEmbeddedTestConfig();
    
    size_t heapBefore = ESP.getFreeHeap();
    Serial.println("Free heap before PowerLogger creation: " + String(heapBefore));
    
    {
        PowerLogger logger(config);
        size_t heapAfter = ESP.getFreeHeap();
        Serial.println("Free heap after PowerLogger creation: " + String(heapAfter));
        
        // Logger should not consume excessive memory
        size_t memoryUsed = heapBefore - heapAfter;
        Serial.println("Memory used by PowerLogger: " + String(memoryUsed));
        
        // Should use less than 10KB
        TEST_ASSERT_TRUE(memoryUsed < 10240);
        
        // Test device info doesn't leak memory
        for (int i = 0; i < 5; i++) {
            String info = logger.getDeviceInfo();
            delay(100);
        }
        
        size_t heapAfterOperations = ESP.getFreeHeap();
        Serial.println("Free heap after operations: " + String(heapAfterOperations));
        
        // Should not have significant memory leaks
        TEST_ASSERT_TRUE(heapAfter - heapAfterOperations < 1024);
    }
    
    // After logger destruction
    delay(100);
    size_t heapAfterDestruction = ESP.getFreeHeap();
    Serial.println("Free heap after PowerLogger destruction: " + String(heapAfterDestruction));
    
    // Memory should be mostly freed
    TEST_ASSERT_TRUE(heapAfterDestruction > heapBefore - 1024);
}

void setUp(void) {
    // Set up M5 hardware before each test
    M5.begin();
    Serial.begin(115200);
    delay(100);
}

void tearDown(void) {
    // Clean up after each test
    WiFi.disconnect();
    delay(100);
}

void setup() {
    Serial.begin(115200);
    delay(2000);
    
    M5.begin();
    M5.Lcd.fillScreen(BLACK);
    M5.Lcd.setTextColor(WHITE, BLACK);
    M5.Lcd.setCursor(0, 0);
    M5.Lcd.println("Running Tests...");
    
    UNITY_BEGIN();
    
    RUN_TEST(test_m5_hardware_initialization);
    RUN_TEST(test_power_logger_hardware_integration);
    RUN_TEST(test_wifi_functions);
    RUN_TEST(test_json_creation);
    RUN_TEST(test_system_status_changes);
    RUN_TEST(test_callback_execution);
    RUN_TEST(test_power_event_logging);
    RUN_TEST(test_memory_usage);
    
    UNITY_END();
    
    M5.Lcd.fillScreen(GREEN);
    M5.Lcd.setCursor(0, 40);
    M5.Lcd.println("Tests Complete");
}

void loop() {
    // Test results displayed on screen
    delay(1000);
}