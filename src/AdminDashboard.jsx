import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthContext.js'
import Sidebar from './Sidebar'
import { Helmet } from 'react-helmet'

const AdminDashboard = () => {
  const { authState, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const handleLoginSuccess = () => {
      document.getElementById('dashboard-container')?.classList.add('is-loaded')
    }
    window.addEventListener('auth:loginSuccess', handleLoginSuccess)
    return () => window.removeEventListener('auth:loginSuccess', handleLoginSuccess)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev)
  }

  if (!authState.isAuthenticated || authState.role !== 'admin') return null

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - IBT Preparation Test</title>
        <meta name="description" content="Manage test materials, upload questions, and view site analytics." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://www.yourdomain.com/admindashboard" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/css/main.css" />
        <link rel="stylesheet" href="/css/admin.css" />
      </Helmet>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div id="dashboard-container" className={`dashboard ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} role="main">
        <header className="dashboard-header">
          <button id="sidebar-toggle" className="sidebar-toggle" aria-label="Toggle navigation" aria-expanded={sidebarOpen} onClick={toggleSidebar}>?</button>
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <button id="logout-button" className="logout-button" onClick={logout}>Logout</button>
        </header>
        <div className="dashboard-layout">
          <aside id="sidebar" aria-label="Sidebar navigation">
            <Sidebar />
          </aside>
          <section id="main-content" className="dashboard-content">
            <section aria-labelledby="overview-heading" className="content-section">
              <h2 id="overview-heading">Overview</h2>
              <div id="stats-container" data-hook="statsContainer" aria-live="polite" role="region"></div>
            </section>
            <section aria-labelledby="actions-heading" className="content-section">
              <h2 id="actions-heading">Quick Actions</h2>
              <nav aria-label="Quick actions">
                <ul className="actions-list">
                  <li><a href="/questionuploader" className="action-link">Upload Questions</a></li>
                  <li><a href="/resultspage" className="action-link">View Results</a></li>
                </ul>
              </nav>
            </section>
          </section>
        </div>
      </div>
      <script defer src="/js/sidebar.js"></script>
      <script defer src="/js/dashboard.js"></script>
    </>
  )
}

export default AdminDashboard