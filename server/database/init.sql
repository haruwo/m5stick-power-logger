-- Create database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_power_events_device_timestamp 
ON power_events (device_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_power_events_timestamp_type 
ON power_events (timestamp DESC, event_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_devices_last_seen 
ON devices (last_seen DESC);

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

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO power_logger_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO power_logger_user;
GRANT USAGE ON SCHEMA public TO power_logger_user;