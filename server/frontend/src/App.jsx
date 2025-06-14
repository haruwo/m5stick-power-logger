import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import DeviceList from './components/DeviceList';
import DeviceDetail from './components/DeviceDetail';
import DeviceTimeline from './components/DeviceTimeline';
import PowerEventList from './components/PowerEventList';
import LegacyItems from './components/LegacyItems';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<DeviceList />} />
            <Route path="/devices/:deviceId" element={<DeviceDetail />} />
            <Route path="/devices/:deviceId/timeline" element={<DeviceTimeline />} />
            <Route path="/events" element={<PowerEventList />} />
            <Route path="/legacy" element={<LegacyItems />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;