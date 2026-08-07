import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'https://e-commerce-project-0py5.onrender.com/api'

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send httpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`

    // Attach guest session ID for cart operations
    const sessionId = localStorage.getItem('sessionId')
    if (sessionId) config.headers['x-session-id'] = sessionId

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: auto-refresh on 401
let isRefreshing = false
let refreshQueue = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(
          `${API_BASE}/auth/refresh-token`,
          {},
          { withCredentials: true }
        )
        const newToken = data.data.accessToken
        localStorage.setItem('accessToken', newToken)
        refreshQueue.forEach(({ resolve }) => resolve(newToken))
        refreshQueue = []
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        refreshQueue.forEach(({ reject }) => reject(error))
        refreshQueue = []
        localStorage.removeItem('accessToken')
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
