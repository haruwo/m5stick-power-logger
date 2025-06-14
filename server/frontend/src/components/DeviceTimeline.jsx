import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function DeviceTimeline() {
  const { deviceId } = useParams();
  const [events, setEvents] = useState([]);
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTimeline();
    fetchDevice();
  }, [deviceId]);

  const fetchTimeline = async () => {
    try {
      const response = await fetch(`/api/power-events/device/${deviceId}/timeline`);
      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }
      const data = await response.json();
      setEvents(data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchDevice = async () => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`);
      if (response.ok) {
        const data = await response.json();
        setDevice(data);
      }
    } catch (err) {
      // デバイス情報の取得に失敗してもタイムラインは表示する
      console.warn('Failed to fetch device info:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeLabel = (eventType) => {
    const labels = {
      'power_on': '電源ON',
      'power_off': '電源OFF',
      'battery_low': 'バッテリー低下',
      'system_error': 'システムエラー'
    };
    return labels[eventType] || eventType;
  };

  const getEventTypeClass = (eventType) => {
    const classes = {
      'power_on': 'event-power-on',
      'power_off': 'event-power-off',
      'battery_low': 'event-battery-low',
      'system_error': 'event-system-error'
    };
    return classes[eventType] || 'event-default';
  };

  const formatEventData = (data) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return Object.entries(parsed).map(([key, value]) => {
        let displayValue = value;
        let displayKey = key.replace(/_/g, ' ');
        
        // Format specific fields
        if (key === 'battery_percentage') displayValue += '%';
        if (key === 'battery_voltage') displayValue += 'V';
        if (key === 'wifi_signal_strength') displayValue += 'dBm';
        if (key === 'uptime_ms') displayValue = Math.round(value / 1000) + 's';
        if (key === 'free_heap') displayValue = Math.round(value / 1024) + 'KB';
        if (key === 'client_timestamp') displayValue = new Date(value).toLocaleString();
        
        return (
          <div key={key} className="data-item">
            <span className="data-key">{displayKey}:</span>
            <span className="data-value">{displayValue}</span>
          </div>
        );
      });
    } catch (err) {
      return <span className="data-raw">{data}</span>;
    }
  };

  if (loading) return <div className="loading">Loading timeline...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="device-timeline">
      <div className="header">
        <Link to="/devices" className="back-link">← Back to Devices</Link>
        {device && (
          <Link to={`/devices/${deviceId}`} className="back-link">
            ← Back to {device.name}
          </Link>
        )}
        <h2>Power Event Timeline</h2>
        {device && (
          <p className="device-info">
            Device: <code>{device.id}</code> ({device.name})
          </p>
        )}
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <p>このデバイスには電源イベントがありません。</p>
          <p>M5StickC Plus2 から電源イベントが送信されると、ここに表示されます。</p>
        </div>
      ) : (
        <div className="timeline">
          <div className="timeline-header">
            <h3>Events ({events.length})</h3>
          </div>
          
          <div className="timeline-events">
            {events.map((event, index) => (
              <div key={event.id} className={`timeline-event ${getEventTypeClass(event.event_type)}`}>
                <div className="event-marker"></div>
                <div className="event-content">
                  <div className="event-header">
                    <span className="event-type">
                      {getEventTypeLabel(event.event_type)}
                    </span>
                    <time className="event-time" dateTime={event.timestamp}>
                      {new Date(event.timestamp).toLocaleString()}
                    </time>
                  </div>
                  
                  {event.data && (
                    <div className="event-data">
                      <div className="data-header">Data:</div>
                      <div className="data-content">
                        {formatEventData(event.data)}
                      </div>
                    </div>
                  )}
                  
                  <div className="event-meta">
                    <small>Event ID: {event.id}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceTimeline;