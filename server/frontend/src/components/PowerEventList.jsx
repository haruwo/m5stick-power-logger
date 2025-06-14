import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function PowerEventList() {
  const [events, setEvents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
    fetchDevices();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/power-events');
      if (!response.ok) {
        throw new Error('Failed to fetch power events');
      }
      const data = await response.json();
      setEvents(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch devices:', err);
    }
  };

  const getDeviceName = (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : deviceId;
  };

  const getEventTypeLabel = (eventType) => {
    const labels = {
      'power_on': '電源ON',
      'power_off': '電源OFF',
      'battery_low': 'バッテリー低下',
      'system_error': 'システムエラー',
      'wifi_reconnected': 'WiFi再接続',
      'periodic_status': 'ステータス更新'
    };
    return labels[eventType] || eventType;
  };

  const getEventTypeClass = (eventType) => {
    const classes = {
      'power_on': 'event-power-on',
      'power_off': 'event-power-off',
      'battery_low': 'event-battery-low',
      'system_error': 'event-system-error',
      'wifi_reconnected': 'event-wifi-reconnected',
      'periodic_status': 'event-periodic-status'
    };
    return classes[eventType] || 'event-default';
  };

  const formatEventData = (data) => {
    if (!data) return '-';
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Display key metrics first
      const keyFields = ['battery_percentage', 'battery_voltage', 'message'];
      const displayItems = [];
      
      keyFields.forEach(field => {
        if (parsed[field] !== undefined) {
          let value = parsed[field];
          if (field === 'battery_percentage') value += '%';
          if (field === 'battery_voltage') value += 'V';
          displayItems.push(`${field.replace('_', ' ')}: ${value}`);
        }
      });
      
      if (displayItems.length === 0) {
        const entries = Object.entries(parsed);
        return entries.slice(0, 3).map(([key, value]) => (
          `${key}: ${value}`
        )).join(', ') + (entries.length > 3 ? '...' : '');
      }
      
      return displayItems.join(', ');
    } catch (err) {
      return String(data).substring(0, 50) + (String(data).length > 50 ? '...' : '');
    }
  };

  if (loading) return <div className="loading">Loading power events...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="power-event-list">
      <div className="header">
        <h2>Power Events</h2>
        <p>All power events from M5StickC Plus2 devices</p>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <p>電源イベントがありません。</p>
          <p>M5StickC Plus2 からイベントが送信されると、ここに表示されます。</p>
        </div>
      ) : (
        <div className="events-table-container">
          <div className="events-summary">
            <p>Total Events: <strong>{events.length}</strong></p>
          </div>
          
          <table className="events-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event Type</th>
                <th>Device</th>
                <th>Timestamp</th>
                <th>Data</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id} className={getEventTypeClass(event.event_type)}>
                  <td>
                    <code className="event-id">{event.id}</code>
                  </td>
                  <td>
                    <span className="event-type-label">
                      {getEventTypeLabel(event.event_type)}
                    </span>
                  </td>
                  <td>
                    <Link to={`/devices/${event.device_id}`} className="device-link">
                      {getDeviceName(event.device_id)}
                    </Link>
                    <br />
                    <small><code>{event.device_id}</code></small>
                  </td>
                  <td>
                    <time dateTime={event.timestamp}>
                      {new Date(event.timestamp).toLocaleString()}
                    </time>
                  </td>
                  <td className="event-data">
                    <span title={event.data}>
                      {formatEventData(event.data)}
                    </span>
                  </td>
                  <td className="actions">
                    <Link 
                      to={`/devices/${event.device_id}/timeline`} 
                      className="btn btn-sm btn-secondary"
                    >
                      Timeline
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PowerEventList;