import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Container, Tab, Tabs, Box } from '@mui/material';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import GanttView from './components/GanttView';
import DeviceList from './components/DeviceList';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              M5StickC Power Logger Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="xl" sx={{ mt: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Dashboard" />
              <Tab label="Calendar" />
              <Tab label="Gantt Chart" />
              <Tab label="Devices" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <Dashboard />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <CalendarView />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <GanttView />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <DeviceList />
          </TabPanel>
        </Container>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;