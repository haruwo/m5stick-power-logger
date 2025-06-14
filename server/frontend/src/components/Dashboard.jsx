import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [stats, setStats] = useState({
    deviceCount: 0,
    eventCount: 0,
    recentEvents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // デバイス数を取得
      const devicesResponse = await fetch('/api/devices');
      const devices = devicesResponse.ok ? await devicesResponse.json() : [];
      
      // 電源イベント数を取得
      const eventsResponse = await fetch('/api/power-events');
      const events = eventsResponse.ok ? await eventsResponse.json() : [];
      
      setStats({
        deviceCount: devices.length,
        eventCount: events.length,
        recentEvents: events.slice(0, 5) // 最新5件
      });
    } catch (err) {
      setError(err.message);
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

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>M5StickC Plus2 Power Logger System Overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.deviceCount}</div>
          <div className="stat-label">Registered Devices</div>
          <Link to="/devices" className="stat-link">
            View All Devices →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-number">{stats.eventCount}</div>
          <div className="stat-label">Total Power Events</div>
          <Link to="/events" className="stat-link">
            View All Events →
          </Link>
        </div>
      </div>

      <div className="recent-events">
        <div className="section-header">
          <h3>Recent Power Events</h3>
          <Link to="/events" className="view-all-link">
            View All →
          </Link>
        </div>

        {stats.recentEvents.length === 0 ? (
          <div className="empty-state">
            <p>電源イベントがありません。</p>
            <p>M5StickC Plus2 からイベントが送信されると、ここに表示されます。</p>
          </div>
        ) : (
          <div className="events-list">
            {stats.recentEvents.map(event => (
              <div key={event.id} className="event-item">
                <div className="event-type">
                  {getEventTypeLabel(event.event_type)}
                </div>
                <div className="event-device">
                  <Link to={`/devices/${event.device_id}`}>
                    {event.device_id}
                  </Link>
                </div>
                <div className="event-time">
                  <time dateTime={event.timestamp}>
                    {new Date(event.timestamp).toLocaleString()}
                  </time>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <Link to="/devices" className="action-card">
            <h4>Manage Devices</h4>
            <p>View and edit registered M5StickC devices</p>
          </Link>
          
          <Link to="/events" className="action-card">
            <h4>View Events</h4>
            <p>Browse all power events and timeline data</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;