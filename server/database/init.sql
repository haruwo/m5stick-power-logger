-- Power Logger Database Schema
-- Time-series optimized for M5StickC Plus2 data

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Devices table
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Power events table (main time-series data)
CREATE TABLE power_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    uptime_ms BIGINT,
    event_type VARCHAR(50) NOT NULL,
    message TEXT,
    battery_percentage INTEGER,
    battery_voltage DECIMAL(5,3),
    wifi_signal_strength INTEGER,
    free_heap BIGINT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_power_events_device_id ON power_events(device_id);
CREATE INDEX idx_power_events_timestamp ON power_events(timestamp DESC);
CREATE INDEX idx_power_events_event_type ON power_events(event_type);
CREATE INDEX idx_power_events_device_timestamp ON power_events(device_id, timestamp DESC);
CREATE INDEX idx_power_events_metadata_gin ON power_events USING GIN(metadata);

-- Power sessions table (for gantt chart display)
CREATE TABLE power_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) NOT NULL,
    session_start TIMESTAMP WITH TIME ZONE NOT NULL,
    session_end TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    start_battery_percentage INTEGER,
    end_battery_percentage INTEGER,
    total_events INTEGER DEFAULT 0,
    session_type VARCHAR(50) DEFAULT 'power_cycle',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_power_sessions_device_id ON power_sessions(device_id);
CREATE INDEX idx_power_sessions_start ON power_sessions(session_start DESC);
CREATE INDEX idx_power_sessions_end ON power_sessions(session_end DESC);

-- Statistics and analytics views
CREATE VIEW device_stats AS
SELECT 
    device_id,
    COUNT(*) as total_events,
    COUNT(DISTINCT DATE(timestamp)) as active_days,
    MIN(timestamp) as first_event,
    MAX(timestamp) as last_event,
    AVG(battery_percentage) as avg_battery,
    AVG(wifi_signal_strength) as avg_wifi_signal
FROM power_events 
GROUP BY device_id;

CREATE VIEW daily_event_summary AS
SELECT 
    device_id,
    DATE(timestamp) as event_date,
    COUNT(*) as event_count,
    COUNT(CASE WHEN event_type = 'power_on' THEN 1 END) as power_on_count,
    COUNT(CASE WHEN event_type = 'power_off' THEN 1 END) as power_off_count,
    AVG(battery_percentage) as avg_battery,
    MIN(battery_percentage) as min_battery,
    MAX(battery_percentage) as max_battery
FROM power_events 
GROUP BY device_id, DATE(timestamp)
ORDER BY device_id, event_date DESC;

-- Trigger to automatically create/update power sessions
CREATE OR REPLACE FUNCTION update_power_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle power_on events
    IF NEW.event_type = 'power_on' THEN
        -- End any open session for this device
        UPDATE power_sessions 
        SET session_end = NEW.timestamp,
            duration_minutes = EXTRACT(EPOCH FROM (NEW.timestamp - session_start))/60,
            end_battery_percentage = NEW.battery_percentage,
            updated_at = NOW()
        WHERE device_id = NEW.device_id 
        AND session_end IS NULL;
        
        -- Start new session
        INSERT INTO power_sessions (
            device_id, session_start, start_battery_percentage, session_type
        ) VALUES (
            NEW.device_id, NEW.timestamp, NEW.battery_percentage, 'power_cycle'
        );
    END IF;
    
    -- Handle power_off events
    IF NEW.event_type = 'power_off' THEN
        UPDATE power_sessions 
        SET session_end = NEW.timestamp,
            duration_minutes = EXTRACT(EPOCH FROM (NEW.timestamp - session_start))/60,
            end_battery_percentage = NEW.battery_percentage,
            updated_at = NOW()
        WHERE device_id = NEW.device_id 
        AND session_end IS NULL;
    END IF;
    
    -- Update event count for current session
    UPDATE power_sessions 
    SET total_events = total_events + 1,
        updated_at = NOW()
    WHERE device_id = NEW.device_id 
    AND session_start <= NEW.timestamp 
    AND (session_end IS NULL OR session_end >= NEW.timestamp);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_power_sessions
    AFTER INSERT ON power_events
    FOR EACH ROW
    EXECUTE FUNCTION update_power_sessions();

-- Sample data for testing
INSERT INTO devices (device_id, name, description, location) VALUES
('M5S2_12345678', 'Office Device 1', 'Main office power monitoring', 'Tokyo Office'),
('M5S2_87654321', 'Office Device 2', 'Server room monitoring', 'Tokyo Server Room');

-- Insert sample events
INSERT INTO power_events (device_id, timestamp, event_type, message, battery_percentage, battery_voltage, wifi_signal_strength, free_heap) VALUES
('M5S2_12345678', NOW() - INTERVAL '2 hours', 'power_on', 'External power connected', 85, 4.12, -45, 245760),
('M5S2_12345678', NOW() - INTERVAL '1 hour', 'power_off', 'External power disconnected', 83, 4.08, -47, 243520),
('M5S2_12345678', NOW() - INTERVAL '30 minutes', 'power_on', 'External power connected', 82, 4.05, -44, 244890);