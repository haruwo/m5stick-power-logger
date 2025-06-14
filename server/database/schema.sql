-- Create database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
    device_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mac_address VARCHAR(17) UNIQUE NOT NULL,
    location VARCHAR(255),
    model VARCHAR(100) DEFAULT 'M5StickC Plus2',
    firmware_version VARCHAR(50),
    battery_percentage INTEGER CHECK (battery_percentage >= 0 AND battery_percentage <= 100),
    battery_voltage DECIMAL(4,2),
    wifi_signal_strength INTEGER,
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create power_events table
CREATE TABLE IF NOT EXISTS power_events (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('power_on', 'power_off', 'battery_low', 'system_error', 'data_sync')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    battery_percentage INTEGER CHECK (battery_percentage >= 0 AND battery_percentage <= 100),
    battery_voltage DECIMAL(4,2),
    wifi_signal_strength INTEGER,
    additional_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_power_events_device_timestamp 
ON power_events (device_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_power_events_timestamp_type 
ON power_events (timestamp DESC, event_type);

CREATE INDEX IF NOT EXISTS idx_devices_last_seen 
ON devices (last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_devices_mac_address 
ON devices (mac_address);

CREATE INDEX IF NOT EXISTS idx_power_events_event_type 
ON power_events (event_type);

-- Create a view for daily statistics
CREATE OR REPLACE VIEW daily_power_stats AS
SELECT 
    DATE(timestamp) as date,
    device_id,
    COUNT(*) as total_events,
    COUNT(CASE WHEN event_type = 'power_on' THEN 1 END) as power_on_count,
    COUNT(CASE WHEN event_type = 'power_off' THEN 1 END) as power_off_count,
    COUNT(CASE WHEN event_type = 'battery_low' THEN 1 END) as battery_low_count,
    COUNT(CASE WHEN event_type = 'system_error' THEN 1 END) as system_error_count,
    AVG(battery_percentage) as avg_battery_percentage,
    MIN(battery_percentage) as min_battery_percentage,
    MAX(battery_percentage) as max_battery_percentage,
    AVG(wifi_signal_strength) as avg_wifi_signal_strength
FROM power_events
GROUP BY DATE(timestamp), device_id
ORDER BY date DESC, device_id;

-- Create a view for device health summary
CREATE OR REPLACE VIEW device_health_summary AS
SELECT 
    d.device_id,
    d.name,
    d.model,
    d.last_seen,
    d.battery_percentage,
    d.battery_voltage,
    d.wifi_signal_strength,
    d.is_active,
    COUNT(pe.id) as total_events,
    MAX(pe.timestamp) as last_event,
    COUNT(CASE WHEN pe.event_type = 'system_error' THEN 1 END) as error_count,
    COUNT(CASE WHEN pe.event_type = 'battery_low' THEN 1 END) as battery_low_count
FROM devices d
LEFT JOIN power_events pe ON d.device_id = pe.device_id
GROUP BY d.device_id, d.name, d.model, d.last_seen, d.battery_percentage, 
         d.battery_voltage, d.wifi_signal_strength, d.is_active
ORDER BY d.last_seen DESC;

-- Insert sample data for testing
INSERT INTO devices (name, mac_address, location, model, battery_percentage, wifi_signal_strength, is_active) 
VALUES 
    ('M5Stick-01', 'AA:BB:CC:DD:EE:01', 'Living Room', 'M5StickC Plus2', 85, -45, true),
    ('M5Stick-02', 'AA:BB:CC:DD:EE:02', 'Kitchen', 'M5StickC Plus2', 92, -38, true),
    ('M5Stick-03', 'AA:BB:CC:DD:EE:03', 'Bedroom', 'M5StickC Plus2', 67, -52, false)
ON CONFLICT (mac_address) DO NOTHING;

-- Insert sample power events
INSERT INTO power_events (device_id, event_type, battery_percentage, wifi_signal_strength, timestamp)
SELECT 
    d.device_id,
    CASE (random() * 4)::int
        WHEN 0 THEN 'power_on'
        WHEN 1 THEN 'power_off'
        WHEN 2 THEN 'battery_low'
        ELSE 'data_sync'
    END,
    (50 + random() * 50)::int,
    (-80 + random() * 40)::int,
    CURRENT_TIMESTAMP - (random() * INTERVAL '7 days')
FROM devices d, generate_series(1, 10) g
WHERE d.device_id <= 3;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO power_logger_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO power_logger_user;
GRANT USAGE ON SCHEMA public TO power_logger_user;