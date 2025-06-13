import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper
} from '@mui/material';
import {
  PowerSettingsNew as PowerIcon,
  Battery3Bar as BatteryIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Devices as DevicesIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiService } from '../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [timelineData, setTimelineData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, timelineResponse] = await Promise.all([
        apiService.getSummary(),
        apiService.getTimelineData({
          start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          interval: 'hour'
        })
      ]);

      setSummary(summaryData.data.summary);
      setRecentEvents(summaryData.data.recent_events);

      const formattedTimelineData = Object.entries(timelineResponse.data.timeline_data).map(([period, events]) => ({
        time: new Date(period).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        power_on: events.power_on || 0,
        power_off: events.power_off || 0,
        battery_low: events.battery_low || 0,
        system_error: events.system_error || 0,
        total: Object.values(events).reduce((sum, count) => sum + count, 0)
      }));

      setTimelineData(formattedTimelineData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'power_on':
        return <PowerIcon sx={{ color: '#4caf50' }} />;
      case 'power_off':
        return <PowerIcon sx={{ color: '#f44336' }} />;
      case 'battery_low':
        return <BatteryIcon sx={{ color: '#ff9800' }} />;
      case 'system_error':
        return <ErrorIcon sx={{ color: '#9c27b0' }} />;
      default:
        return <TimelineIcon />;
    }
  };

  const pieData = summary ? [
    { name: '電源オン', value: summary.events_by_type.power_on || 0, color: '#4caf50' },
    { name: '電源オフ', value: summary.events_by_type.power_off || 0, color: '#f44336' },
    { name: 'バッテリー低下', value: summary.events_by_type.battery_low || 0, color: '#ff9800' },
    { name: 'システムエラー', value: summary.events_by_type.system_error || 0, color: '#9c27b0' }
  ].filter(item => item.value > 0) : [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        エラーが発生しました: {error}
      </Alert>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <DevicesIcon color="primary" />
              <Typography variant="h6">アクティブデバイス</Typography>
            </Box>
            <Typography variant="h3" color="primary">
              {summary?.active_devices || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <TimelineIcon color="primary" />
              <Typography variant="h6">総イベント数</Typography>
            </Box>
            <Typography variant="h3" color="primary">
              {summary?.total_events || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <WarningIcon sx={{ color: '#ff9800' }} />
              <Typography variant="h6">バッテリー警告</Typography>
            </Box>
            <Typography variant="h3" sx={{ color: '#ff9800' }}>
              {summary?.events_by_type?.battery_low || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <ErrorIcon sx={{ color: '#f44336' }} />
              <Typography variant="h6">システムエラー</Typography>
            </Box>
            <Typography variant="h3" sx={{ color: '#f44336' }}>
              {summary?.events_by_type?.system_error || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              24時間のイベント推移
            </Typography>
            <Box height={300}>
              <ResponsiveContainer>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(label) => `時刻: ${label}`}
                    formatter={(value, name) => [value, apiService.formatEventType(name)]}
                  />
                  <Line type="monotone" dataKey="power_on" stroke="#4caf50" name="power_on" strokeWidth={2} />
                  <Line type="monotone" dataKey="power_off" stroke="#f44336" name="power_off" strokeWidth={2} />
                  <Line type="monotone" dataKey="battery_low" stroke="#ff9800" name="battery_low" strokeWidth={2} />
                  <Line type="monotone" dataKey="system_error" stroke="#9c27b0" name="system_error" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              イベント種類別分布
            </Typography>
            <Box height={300}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              最近のイベント
            </Typography>
            <List>
              {recentEvents.slice(0, 10).map((event, index) => (
                <ListItem key={event.id} divider={index < recentEvents.length - 1}>
                  <ListItemIcon>
                    {getEventIcon(event.event_type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={apiService.formatEventType(event.event_type)}
                          size="small"
                          sx={{ bgcolor: apiService.getEventTypeColor(event.event_type), color: 'white' }}
                        />
                        <Typography variant="body2">
                          {event.device?.device_id || event.device_id}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.primary">
                          {event.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {apiService.formatRelativeTime(event.timestamp)}
                          {event.battery_percentage && (
                            <span> • バッテリー: {event.battery_percentage}%</span>
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
            {recentEvents.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                最近のイベントがありません
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Dashboard;