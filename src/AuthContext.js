import React, { createContext, useReducer, useEffect, useCallback, useContext } from 'react'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null
}

function authReducer(state, action) {
  switch (action.type) {
    case 'INIT_AUTH':
      return { ...state, user: action.payload.user, token: action.payload.token }
    case 'LOGIN_REQUEST':
      return { ...state, loading: true, error: null }
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false }
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload }
    case 'LOGOUT':
      return { ...initialState }
    case 'REGISTER_REQUEST':
      return { ...state, loading: true, error: null }
    case 'REGISTER_SUCCESS':
      return { ...state, loading: false }
    case 'REGISTER_FAILURE':
      return { ...state, loading: false, error: action.payload }
    case 'REFRESH_SUCCESS':
      return { ...state, token: action.payload }
    case 'REFRESH_FAILURE':
      return { ...state, loading: false, error: action.payload }
    default:
      return state
  }
}

function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const login = useCallback(async credentials => {
    dispatch({ type: 'LOGIN_REQUEST' })
    try {
      const res = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      if (!res.ok) throw new Error('Login failed')
      const data = await res.json()
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)
      dispatch({ type: 'LOGIN_SUCCESS', payload: data })
      window.dispatchEvent(new CustomEvent('auth:loginSuccess', { detail: data.user }))
      return data
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message })
      window.dispatchEvent(new CustomEvent('auth:loginFailure', { detail: error.message }))
      return null
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    dispatch({ type: 'LOGOUT' })
    window.dispatchEvent(new Event('auth:logout'))
  }, [])

  const register = useCallback(async userData => {
    dispatch({ type: 'REGISTER_REQUEST' })
    try {
      const res = await fetch('/.netlify/functions/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      if (!res.ok) throw new Error('Registration failed')
      const data = await res.json()
      dispatch({ type: 'REGISTER_SUCCESS' })
      window.dispatchEvent(new CustomEvent('auth:registerSuccess', { detail: data }))
      return data
    } catch (error) {
      dispatch({ type: 'REGISTER_FAILURE', payload: error.message })
      window.dispatchEvent(new CustomEvent('auth:registerFailure', { detail: error.message }))
      return null
    }
  }, [])

  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch('/.netlify/functions/refreshToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.token}`
        }
      })
      if (!res.ok) throw new Error('Token refresh failed')
      const data = await res.json()
      localStorage.setItem('token', data.token)
      dispatch({ type: 'REFRESH_SUCCESS', payload: data.token })
      return data.token
    } catch (error) {
      dispatch({ type: 'REFRESH_FAILURE', payload: error.message })
      logout()
      return null
    }
  }, [state.token, logout])

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')
    if (storedUser && storedToken) {
      dispatch({
        type: 'INIT_AUTH',
        payload: { user: JSON.parse(storedUser), token: storedToken }
      })
      refreshToken()
    }
  }, [refreshToken])

  useEffect(() => {
    const handleLoginRequest = e => login(e.detail)
    window.addEventListener('auth:loginRequest', handleLoginRequest)
    return () => window.removeEventListener('auth:loginRequest', handleLoginRequest)
  }, [login])

  const value = {
    authState: state,
    user: state.user,
    token: state.token,
    isAuthenticated: !!state.token,
    loading: state.loading,
    error: state.error,
    login,
    logout,
    register,
    refreshToken
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export { AuthProvider, useAuth }