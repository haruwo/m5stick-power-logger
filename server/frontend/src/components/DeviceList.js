import React from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  PowerSettingsNew,
  Battery20,
  Wifi,
  Schedule,
  Event
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { api } from '../services/api';

function DeviceCard({ device }) {
  const isOnline = device.is_active && device.last_event && 
    new Date() - new Date(device.last_event) < 5 * 60 * 1000; // 5 minutes

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div">
              {device.name || device.device_id}
            </Typography>
            <Typography color="textSecondary" variant="body2">
              {device.device_id}
            </Typography>
          </Box>
          <Chip 
            label={isOnline ? 'Online' : 'Offline'} 
            color={isOnline ? 'success' : 'default'}
            size="small"
            icon={<PowerSettingsNew />}
          />
        </Box>

        {device.description && (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {device.description}
          </Typography>
        )}

        {device.location && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            📍 {device.location}
          </Typography>
        )}

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Event fontSize="small" color="primary" />
              <Box>
                <Typography variant="caption" display="block">
                  Total Events
                </Typography>
                <Typography variant="h6">
                  {device.total_events || 0}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule fontSize="small" color="primary" />
              <Box>
                <Typography variant="caption" display="block">
                  Active Days
                </Typography>
                <Typography variant="h6">
                  {device.active_days || 0}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {device.avg_battery && (
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Battery20 fontSize="small" color="primary" />
                <Box>
                  <Typography variant="caption" display="block">
                    Avg Battery
                  </Typography>
                  <Typography variant="h6">
                    {device.avg_battery.toFixed(0)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {device.avg_wifi_signal && (
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Wifi fontSize="small" color="primary" />
                <Box>
                  <Typography variant="caption" display="block">
                    Avg WiFi
                  </Typography>
                  <Typography variant="h6">
                    {device.avg_wifi_signal.toFixed(0)}dBm
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
          <Typography variant="caption" color="textSecondary">
            First Event: {device.first_event ? format(parseISO(device.first_event), 'MMM dd, yyyy') : 'N/A'}
          </Typography>
          <br />
          <Typography variant="caption" color="textSecondary">
            Last Event: {device.last_event ? format(parseISO(device.last_event), 'MMM dd, yyyy HH:mm') : 'N/A'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function DeviceList() {
  const {
    data: devicesData,
    isLoading: devicesLoading,
    error: devicesError,
    refetch: refetchDevices
  } = useQuery('devices', api.getDevices, {
    refetchInterval: 60000, // Refresh every minute
  });

  const devices = devicesData?.data?.devices || [];

  // Calculate summary stats
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(device => {
    const isOnline = device.is_active && device.last_event && 
      new Date() - new Date(device.last_event) < 5 * 60 * 1000;
    return isOnline;
  }).length;

  const totalEvents = devices.reduce((sum, device) => sum + (device.total_events || 0), 0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Device Management
      </Typography>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {totalDevices}
              </Typography>
              <Typography color="textSecondary">
                Total Devices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {onlineDevices}
              </Typography>
              <Typography color="textSecondary">
                Online Devices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {totalEvents.toLocaleString()}
              </Typography>
              <Typography color="textSecondary">
                Total Events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Device Cards */}
      {devicesLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
          <CircularProgress />
        </Box>
      ) : devicesError ? (
        <Alert severity="error">Failed to load devices data</Alert>
      ) : devices.length === 0 ? (
        <Alert severity="info">No devices found</Alert>
      ) : (
        <Grid container spacing={3}>
          {devices.map((device) => (
            <Grid item xs={12} sm={6} md={4} key={device.device_id}>
              <DeviceCard device={device} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Detailed Table */}
      <Paper sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Device Details
        </Typography>
        
        {devicesLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : devicesError ? (
          <Box p={2}>
            <Alert severity="error">Failed to load devices data</Alert>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Device ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Events</TableCell>
                  <TableCell align="right">Active Days</TableCell>
                  <TableCell align="right">Avg Battery</TableCell>
                  <TableCell align="right">Avg WiFi</TableCell>
                  <TableCell>Last Event</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.map((device) => {
                  const isOnline = device.is_active && device.last_event && 
                    new Date() - new Date(device.last_event) < 5 * 60 * 1000;
                  
                  return (
                    <TableRow key={device.device_id} hover>
                      <TableCell component="th" scope="row">
                        <Typography variant="body2" fontFamily="monospace">
                          {device.device_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {device.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={isOnline ? 'Online' : 'Offline'} 
                          color={isOnline ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {device.total_events?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell align="right">
                        {device.active_days || '0'}
                      </TableCell>
                      <TableCell align="right">
                        {device.avg_battery ? `${device.avg_battery.toFixed(0)}%` : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {device.avg_wifi_signal ? `${device.avg_wifi_signal.toFixed(0)}dBm` : '-'}
                      </TableCell>
                      <TableCell>
                        {device.last_event ? (
                          <Typography variant="body2">
                            {format(parseISO(device.last_event), 'MMM dd, HH:mm')}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

export default DeviceList;