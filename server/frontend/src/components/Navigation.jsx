import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Link to="/">
          <h1>M5StickC Power Logger</h1>
        </Link>
      </div>
      
      <ul className="nav-links">
        <li>
          <Link 
            to="/" 
            className={isActive('/') && location.pathname === '/' ? 'active' : ''}
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link 
            to="/devices" 
            className={isActive('/devices') ? 'active' : ''}
          >
            Devices
          </Link>
        </li>
        <li>
          <Link 
            to="/events" 
            className={isActive('/events') ? 'active' : ''}
          >
            Events
          </Link>
        </li>
        <li>
          <Link 
            to="/legacy" 
            className={isActive('/legacy') ? 'active' : ''}
          >
            Legacy Items
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navigation;