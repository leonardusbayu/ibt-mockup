import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { useAuth } from '../authcontext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    window.dispatchEvent(new CustomEvent('auth:loginRequest', { detail: { username } }))
    try {
      await login({ username, password })
      window.dispatchEvent(new Event('auth:loginSuccess'))
      navigate('/admindashboard')
    } catch (err) {
      setError('Invalid username or password')
      setLoading(false)
      document.getElementById('username').setAttribute('aria-invalid', 'true')
      document.getElementById('password').setAttribute('aria-invalid', 'true')
    }
  }

  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login'

  return (
    <>
      <Helmet>
        <title>Login - IBT Preparation Test</title>
        <meta name="description" content="Admin login for IBT Preparation Test platform." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
      </Helmet>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header role="banner" className="header">
        <h1 className="header__title">IBT Preparation Test Admin</h1>
      </header>
      <main id="main-content" className="login-container" tabIndex="-1">
        <section aria-labelledby="login-heading" className="login-section">
          <h2 id="login-heading" className="login-heading">Admin Login</h2>
          <form
            id="login-form"
            onSubmit={handleSubmit}
            noValidate
            className={`login-form ${loading ? 'is-loading' : ''}${error ? ' is-error' : ''}`}
            aria-describedby="error-message"
          >
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                data-testid="login-username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                aria-invalid={error ? 'true' : 'false'}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                data-testid="login-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                aria-invalid={error ? 'true' : 'false'}
                required
                className="form-control"
              />
            </div>
            <div id="error-message" className="error-message" aria-live="assertive">
              {error}
            </div>
            <div className="form-actions">
              <button
                type="submit"
                id="login-submit"
                aria-disabled={loading}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Signing in?' : 'Sign In'}
              </button>
            </div>
          </form>
          <p className="login-help">
            Need help? <a href="/help" target="_blank" rel="noopener noreferrer">Contact support</a>.
          </p>
        </section>
      </main>
    </>
  )
}