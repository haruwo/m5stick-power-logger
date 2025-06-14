import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/devices');
      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }
      const data = await response.json();
      setDevices(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deviceId) => {
    if (!window.confirm('このデバイスを削除しますか？関連する電源イベントも削除されます。')) {
      return;
    }

    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete device');
      }
      
      // デバイスリストを再取得
      fetchDevices();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading devices...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="device-list">
      <div className="header">
        <h2>Device Management</h2>
        <p>M5StickC Plus2 デバイスの管理</p>
      </div>

      {devices.length === 0 ? (
        <div className="empty-state">
          <p>デバイスが見つかりません</p>
          <p>M5StickC Plus2 からの電源イベントを送信すると、デバイスが自動的に登録されます。</p>
        </div>
      ) : (
        <div className="devices-table-container">
          <table className="devices-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Last Seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(device => (
                <tr key={device.id}>
                  <td>
                    <code className="device-id">{device.id}</code>
                  </td>
                  <td>{device.name}</td>
                  <td>{device.description || '-'}</td>
                  <td>
                    <time dateTime={device.last_seen}>
                      {new Date(device.last_seen).toLocaleString()}
                    </time>
                  </td>
                  <td className="actions">
                    <Link 
                      to={`/devices/${device.id}`} 
                      className="btn btn-primary"
                    >
                      詳細
                    </Link>
                    <Link 
                      to={`/devices/${device.id}/timeline`} 
                      className="btn btn-secondary"
                    >
                      タイムライン
                    </Link>
                    <button 
                      onClick={() => handleDelete(device.id)}
                      className="btn btn-danger"
                    >
                      削除
                    </button>
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

export default DeviceList;