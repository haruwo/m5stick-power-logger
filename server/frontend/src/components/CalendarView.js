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
  CardContent
} from '@mui/material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '../services/api';

const localizer = momentLocalizer(moment);

function CalendarView() {
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const {
    data: devicesData,
    isLoading: devicesLoading,
    error: devicesError
  } = useQuery('devices', api.getDevices);

  const {
    data: dailySummaryData,
    isLoading: summaryLoading,
    error: summaryError
  } = useQuery(
    ['dailySummary', selectedDevice],
    () => api.getDailySummary({
      device_id: selectedDevice || undefined,
      start_date: moment().subtract(30, 'days').format('YYYY-MM-DD'),
      end_date: moment().format('YYYY-MM-DD')
    }),
    {
      refetchInterval: 120000,
    }
  );

  const devices = devicesData?.data?.devices || [];
  const dailySummary = dailySummaryData?.data?.daily_summary || [];

  // Convert daily summary to calendar events
  const events = dailySummary.map((day) => ({
    id: `${day.device_id}-${day.event_date}`,
    title: `${day.event_count} events`,
    start: new Date(day.event_date),
    end: new Date(day.event_date),
    allDay: true,
    resource: {
      eventCount: day.event_count,
      powerOnCount: day.power_on_count,
      powerOffCount: day.power_off_count,
      avgBattery: day.avg_battery,
      minBattery: day.min_battery,
      maxBattery: day.max_battery,
      deviceId: day.device_id
    }
  }));

  const eventStyleGetter = (event) => {
    const eventCount = event.resource.eventCount;
    let backgroundColor = '#3174ad';
    
    if (eventCount > 50) {
      backgroundColor = '#d32f2f';
    } else if (eventCount > 20) {
      backgroundColor = '#ff9800';
    } else if (eventCount > 10) {
      backgroundColor = '#1976d2';
    } else {
      backgroundColor = '#4caf50';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const CustomEvent = ({ event }) => (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
        {event.title}
      </Typography>
      <Typography variant="caption" display="block">
        {event.resource.deviceId}
      </Typography>
    </Box>
  );

  const handleSelectEvent = (event) => {
    console.log('Selected event:', event);
  };

  const handleSelectSlot = ({ start, end }) => {
    console.log('Selected slot:', { start, end });
  };

  // Get selected day details
  const selectedDayData = dailySummary.find(day => 
    moment(day.event_date).isSame(selectedDate, 'day')
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Calendar View
      </Typography>

      {/* Device Filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
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
      </Box>

      <Grid container spacing={3}>
        {/* Calendar */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2, height: 600 }}>
            {summaryLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={500}>
                <CircularProgress />
              </Box>
            ) : summaryError ? (
              <Alert severity="error">Failed to load calendar data</Alert>
            ) : (
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                eventPropGetter={eventStyleGetter}
                components={{
                  event: CustomEvent
                }}
                views={['month']}
                defaultView="month"
                onNavigate={(date) => setSelectedDate(date)}
              />
            )}
          </Paper>
        </Grid>

        {/* Day Details */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Day Details
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {moment(selectedDate).format('MMMM DD, YYYY')}
            </Typography>

            {selectedDayData ? (
              <Box>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h4" color="primary">
                      {selectedDayData.event_count}
                    </Typography>
                    <Typography color="textSecondary">
                      Total Events
                    </Typography>
                  </CardContent>
                </Card>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                          {selectedDayData.power_on_count}
                        </Typography>
                        <Typography variant="caption">
                          Power On
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="error.main">
                          {selectedDayData.power_off_count}
                        </Typography>
                        <Typography variant="caption">
                          Power Off
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {selectedDayData.avg_battery && (
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6">
                        Battery Stats
                      </Typography>
                      <Typography variant="body2">
                        Avg: {selectedDayData.avg_battery?.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">
                        Min: {selectedDayData.min_battery}%
                      </Typography>
                      <Typography variant="body2">
                        Max: {selectedDayData.max_battery}%
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Box>
            ) : (
              <Alert severity="info">
                No events recorded for this date
              </Alert>
            )}
          </Paper>

          {/* Legend */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Event Count Legend
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: '#4caf50', borderRadius: 1 }} />
                <Typography variant="body2">1-10 events</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: '#1976d2', borderRadius: 1 }} />
                <Typography variant="body2">11-20 events</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: '#ff9800', borderRadius: 1 }} />
                <Typography variant="body2">21-50 events</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: '#d32f2f', borderRadius: 1 }} />
                <Typography variant="body2">50+ events</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default CalendarView;