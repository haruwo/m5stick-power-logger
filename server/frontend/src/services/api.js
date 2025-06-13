import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API Error:', error);
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw new Error(error.message || 'Network error occurred');
      }
    );
  }

  async getPowerEvents(params = {}) {
    return this.api.get('/power-events', { params });
  }

  async createPowerEvent(eventData) {
    return this.api.post('/power-events', eventData);
  }

  async getPowerEvent(id) {
    return this.api.get(`/power-events/${id}`);
  }

  async getDeviceTimeline(deviceId, date = null) {
    const params = date ? { date } : {};
    return this.api.get(`/power-events/device/${deviceId}/timeline`, { params });
  }

  async getDevices() {
    return this.api.get('/devices');
  }

  async getDevice(deviceId) {
    return this.api.get(`/devices/${deviceId}`);
  }

  async updateDevice(deviceId, updateData) {
    return this.api.put(`/devices/${deviceId}`, updateData);
  }

  async deleteDevice(deviceId) {
    return this.api.delete(`/devices/${deviceId}`);
  }

  async getSummary(params = {}) {
    return this.api.get('/analytics/summary', { params });
  }

  async getCalendarData(year, month, deviceId = null) {
    const params = deviceId ? { device_id: deviceId } : {};
    return this.api.get(`/analytics/calendar/${year}/${month}`, { params });
  }

  async getTimelineData(params = {}) {
    return this.api.get('/analytics/timeline', { params });
  }

  async getDeviceHealth(deviceId, days = 7) {
    return this.api.get(`/analytics/device/${deviceId}/health`, { 
      params: { days } 
    });
  }

  formatEventType(eventType) {
    const eventTypeMap = {
      'power_on': '電源オン',
      'power_off': '電源オフ',
      'battery_low': 'バッテリー低下',
      'system_error': 'システムエラー'
    };
    return eventTypeMap[eventType] || eventType;
  }

  getEventTypeColor(eventType) {
    const colorMap = {
      'power_on': '#4caf50',
      'power_off': '#f44336',
      'battery_low': '#ff9800',
      'system_error': '#9c27b0'
    };
    return colorMap[eventType] || '#757575';
  }

  getEventTypeIcon(eventType) {
    const iconMap = {
      'power_on': '🔌',
      'power_off': '🔋',
      'battery_low': '⚠️',
      'system_error': '❌'
    };
    return iconMap[eventType] || '📊';
  }

  formatBatteryLevel(percentage) {
    if (percentage >= 80) return { level: 'high', color: '#4caf50' };
    if (percentage >= 30) return { level: 'medium', color: '#ff9800' };
    return { level: 'low', color: '#f44336' };
  }

  formatSignalStrength(rssi) {
    if (rssi >= -50) return { level: 'excellent', bars: 4 };
    if (rssi >= -60) return { level: 'good', bars: 3 };
    if (rssi >= -70) return { level: 'fair', bars: 2 };
    return { level: 'poor', bars: 1 };
  }

  isDeviceOnline(lastSeen, thresholdMinutes = 5) {
    if (!lastSeen) return false;
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMinutes = (now - lastSeenDate) / (1000 * 60);
    return diffMinutes <= thresholdMinutes;
  }

  formatRelativeTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'たった今';
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    return time.toLocaleDateString('ja-JP');
  }

  formatDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) return `${diffMinutes}分`;
    if (diffHours < 24) return `${diffHours}時間${diffMinutes % 60}分`;
    return `${diffDays}日${diffHours % 24}時間`;
  }
}

export const apiService = new ApiService();
export default apiService;