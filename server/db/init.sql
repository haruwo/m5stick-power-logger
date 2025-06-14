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
    ('m5stick-sample-001', 'power_on', '{"voltage": 3.3, "current": 0.5, "battery_percentage": 85}'),
    ('m5stick-sample-001', 'power_off', '{"voltage": 0.0, "current": 0.0, "battery_percentage": 83}'),
    ('m5stick-sample-002', 'power_on', '{"voltage": 3.2, "current": 0.4, "battery_percentage": 92}'),
    ('m5stick-sample-002', 'battery_low', '{"voltage": 3.1, "current": 0.3, "battery_percentage": 15}')
ON CONFLICT DO NOTHING;