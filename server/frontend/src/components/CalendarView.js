import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Divider
} from '@mui/material';
import {
  PowerSettingsNew as PowerIcon,
  Battery3Bar as BatteryIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import moment from 'moment';
import { apiService } from '../services/api';
import 'react-calendar/dist/Calendar.css';

const CalendarView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [dailyEvents, setDailyEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth, selectedDevice]);

  useEffect(() => {
    fetchDailyEvents();
  }, [selectedDate, selectedDevice]);

  const fetchDevices = async () => {
    try {
      const response = await apiService.getDevices();
      setDevices(response.data);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    }
  };

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      
      const response = await apiService.getCalendarData(
        year, 
        month, 
        selectedDevice || null
      );
      setCalendarData(response.data.calendar_data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyEvents = async () => {
    try {
      const dateStr = moment(selectedDate).format('YYYY-MM-DD');
      const response = await apiService.getPowerEvents({
        start_date: `${dateStr}T00:00:00Z`,
        end_date: `${dateStr}T23:59:59Z`,
        device_id: selectedDevice || undefined,
        limit: 100,
        order: 'desc'
      });
      setDailyEvents(response.data.events);
    } catch (err) {
      console.error('Failed to fetch daily events:', err);
      setDailyEvents([]);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleDeviceChange = (event) => {
    setSelectedDevice(event.target.value);
  };

  const handleActiveStartDateChange = ({ activeStartDate }) => {
    setCurrentMonth(activeStartDate);
  };

  const getTileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const dateStr = moment(date).format('YYYY-MM-DD');
    const dayEvents = calendarData[dateStr];
    
    if (!dayEvents) return null;

    const eventTypes = Object.keys(dayEvents);
    if (eventTypes.length === 0) return null;

    return (
      <Box className="event-indicator">
        {eventTypes.slice(0, 4).map((eventType) => (
          <Box
            key={eventType}
            className={`event-dot ${eventType}`}
            title={`${apiService.formatEventType(eventType)}: ${dayEvents[eventType]}回`}
          />
        ))}
      </Box>
    );
  };

  const getTileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const dateStr = moment(date).format('YYYY-MM-DD');
    const dayEvents = calendarData[dateStr];
    
    if (!dayEvents) return null;
    
    const hasEvents = Object.keys(dayEvents).length > 0;
    const hasErrors = dayEvents.system_error > 0;
    const hasWarnings = dayEvents.battery_low > 0;
    
    if (hasErrors) return 'has-errors';
    if (hasWarnings) return 'has-warnings';
    if (hasEvents) return 'has-events';
    
    return null;
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

  const getSelectedDateSummary = () => {
    const dateStr = moment(selectedDate).format('YYYY-MM-DD');
    const dayEvents = calendarData[dateStr];
    
    if (!dayEvents) return null;
    
    return Object.entries(dayEvents).map(([eventType, count]) => (
      <Chip
        key={eventType}
        icon={getEventIcon(eventType)}
        label={`${apiService.formatEventType(eventType)} (${count})`}
        size="small"
        sx={{ 
          mr: 1, 
          mb: 1, 
          bgcolor: apiService.getEventTypeColor(eventType), 
          color: 'white' 
        }}
      />
    ));
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        エラーが発生しました: {error}
      </Alert>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">
                カレンダービュー
              </Typography>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>デバイス</InputLabel>
                <Select
                  value={selectedDevice}
                  onChange={handleDeviceChange}
                  label="デバイス"
                >
                  <MenuItem value="">すべてのデバイス</MenuItem>
                  {devices.map((device) => (
                    <MenuItem key={device.device_id} value={device.device_id}>
                      {device.name || device.device_id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Box className="calendar-container">
                <Calendar
                  onChange={handleDateChange}
                  value={selectedDate}
                  onActiveStartDateChange={handleActiveStartDateChange}
                  tileContent={getTileContent}
                  tileClassName={getTileClassName}
                  locale="ja-JP"
                  formatShortWeekday={(locale, date) => 
                    ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
                  }
                  formatMonthYear={(locale, date) => 
                    `${date.getFullYear()}年${date.getMonth() + 1}月`
                  }
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {moment(selectedDate).format('YYYY年M月D日')}
            </Typography>
            
            <Box mb={2}>
              {getSelectedDateSummary()}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              詳細イベント ({dailyEvents.length}件)
            </Typography>
            
            <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
              <List dense>
                {dailyEvents.map((event) => (
                  <ListItem key={event.id}>
                    <ListItemIcon>
                      {getEventIcon(event.event_type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {apiService.formatEventType(event.event_type)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {moment(event.timestamp).format('HH:mm:ss')}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.primary">
                            {event.device?.device_id || event.device_id}
                          </Typography>
                          {event.message && (
                            <Typography variant="caption" color="text.secondary">
                              {event.message}
                            </Typography>
                          )}
                          {event.battery_percentage && (
                            <Typography variant="caption" color="text.secondary">
                              • バッテリー: {event.battery_percentage}%
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {dailyEvents.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                          この日にはイベントがありません
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default CalendarView;