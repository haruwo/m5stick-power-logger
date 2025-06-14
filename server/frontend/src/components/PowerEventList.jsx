import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function PowerEventList() {
  const [events, setEvents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(90);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchDevices();
    fetchStats();
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

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/power-events/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
    }
  };

  const getDeviceName = (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : deviceId;
  };

  const handleCleanupEvents = async () => {
    if (!window.confirm(`${cleanupDays}日より古いイベントを削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      setCleanupLoading(true);
      const response = await fetch('/api/power-events/cleanup', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ older_than_days: cleanupDays }),
      });

      if (!response.ok) {
        throw new Error('Failed to cleanup events');
      }

      const result = await response.json();
      setShowCleanupModal(false);
      setError(null);
      alert(`${result.deleted_count}件のイベントを削除しました。`);
      
      // Refresh data
      fetchEvents();
      fetchStats();
    } catch (err) {
      setError('イベントの削除に失敗しました: ' + err.message);
    } finally {
      setCleanupLoading(false);
    }
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
        <div className="header-content">
          <div>
            <h2>Power Events</h2>
            <p>All power events from M5StickC Plus2 devices</p>
          </div>
          <button
            onClick={() => setShowCleanupModal(true)}
            className="btn btn-warning cleanup-btn"
          >
            🗑️ イベント削除
          </button>
        </div>
      </div>

      {stats && (
        <div className="event-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{stats.total_count}</div>
              <div className="stat-label">総イベント数</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.count_last_7_days}</div>
              <div className="stat-label">過去7日</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.count_last_30_days}</div>
              <div className="stat-label">過去30日</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.count_older_than_90_days}</div>
              <div className="stat-label">90日より古い</div>
            </div>
          </div>
          {stats.oldest_event && (
            <div className="oldest-event-info">
              <small>
                最古のイベント: {new Date(stats.oldest_event).toLocaleString()}
              </small>
            </div>
          )}
        </div>
      )}

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

      {/* Event Cleanup Modal */}
      {showCleanupModal && (
        <div className="modal-overlay" onClick={() => setShowCleanupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>古いイベントの削除</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowCleanupModal(false)}
              >
                ×
              </button>
            </div>

            <div className="cleanup-modal-content">
              <p>指定した日数より古いイベントを削除します。この操作は取り消せません。</p>
              
              {stats && (
                <div className="cleanup-preview">
                  <div className="cleanup-stats">
                    <div className="cleanup-stat">
                      <span className="label">総イベント数:</span>
                      <span className="value">{stats.total_count}</span>
                    </div>
                    <div className="cleanup-stat">
                      <span className="label">90日より古いイベント:</span>
                      <span className="value danger">{stats.count_older_than_90_days}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="cleanupDays">削除対象: </label>
                <select
                  id="cleanupDays"
                  value={cleanupDays}
                  onChange={(e) => setCleanupDays(parseInt(e.target.value))}
                >
                  <option value={30}>30日より古いイベント</option>
                  <option value={60}>60日より古いイベント</option>
                  <option value={90}>90日より古いイベント</option>
                  <option value={180}>180日より古いイベント</option>
                  <option value={365}>1年より古いイベント</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowCleanupModal(false)}
                  className="btn btn-secondary"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleCleanupEvents}
                  className="btn btn-danger"
                  disabled={cleanupLoading}
                >
                  {cleanupLoading ? '削除中...' : `${cleanupDays}日より古いイベントを削除`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PowerEventList;