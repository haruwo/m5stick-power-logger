import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

function DeviceDetail() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchDevice();
  }, [deviceId]);

  const fetchDevice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/devices/${deviceId}`);
      if (response.status === 404) {
        setError('Device not found');
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch device');
      }
      const data = await response.json();
      setDevice(data);
      setFormData({ name: data.name, description: data.description || '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update device');
      }

      setIsEditing(false);
      fetchDevice(); // デバイス情報を再取得
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
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
      
      navigate('/devices');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading device...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!device) return <div className="error">Device not found</div>;

  return (
    <div className="device-detail">
      <div className="header">
        <Link to="/devices" className="back-link">← Back to Devices</Link>
        <h2>Device Details</h2>
      </div>

      <div className="device-info">
        <div className="info-section">
          <h3>Basic Information</h3>
          
          {isEditing ? (
            <form onSubmit={handleSubmit} className="edit-form">
              <div className="form-group">
                <label>Device ID:</label>
                <input 
                  type="text" 
                  value={device.id} 
                  disabled 
                  className="form-control"
                />
                <small className="form-text">Device ID cannot be changed</small>
              </div>
              
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-control"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-control"
                  rows="3"
                  placeholder="Optional description"
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="info-display">
              <div className="info-item">
                <strong>Device ID:</strong>
                <code className="device-id">{device.id}</code>
              </div>
              <div className="info-item">
                <strong>Name:</strong>
                <span>{device.name}</span>
              </div>
              <div className="info-item">
                <strong>Description:</strong>
                <span>{device.description || 'No description'}</span>
              </div>
              <div className="info-item">
                <strong>Last Seen:</strong>
                <time dateTime={device.last_seen}>
                  {new Date(device.last_seen).toLocaleString()}
                </time>
              </div>
              <div className="info-item">
                <strong>Created:</strong>
                <time dateTime={device.created_at}>
                  {new Date(device.created_at).toLocaleString()}
                </time>
              </div>
              
              <div className="device-actions">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary"
                >
                  Edit Device
                </button>
                <Link 
                  to={`/devices/${device.id}/timeline`}
                  className="btn btn-secondary"
                >
                  View Timeline
                </Link>
                <button 
                  onClick={handleDelete}
                  className="btn btn-danger"
                >
                  Delete Device
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeviceDetail;