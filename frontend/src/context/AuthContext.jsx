import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('token')
    // 清除残留的 mock token
    if (saved === 'mock-token-dev') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return null
    }
    return saved
  })

  const saveAuth = (userData, tokenStr) => {
    localStorage.setItem('token', tokenStr)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(tokenStr)
    setUser(userData)
    return userData
  }

  const login = useCallback(async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    const { access_token, user_id, username: name } = res.data
    return saveAuth({ id: user_id, username: name }, access_token)
  }, [])

  const register = useCallback(async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password })
    const { access_token, user_id, username: name } = res.data
    return saveAuth({ id: user_id, username: name }, access_token)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
