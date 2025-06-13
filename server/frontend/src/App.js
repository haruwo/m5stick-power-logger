import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  Devices as DevicesIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import TimelineView from './components/TimelineView';
import DevicesView from './components/DevicesView';
import Settings from './components/Settings';
import { apiService } from './services/api';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [summary, setSummary] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const tabs = [
    { label: 'ダッシュボード', path: '/', icon: <DashboardIcon /> },
    { label: 'カレンダー', path: '/calendar', icon: <CalendarIcon /> },
    { label: 'タイムライン', path: '/timeline', icon: <TimelineIcon /> },
    { label: 'デバイス', path: '/devices', icon: <DevicesIcon /> },
  ];

  useEffect(() => {
    const currentPath = location.pathname;
    const tabIndex = tabs.findIndex(tab => tab.path === currentPath);
    setCurrentTab(tabIndex >= 0 ? tabIndex : 0);
  }, [location.pathname]);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await apiService.getSummary();
      setSummary(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    navigate(tabs[newValue].path);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    handleMenuClose();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            M5StickC Plus2 Power Logger
          </Typography>
          
          {summary && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
              <Chip
                label={`${summary.summary.active_devices} デバイス`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Badge 
                badgeContent={summary.summary.total_events} 
                color="secondary"
                max={999}
              >
                <Chip
                  label="イベント"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Badge>
            </Box>
          )}

          <IconButton
            color="inherit"
            onClick={fetchSummary}
            title="データを更新"
          >
            <RefreshIcon />
          </IconButton>

          <IconButton
            color="inherit"
            onClick={handleMenuClick}
          >
            <SettingsIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleSettingsClick}>設定</MenuItem>
          </Menu>
        </Toolbar>

        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ 
            bgcolor: 'primary.dark',
            '& .MuiTab-root': { 
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': { 
                color: 'white' 
              }
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        {lastUpdate && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ display: 'block', mb: 2 }}
          >
            最終更新: {lastUpdate.toLocaleString('ja-JP')}
          </Typography>
        )}

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/timeline" element={<TimelineView />} />
          <Route path="/devices" element={<DevicesView />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;