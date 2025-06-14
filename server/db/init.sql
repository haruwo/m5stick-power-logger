-- Legacy items table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Power events table
CREATE TABLE IF NOT EXISTS power_events (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_power_events_device_id ON power_events(device_id);
CREATE INDEX IF NOT EXISTS idx_power_events_timestamp ON power_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_power_events_event_type ON power_events(event_type);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen);

-- サンプルデータ
INSERT INTO items (name, description) VALUES
    ('サンプルアイテム1', 'これは最初のサンプルアイテムです'),
    ('サンプルアイテム2', 'これは2番目のサンプルアイテムです'),
    ('サンプルアイテム3', 'これは3番目のサンプルアイテムです')
ON CONFLICT DO NOTHING;

-- サンプルデバイスデータ
INSERT INTO devices (id, name, description) VALUES
    ('m5stick-sample-001', 'M5StickC Sample Device 1', 'Test device for development'),
    ('m5stick-sample-002', 'M5StickC Sample Device 2', 'Another test device')
ON CONFLICT DO NOTHING;

-- サンプル電源イベントデータ
INSERT INTO power_events (device_id, event_type, data) VALUES
    ('m5stick-sample-001', 'power_on', '{"client_timestamp": "2024-01-01T09:00:00Z", "uptime_ms": 5000, "message": "Device powered on", "battery_percentage": 85, "battery_voltage": 3.3, "wifi_signal_strength": -45, "free_heap": 32768}'),
    ('m5stick-sample-001', 'power_off', '{"client_timestamp": "2024-01-01T17:30:00Z", "uptime_ms": 30600000, "message": "Device shutting down", "battery_percentage": 83, "battery_voltage": 3.2, "wifi_signal_strength": -50, "free_heap": 31024}'),
    ('m5stick-sample-002', 'power_on', '{"client_timestamp": "2024-01-01T08:45:00Z", "uptime_ms": 3000, "message": "System startup", "battery_percentage": 92, "battery_voltage": 3.4, "wifi_signal_strength": -40, "free_heap": 33024}'),
    ('m5stick-sample-002', 'battery_low', '{"client_timestamp": "2024-01-01T20:15:00Z", "uptime_ms": 41700000, "message": "Battery level critical", "battery_percentage": 15, "battery_voltage": 3.1, "wifi_signal_strength": -55, "free_heap": 29568}')
ON CONFLICT DO NOTHING;