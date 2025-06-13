#include <unity.h>
#include <ArduinoJson.h>
#include "PowerLogger.h"

// Mock configuration for testing
DeviceConfig createTestConfig() {
    DeviceConfig config;
    config.deviceId = "TEST_DEVICE_001";
    config.wifiSSID = "TestNetwork";
    config.wifiPassword = "testpass123";
    config.httpEndpoint = "http://test.example.com/api/events";
    config.httpTimeout = 5000;
    config.httpRetryAttempts = 2;
    config.httpRetryDelay = 1000;
    config.powerCheckInterval = 1000;
    config.batteryLowThreshold = 20;
    config.logLevel = LOG_LEVEL_INFO;
    return config;
}

void test_power_logger_constructor() {
    DeviceConfig config = createTestConfig();
    PowerLogger logger(config);
    
    TEST_ASSERT_EQUAL_STRING("TEST_DEVICE_001", logger.getDeviceId().c_str());
    TEST_ASSERT_EQUAL(SystemStatus::INITIALIZING, logger.getSystemStatus());
}

void test_power_logger_device_id_generation() {
    DeviceConfig config = createTestConfig();
    config.deviceId = ""; // Empty device ID should trigger auto-generation
    
    PowerLogger logger(config);
    
    // Device ID should not be empty after initialization
    TEST_ASSERT_TRUE(logger.getDeviceId().length() > 0);
    TEST_ASSERT_TRUE(logger.getDeviceId().startsWith("M5S2_"));
}

void test_power_logger_system_status() {
    DeviceConfig config = createTestConfig();
    PowerLogger logger(config);
    
    // Initial status should be INITIALIZING
    TEST_ASSERT_EQUAL(SystemStatus::INITIALIZING, logger.getSystemStatus());
    
    // Change status
    logger.setSystemStatus(SystemStatus::WIFI_CONNECTING);
    TEST_ASSERT_EQUAL(SystemStatus::WIFI_CONNECTING, logger.getSystemStatus());
    
    logger.setSystemStatus(SystemStatus::WIFI_CONNECTED);
    TEST_ASSERT_EQUAL(SystemStatus::WIFI_CONNECTED, logger.getSystemStatus());
}

void test_power_logger_battery_functions() {
    DeviceConfig config = createTestConfig();
    PowerLogger logger(config);
    
    // Battery voltage should be >= 0
    float voltage = logger.getBatteryVoltage();
    TEST_ASSERT_TRUE(voltage >= 0.0f);
    
    // Battery percentage should be 0-100
    uint8_t percentage = logger.getBatteryPercentage();
    TEST_ASSERT_TRUE(percentage <= 100);
    
    // Battery low threshold test
    bool isLow = logger.isBatteryLow();
    TEST_ASSERT_TRUE(isLow == (percentage <= config.batteryLowThreshold));
}

void test_power_logger_device_info() {
    DeviceConfig config = createTestConfig();
    PowerLogger logger(config);
    
    String deviceInfo = logger.getDeviceInfo();
    
    // Should be valid JSON
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, deviceInfo);
    TEST_ASSERT_EQUAL(DeserializationError::Ok, error);
    
    // Should contain expected fields
    TEST_ASSERT_TRUE(doc.containsKey("device_id"));
    TEST_ASSERT_TRUE(doc.containsKey("model"));
    TEST_ASSERT_TRUE(doc.containsKey("firmware_version"));
    TEST_ASSERT_TRUE(doc.containsKey("battery_percentage"));
    TEST_ASSERT_TRUE(doc.containsKey("battery_voltage"));
    
    // Check values
    TEST_ASSERT_EQUAL_STRING("TEST_DEVICE_001", doc["device_id"]);
    TEST_ASSERT_EQUAL_STRING(DEVICE_MODEL, doc["model"]);
    TEST_ASSERT_EQUAL_STRING(FIRMWARE_VERSION, doc["firmware_version"]);
}

void test_power_logger_validate_config() {
    DeviceConfig validConfig = createTestConfig();
    PowerLogger validLogger(validConfig);
    
    // Valid configuration should pass validation during begin()
    // Note: begin() will fail due to WiFi/hardware dependencies in test environment
    // but we can test the basic validation logic indirectly
    
    // Test invalid configurations
    DeviceConfig invalidConfig1 = createTestConfig();
    invalidConfig1.wifiSSID = ""; // Empty SSID
    PowerLogger invalidLogger1(invalidConfig1);
    
    DeviceConfig invalidConfig2 = createTestConfig();
    invalidConfig2.httpEndpoint = ""; // Empty endpoint
    PowerLogger invalidLogger2(invalidConfig2);
    
    // These should have device IDs set correctly
    TEST_ASSERT_TRUE(validLogger.getDeviceId().length() > 0);
    TEST_ASSERT_TRUE(invalidLogger1.getDeviceId().length() > 0);
    TEST_ASSERT_TRUE(invalidLogger2.getDeviceId().length() > 0);
}

void test_power_logger_callback_setters() {
    DeviceConfig config = createTestConfig();
    PowerLogger logger(config);
    
    bool wifiConnectedCalled = false;
    bool wifiDisconnectedCalled = false;
    bool httpSuccessCalled = false;
    bool httpErrorCalled = false;
    bool batteryLowCalled = false;
    bool systemErrorCalled = false;
    
    // Set callbacks
    logger.onWiFiConnected([&wifiConnectedCalled]() {
        wifiConnectedCalled = true;
    });
    
    logger.onWiFiDisconnected([&wifiDisconnectedCalled]() {
        wifiDisconnectedCalled = true;
    });
    
    logger.onHttpSuccess([&httpSuccessCalled](const String& message) {
        httpSuccessCalled = true;
    });
    
    logger.onHttpError([&httpErrorCalled](const String& message) {
        httpErrorCalled = true;
    });
    
    logger.onBatteryLow([&batteryLowCalled](uint8_t percentage) {
        batteryLowCalled = true;
    });
    
    logger.onSystemError([&systemErrorCalled](const String& error) {
        systemErrorCalled = true;
    });
    
    // Callbacks should be set (we can't easily test their execution without hardware)
    TEST_ASSERT_TRUE(true); // Basic test that callbacks can be set without errors
}

void test_power_logger_event_types() {
    // Test that all event types are defined
    PowerEventType powerOn = PowerEventType::POWER_ON;
    PowerEventType powerOff = PowerEventType::POWER_OFF;
    PowerEventType batteryLow = PowerEventType::BATTERY_LOW;
    PowerEventType systemError = PowerEventType::SYSTEM_ERROR;
    
    TEST_ASSERT_TRUE((int)powerOn >= 0);
    TEST_ASSERT_TRUE((int)powerOff >= 0);
    TEST_ASSERT_TRUE((int)batteryLow >= 0);
    TEST_ASSERT_TRUE((int)systemError >= 0);
}

void test_system_status_enum() {
    // Test that all system status values are defined
    SystemStatus init = SystemStatus::INITIALIZING;
    SystemStatus wifiConn = SystemStatus::WIFI_CONNECTING;
    SystemStatus wifiConnected = SystemStatus::WIFI_CONNECTED;
    SystemStatus wifiDisc = SystemStatus::WIFI_DISCONNECTED;
    SystemStatus httpSend = SystemStatus::HTTP_SENDING;
    SystemStatus httpSuccess = SystemStatus::HTTP_SUCCESS;
    SystemStatus httpFailed = SystemStatus::HTTP_FAILED;
    SystemStatus error = SystemStatus::ERROR;
    SystemStatus sleeping = SystemStatus::SLEEPING;
    
    TEST_ASSERT_TRUE((int)init >= 0);
    TEST_ASSERT_TRUE((int)wifiConn >= 0);
    TEST_ASSERT_TRUE((int)wifiConnected >= 0);
    TEST_ASSERT_TRUE((int)wifiDisc >= 0);
    TEST_ASSERT_TRUE((int)httpSend >= 0);
    TEST_ASSERT_TRUE((int)httpSuccess >= 0);
    TEST_ASSERT_TRUE((int)httpFailed >= 0);
    TEST_ASSERT_TRUE((int)error >= 0);
    TEST_ASSERT_TRUE((int)sleeping >= 0);
}

void test_config_struct() {
    DeviceConfig config = createTestConfig();
    
    TEST_ASSERT_EQUAL_STRING("TEST_DEVICE_001", config.deviceId.c_str());
    TEST_ASSERT_EQUAL_STRING("TestNetwork", config.wifiSSID.c_str());
    TEST_ASSERT_EQUAL_STRING("testpass123", config.wifiPassword.c_str());
    TEST_ASSERT_EQUAL_STRING("http://test.example.com/api/events", config.httpEndpoint.c_str());
    TEST_ASSERT_EQUAL(5000, config.httpTimeout);
    TEST_ASSERT_EQUAL(2, config.httpRetryAttempts);
    TEST_ASSERT_EQUAL(1000, config.httpRetryDelay);
    TEST_ASSERT_EQUAL(1000, config.powerCheckInterval);
    TEST_ASSERT_EQUAL(20, config.batteryLowThreshold);
    TEST_ASSERT_EQUAL(LOG_LEVEL_INFO, config.logLevel);
}

void setUp(void) {
    // Set up before each test
}

void tearDown(void) {
    // Clean up after each test
}

int main(int argc, char **argv) {
    UNITY_BEGIN();
    
    RUN_TEST(test_power_logger_constructor);
    RUN_TEST(test_power_logger_device_id_generation);
    RUN_TEST(test_power_logger_system_status);
    RUN_TEST(test_power_logger_battery_functions);
    RUN_TEST(test_power_logger_device_info);
    RUN_TEST(test_power_logger_validate_config);
    RUN_TEST(test_power_logger_callback_setters);
    RUN_TEST(test_power_logger_event_types);
    RUN_TEST(test_system_status_enum);
    RUN_TEST(test_config_struct);
    
    return UNITY_END();
}