import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext.js';
import { Helmet } from 'react-helmet';

const Sidebar = () => {
  const { logout } = useAuth();
  const handleLogout = () => {
    logout();
    window.dispatchEvent(new CustomEvent('auth:logout'));
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - IBT Preparation Test</title>
        <meta name="description" content="Navigate admin dashboard for IBT Preparation Test" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://www.example.com/admindashboard" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
      </Helmet>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <nav id="sidebar" data-testid="sidebar" role="navigation" aria-label="Sidebar Navigation">
        <h2 className="visually-hidden">Sidebar</h2>
        <ul className="sidebar-list" role="menu">
          <li role="none">
            <NavLink
              to="/admindashboard"
              end
              className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
              role="menuitem"
              data-testid="nav-dashboard"
              aria-current="page"
            >
              Dashboard
            </NavLink>
          </li>
          <li role="none">
            <NavLink
              to="/questionuploader"
              className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
              role="menuitem"
              data-testid="nav-uploader"
              aria-current="page"
            >
              Upload Questions
            </NavLink>
          </li>
          <li role="none">
            <NavLink
              to="/resultspage"
              className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
              role="menuitem"
              data-testid="nav-results"
              aria-current="page"
            >
              Results
            </NavLink>
          </li>
        </ul>
        <button
          id="logout-button"
          data-testid="logout-button"
          className="sidebar-link logout-link"
          onClick={handleLogout}
          aria-label="Logout"
          type="button"
        >
          Logout
        </button>
      </nav>
    </>
  );
};

export default Sidebar;