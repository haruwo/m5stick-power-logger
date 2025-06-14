import React from 'react';
import { useQuery } from 'react-query';
import {
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { api } from '../services/api';

function StatCard({ title, value, loading, error }) {
  return (
    <Card>
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          {title}
        </Typography>
        {loading ? (
          <CircularProgress size={24} />
        ) : error ? (
          <Typography variant="h4" color="error">
            Error
          </Typography>
        ) : (
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery('dashboardStats', api.getDashboardStats, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const {
    data: eventsData,
    isLoading: eventsLoading,
    error: eventsError
  } = useQuery('recentEvents', () => api.getPowerEvents({ limit: 100 }), {
    refetchInterval: 60000, // Refresh every minute
  });

  const {
    data: devicesData,
    isLoading: devicesLoading,
    error: devicesError
  } = useQuery('devices', api.getDevices, {
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  const stats = statsData?.data || {};
  const events = eventsData?.data?.events || [];
  const devices = devicesData?.data?.devices || [];

  // Process events for chart
  const eventsByHour = events.reduce((acc, event) => {
    const hour = new Date(event.timestamp).getHours();
    const key = `${hour}:00`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(eventsByHour)
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  // Battery data
  const batteryData = events
    .filter(event => event.battery_percentage !== null)
    .slice(0, 20)
    .reverse()
    .map((event, index) => ({
      time: new Date(event.timestamp).toLocaleTimeString(),
      battery: event.battery_percentage,
      device: event.device_id
    }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Devices"
            value={stats.total_devices || 0}
            loading={statsLoading}
            error={statsError}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Events (24h)"
            value={stats.events_24h || 0}
            loading={statsLoading}
            error={statsError}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Sessions"
            value={stats.active_sessions || 0}
            loading={statsLoading}
            error={statsError}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Online Devices"
            value={devices.filter(d => d.is_active).length}
            loading={devicesLoading}
            error={devicesError}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Events by Hour
            </Typography>
            {eventsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <CircularProgress />
              </Box>
            ) : eventsError ? (
              <Alert severity="error">Failed to load events data</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Battery Levels
            </Typography>
            {eventsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <CircularProgress />
              </Box>
            ) : eventsError ? (
              <Alert severity="error">Failed to load battery data</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={batteryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="battery"
                    stroke="#1976d2"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Events */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Events
        </Typography>
        {eventsLoading ? (
          <CircularProgress />
        ) : eventsError ? (
          <Alert severity="error">Failed to load recent events</Alert>
        ) : (
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {events.slice(0, 10).map((event) => (
              <Box
                key={event.id}
                sx={{
                  p: 1,
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="body2">
                    <strong>{event.device_id}</strong> - {event.event_type}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {event.message}
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  {new Date(event.timestamp).toLocaleString()}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default Dashboard;