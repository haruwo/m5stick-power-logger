import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { api } from '../services/api';

function GanttBar({ session, totalWidth, startTime, endTime }) {
  const sessionStart = parseISO(session.session_start);
  const sessionEnd = session.session_end ? parseISO(session.session_end) : new Date();
  
  const totalDuration = differenceInMinutes(endTime, startTime);
  const sessionDuration = differenceInMinutes(sessionEnd, sessionStart);
  const startOffset = differenceInMinutes(sessionStart, startTime);
  
  const leftPercent = (startOffset / totalDuration) * 100;
  const widthPercent = (sessionDuration / totalDuration) * 100;
  
  const getBarColor = () => {
    if (!session.session_end) return '#ff9800'; // Orange for ongoing
    if (session.duration_minutes > 60) return '#4caf50'; // Green for long sessions
    if (session.duration_minutes > 30) return '#1976d2'; // Blue for medium sessions
    return '#f44336'; // Red for short sessions
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        left: `${Math.max(0, leftPercent)}%`,
        width: `${Math.min(100 - Math.max(0, leftPercent), widthPercent)}%`,
        height: '20px',
        backgroundColor: getBarColor(),
        borderRadius: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '2px',
        fontSize: '10px',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
        '&:hover': {
          opacity: 0.8,
        }
      }}
      title={`${session.device_id}: ${format(sessionStart, 'HH:mm')} - ${session.session_end ? format(sessionEnd, 'HH:mm') : 'ongoing'} (${session.duration_minutes || 0}min)`}
    >
      {widthPercent > 10 && (session.duration_minutes || 0)}
    </Box>
  );
}

function TimeAxis({ startTime, endTime, width }) {
  const hours = [];
  const current = new Date(startTime);
  
  while (current <= endTime) {
    hours.push(new Date(current));
    current.setHours(current.getHours() + 1);
  }

  return (
    <Box sx={{ display: 'flex', position: 'relative', height: '30px', borderBottom: '1px solid #ddd' }}>
      {hours.map((hour, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            left: `${(index / (hours.length - 1)) * 100}%`,
            transform: 'translateX(-50%)',
            fontSize: '12px',
            color: '#666'
          }}
        >
          {format(hour, 'HH:mm')}
        </Box>
      ))}
    </Box>
  );
}

function GanttView() {
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const {
    data: devicesData,
    isLoading: devicesLoading,
    error: devicesError
  } = useQuery('devices', api.getDevices);

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError
  } = useQuery(
    ['powerSessions', selectedDevice, selectedDate],
    () => api.getPowerSessions({
      device_id: selectedDevice || undefined,
      start_date: selectedDate,
      end_date: selectedDate
    }),
    {
      refetchInterval: 60000,
    }
  );

  const devices = devicesData?.data?.devices || [];
  const sessions = sessionsData?.data?.sessions || [];

  // Group sessions by device
  const sessionsByDevice = sessions.reduce((acc, session) => {
    if (!acc[session.device_id]) {
      acc[session.device_id] = [];
    }
    acc[session.device_id].push(session);
    return acc;
  }, {});

  // Calculate time range for the day
  const dayStart = new Date(selectedDate + 'T00:00:00');
  const dayEnd = new Date(selectedDate + 'T23:59:59');

  // Get active devices for the selected date
  const activeDevices = selectedDevice 
    ? [selectedDevice]
    : Object.keys(sessionsByDevice);

  const totalSessions = sessions.length;
  const ongoingSessions = sessions.filter(s => !s.session_end).length;
  const avgDuration = sessions.length > 0 
    ? sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length 
    : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gantt Chart - Power Sessions
      </Typography>

      {/* Controls */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by Device</InputLabel>
            <Select
              value={selectedDevice}
              label="Filter by Device"
              onChange={(e) => setSelectedDevice(e.target.value)}
              disabled={devicesLoading}
            >
              <MenuItem value="">All Devices</MenuItem>
              {devices.map((device) => (
                <MenuItem key={device.device_id} value={device.device_id}>
                  {device.name || device.device_id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </FormControl>
        </Grid>
      </Grid>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {totalSessions}
              </Typography>
              <Typography color="textSecondary">
                Total Sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {ongoingSessions}
              </Typography>
              <Typography color="textSecondary">
                Ongoing Sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {avgDuration.toFixed(0)}
              </Typography>
              <Typography color="textSecondary">
                Avg Duration (min)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gantt Chart */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Power Sessions Timeline - {format(new Date(selectedDate), 'MMMM dd, yyyy')}
        </Typography>

        {sessionsLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress />
          </Box>
        ) : sessionsError ? (
          <Alert severity="error">Failed to load sessions data</Alert>
        ) : activeDevices.length === 0 ? (
          <Alert severity="info">No sessions found for the selected date</Alert>
        ) : (
          <Box>
            {/* Time Axis */}
            <TimeAxis startTime={dayStart} endTime={dayEnd} />
            
            {/* Device Rows */}
            <Box sx={{ mt: 2 }}>
              {activeDevices.map((deviceId) => (
                <Box key={deviceId} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ minWidth: '200px', mr: 2 }}>
                      {devices.find(d => d.device_id === deviceId)?.name || deviceId}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={`${sessionsByDevice[deviceId]?.length || 0} sessions`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Box sx={{ 
                    position: 'relative', 
                    height: '30px', 
                    backgroundColor: '#f9f9f9',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px'
                  }}>
                    {sessionsByDevice[deviceId]?.map((session) => (
                      <GanttBar
                        key={session.id}
                        session={session}
                        startTime={dayStart}
                        endTime={dayEnd}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Legend */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Legend
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, backgroundColor: '#ff9800', borderRadius: 1 }} />
              <Typography variant="body2">Ongoing Session</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, backgroundColor: '#4caf50', borderRadius: 1 }} />
              <Typography variant="body2">Long Session (60+ min)</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, backgroundColor: '#1976d2', borderRadius: 1 }} />
              <Typography variant="body2">Medium Session (30-60 min)</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, backgroundColor: '#f44336', borderRadius: 1 }} />
              <Typography variant="body2">Short Session (&lt;30 min)</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default GanttView;