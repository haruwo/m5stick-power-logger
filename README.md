# M5StickC Plus2 Power Logger

Professional power monitoring system for M5StickC Plus2 with WiFi logging.

## Features

- **Power State Monitoring**: Auto-detect USB power connection/disconnection
- **WiFi Communication**: Stable WiFi connection with retry functionality
- **HTTP Communication**: RESTful API event transmission
- **Device Identification**: Unique ID generation for multiple device support
- **Battery Monitoring**: Low battery warnings and status monitoring
- **Intuitive Display**: LCD status display with real-time updates
- **Error Handling**: Robust error handling and retry mechanisms
- **Power Saving**: Deep sleep and display management

## Quick Start

1. Clone this repository
2. Install PlatformIO
3. Configure WiFi settings in `include/config.h`
4. Build and upload to your M5StickC Plus2

```bash
git clone https://github.com/haruwo/m5stick-power-logger.git
cd m5stick-power-logger
pio run --target upload
```

## Documentation

- [Setup Guide](docs/setup.md)
- [API Reference](docs/api.md)
- [Contributing Guide](CONTRIBUTING.md)

## License

MIT License - see [LICENSE](LICENSE) file for details.
