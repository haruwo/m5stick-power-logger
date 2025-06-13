# M5StickC Plus2 Power Logger

A professional power monitoring solution for M5StickC Plus2 devices that tracks power state changes and reports them via HTTP to a local network endpoint.

## Features

- **Power State Monitoring**: Continuously monitors battery voltage to detect power on/off events
- **WiFi Connectivity**: Connects to local WiFi network for data transmission
- **HTTP Reporting**: Sends power events to configurable HTTP endpoint via POST requests
- **Device Identification**: Each device has a unique ID for multi-device deployments
- **Real-time Display**: Shows current status, WiFi connection, and power state on device screen
- **Professional Logging**: Comprehensive serial output for debugging and monitoring

## Hardware Requirements

- M5StickC Plus2 device
- WiFi network access
- HTTP server endpoint for receiving power events

## Configuration

Edit `include/config.h` to configure:

```cpp
// WiFi settings
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// HTTP endpoint
#define HTTP_SERVER_URL "http://192.168.1.100:8080/api/power-events"

// Power thresholds (in volts)
#define POWER_ON_THRESHOLD 4.0
#define POWER_OFF_THRESHOLD 3.5
```

## HTTP API

The device sends POST requests to the configured endpoint with the following JSON payload:

```json
{
  "device_id": "M5STICK_ABC123",
  "event": "power_on", // or "power_off"
  "timestamp": 1234567890,
  "voltage": 4.12,
  "ip_address": "192.168.1.101"
}
```

## Building and Flashing

1. Install PlatformIO
2. Clone this repository
3. Configure WiFi and HTTP settings in `include/config.h`
4. Build and upload:

```bash
pio run --target upload
```

## Monitoring

Connect to serial monitor to view detailed logs:

```bash
pio device monitor
```

## Device Display

The device screen shows:
- Device ID
- WiFi connection status and IP address
- Current battery voltage
- Power state (ON/OFF)
- Uptime counter

## Multi-Device Deployment

Each device automatically generates a unique ID based on its MAC address, allowing multiple devices to operate on the same network without conflicts.

## Technical Specifications

- **Platform**: ESP32 (M5StickC Plus2)
- **Framework**: Arduino
- **Dependencies**: M5StickCPlus2, ArduinoJson, WiFi
- **Power Check Interval**: 1 second
- **HTTP Timeout**: 10 seconds
- **Serial Baud Rate**: 115200