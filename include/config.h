#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>
#include "config_local.h"

// Device Configuration
#define DEVICE_MODEL "M5StickCPlus2"
#define FIRMWARE_VERSION "1.0.0"

// WiFi Configuration
// WiFi credentials are now defined in local.h
#define WIFI_TIMEOUT_MS 10000
#define WIFI_RETRY_DELAY_MS 5000

// HTTP Configuration
// HTTP endpoint is now defined in local.h
#define HTTP_TIMEOUT_MS 5000
#define HTTP_RETRY_ATTEMPTS 3
#define HTTP_RETRY_DELAY_MS 2000

// Device ID Configuration
// Generate unique ID based on ESP32 chip ID if not defined
#ifndef DEVICE_ID
#define DEVICE_ID_PREFIX "M5S2_"
#endif

// Power Management
#define POWER_CHECK_INTERVAL_MS 1000
#define BATTERY_LOW_THRESHOLD 20
#define DEEP_SLEEP_DURATION_US 60000000 // 60 seconds

// Logging Configuration
#define LOG_LEVEL_DEBUG 4
#define LOG_LEVEL_INFO 3
#define LOG_LEVEL_WARN 2
#define LOG_LEVEL_ERROR 1
#define LOG_LEVEL_NONE 0

#ifndef LOG_LEVEL
#define LOG_LEVEL LOG_LEVEL_INFO
#endif

// Display Configuration
#define DISPLAY_BRIGHTNESS 100
#define DISPLAY_TIMEOUT_MS 30000
#define STATUS_UPDATE_INTERVAL_MS 2000

// Event Types
enum class PowerEventType {
    POWER_ON,
    POWER_OFF,
    BATTERY_LOW,
    SYSTEM_ERROR
};

// System Status
enum class SystemStatus {
    INITIALIZING,
    WIFI_CONNECTING,
    WIFI_CONNECTED,
    WIFI_DISCONNECTED,
    HTTP_SENDING,
    HTTP_SUCCESS,
    HTTP_FAILED,
    ERROR,
    SLEEPING
};

// Configuration structure for runtime settings
struct DeviceConfig {
    String deviceId;
    String wifiSSID;
    String wifiPassword;
    String httpEndpoint;
    uint16_t httpTimeout;
    uint8_t httpRetryAttempts;
    uint16_t httpRetryDelay;
    uint32_t powerCheckInterval;
    uint8_t batteryLowThreshold;
    uint8_t logLevel;
};

#endif // CONFIG_H
