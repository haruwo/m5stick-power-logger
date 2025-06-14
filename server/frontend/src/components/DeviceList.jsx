import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    id: '',
    name: '',
    description: ''
  });
  const [addLoading, setAddLoading] = useState(false);

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

  const handleAddDevice = async (e) => {
    e.preventDefault();

    if (!newDevice.id || !newDevice.name) {
      setError('デバイスIDと名前は必須です');
      return;
    }

    try {
      setAddLoading(true);
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDevice),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'デバイスの追加に失敗しました');
      }

      // 成功時の処理
      setShowAddModal(false);
      setNewDevice({ id: '', name: '', description: '' });
      setError(null);
      fetchDevices(); // デバイスリストを再取得
    } catch (err) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setNewDevice({ id: '', name: '', description: '' });
    setError(null);
  };

  if (loading) return <div className="loading">Loading devices...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="device-list">
      <div className="header">
        <div className="header-content">
          <div>
            <h2>Device Management</h2>
            <p>M5StickC Plus2 デバイスの管理</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary add-device-btn"
          >
            + デバイス追加
          </button>
        </div>
      </div>

      {error && <div className="error">Error: {error}</div>}

      {devices.length === 0 ? (
        <div className="empty-state">
          <p>デバイスが見つかりません</p>
          <p>M5StickC Plus2 からの電源イベントを送信するか、手動でデバイスを追加してください。</p>
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
                    {device.last_seen ? (
                      <time dateTime={device.last_seen}>
                        {new Date(device.last_seen).toLocaleString()}
                      </time>
                    ) : (
                      <span className="no-data">未接続</span>
                    )}
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

      {/* デバイス追加モーダル */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新しいデバイスを追加</h3>
              <button
                className="modal-close-btn"
                onClick={handleModalClose}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddDevice} className="device-form">
              <div className="form-group">
                <label htmlFor="deviceId">デバイスID *</label>
                <input
                  type="text"
                  id="deviceId"
                  value={newDevice.id}
                  onChange={(e) => setNewDevice({ ...newDevice, id: e.target.value })}
                  placeholder="例: m5stick-001"
                  required
                />
                <small>M5StickC デバイスの一意の識別子</small>
              </div>

              <div className="form-group">
                <label htmlFor="deviceName">デバイス名 *</label>
                <input
                  type="text"
                  id="deviceName"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  placeholder="例: リビングルーム M5StickC"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="deviceDescription">説明</label>
                <textarea
                  id="deviceDescription"
                  value={newDevice.description}
                  onChange={(e) => setNewDevice({ ...newDevice, description: e.target.value })}
                  placeholder="デバイスの説明や設置場所など"
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="btn btn-secondary"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addLoading}
                >
                  {addLoading ? '追加中...' : 'デバイス追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceList;