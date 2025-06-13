#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// HTTP Endpoint Configuration
#define HTTP_SERVER_URL "http://192.168.1.100:8080/api/power-events"
#define HTTP_TIMEOUT 10000

// Device Configuration
#define DEVICE_ID_PREFIX "M5STICK_"
#define POWER_CHECK_INTERVAL 1000  // ms

// Power thresholds
#define POWER_ON_THRESHOLD 4.0   // V
#define POWER_OFF_THRESHOLD 3.5  // V

#endif