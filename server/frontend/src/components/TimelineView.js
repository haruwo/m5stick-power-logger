import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  TextField,
  Stack,
  Pagination,
  Divider
} from '@mui/material';
import {
  PowerSettingsNew as PowerIcon,
  Battery3Bar as BatteryIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { apiService } from '../services/api';

const TimelineView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [filters, setFilters] = useState({
    device_id: '',
    event_type: '',
    start_date: moment().subtract(7, 'days').toDate(),
    end_date: moment().toDate(),
    limit: 50,
    offset: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    current: 1
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchDevices = async () => {
    try {
      const response = await apiService.getDevices();
      setDevices(response.data);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        limit: filters.limit,
        offset: filters.offset,
        order: 'desc'
      };

      if (filters.device_id) {
        queryParams.device_id = filters.device_id;
      }

      if (filters.event_type) {
        queryParams.event_type = filters.event_type;
      }

      if (filters.start_date) {
        queryParams.start_date = moment(filters.start_date).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
      }

      if (filters.end_date) {
        queryParams.end_date = moment(filters.end_date).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
      }

      const response = await apiService.getPowerEvents(queryParams);
      setEvents(response.data.events);
      setPagination({
        total: response.data.pagination.total,
        pages: response.data.pagination.pages,
        current: Math.floor(filters.offset / filters.limit) + 1
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      offset: 0
    }));
  };

  const handlePageChange = (event, page) => {
    setFilters(prev => ({
      ...prev,
      offset: (page - 1) * prev.limit
    }));
  };

  const resetFilters = () => {
    setFilters({
      device_id: '',
      event_type: '',
      start_date: moment().subtract(7, 'days').toDate(),
      end_date: moment().toDate(),
      limit: 50,
      offset: 0
    });
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
        return null;
    }
  };

  const formatEventDetails = (event) => {
    const details = [];
    
    if (event.battery_percentage !== null) {
      details.push(`バッテリー: ${event.battery_percentage}%`);
    }
    
    if (event.battery_voltage !== null) {
      details.push(`電圧: ${event.battery_voltage.toFixed(2)}V`);
    }
    
    if (event.wifi_signal_strength !== null) {
      details.push(`WiFi: ${event.wifi_signal_strength}dBm`);
    }
    
    if (event.free_heap !== null) {
      details.push(`メモリ: ${Math.round(event.free_heap / 1024)}KB`);
    }
    
    return details.join(' • ');
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        エラーが発生しました: {error}
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">
                  タイムラインビュー
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={resetFilters}
                  >
                    フィルターリセット
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchEvents}
                  >
                    更新
                  </Button>
                </Box>
              </Box>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>デバイス</InputLabel>
                  <Select
                    value={filters.device_id}
                    onChange={(e) => handleFilterChange('device_id', e.target.value)}
                    label="デバイス"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    {devices.map((device) => (
                      <MenuItem key={device.device_id} value={device.device_id}>
                        {device.name || device.device_id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>イベント種類</InputLabel>
                  <Select
                    value={filters.event_type}
                    onChange={(e) => handleFilterChange('event_type', e.target.value)}
                    label="イベント種類"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    <MenuItem value="power_on">電源オン</MenuItem>
                    <MenuItem value="power_off">電源オフ</MenuItem>
                    <MenuItem value="battery_low">バッテリー低下</MenuItem>
                    <MenuItem value="system_error">システムエラー</MenuItem>
                  </Select>
                </FormControl>

                <DatePicker
                  label="開始日"
                  value={moment(filters.start_date)}
                  onChange={(date) => handleFilterChange('start_date', date?.toDate())}
                  slotProps={{ textField: { size: 'small' } }}
                />

                <DatePicker
                  label="終了日"
                  value={moment(filters.end_date)}
                  onChange={(date) => handleFilterChange('end_date', date?.toDate())}
                  slotProps={{ textField: { size: 'small' } }}
                />

                <TextField
                  label="表示件数"
                  type="number"
                  size="small"
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  inputProps={{ min: 10, max: 500, step: 10 }}
                  sx={{ width: 120 }}
                />
              </Stack>

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  総件数: {pagination.total.toLocaleString()}件 
                  ({filters.start_date && filters.end_date && 
                    `${moment(filters.start_date).format('YYYY/MM/DD')} - ${moment(filters.end_date).format('YYYY/MM/DD')}`
                  })
                </Typography>
                
                {pagination.pages > 1 && (
                  <Pagination
                    count={pagination.pages}
                    page={pagination.current}
                    onChange={handlePageChange}
                    color="primary"
                    size="small"
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <div className="timeline-container">
                  <List>
                    {events.map((event, index) => (
                      <React.Fragment key={event.id}>
                        <ListItem className="timeline-event">
                          <ListItemIcon>
                            <Box className={`timeline-event-icon ${event.event_type}`}>
                              {getEventIcon(event.event_type)}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Chip
                                  label={apiService.formatEventType(event.event_type)}
                                  size="small"
                                  sx={{ 
                                    bgcolor: apiService.getEventTypeColor(event.event_type), 
                                    color: 'white' 
                                  }}
                                />
                                <Typography variant="body2" fontWeight="medium">
                                  {event.device?.device_id || event.device_id}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {moment(event.timestamp).format('YYYY/MM/DD HH:mm:ss')}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box>
                                {event.message && (
                                  <Typography variant="body2" color="text.primary" mb={0.5}>
                                    {event.message}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  {formatEventDetails(event)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {apiService.formatRelativeTime(event.timestamp)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < events.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>

                  {events.length === 0 && (
                    <Box textAlign="center" py={4}>
                      <Typography variant="body1" color="text.secondary">
                        指定された条件でのイベントがありません
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        フィルター条件を変更してください
                      </Typography>
                    </Box>
                  )}
                </div>
              )}

              {pagination.pages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={pagination.pages}
                    page={pagination.current}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default TimelineView;