import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import LoginPage from './LoginPage';
import TestPage from './TestPage';
import ResultsPage from './ResultsPage';
import AdminDashboard from './AdminDashboard';
import TestComponent from './TestComponent';
import './App.css';

function App() {
  // Temporary test to isolate the issue
  const isTestMode = window.location.search.includes('test=true');
  
  if (isTestMode) {
    return <TestComponent />;
  }
  
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;