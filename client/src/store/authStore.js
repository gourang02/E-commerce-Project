import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/axios'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user, accessToken) => {
        if (accessToken) localStorage.setItem('accessToken', accessToken)
        set({ user, accessToken, isAuthenticated: !!user })
      },

      login: async (identifier, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { identifier, password })
          const { user, accessToken } = data.data
          localStorage.setItem('accessToken', accessToken)
          set({ user, accessToken, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, message: err.response?.data?.message || 'Login failed.' }
        }
      },

      signup: async (formData) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/signup', formData)
          const { user, accessToken } = data.data
          localStorage.setItem('accessToken', accessToken)
          set({ user, accessToken, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, message: err.response?.data?.message || 'Signup failed.' }
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch { /* ignore */ }
        localStorage.removeItem('accessToken')
        set({ user: null, accessToken: null, isAuthenticated: false })
      },

      fetchMe: async () => {
        const token = localStorage.getItem('accessToken')
        if (!token) return
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data.data.user, isAuthenticated: true })
        } catch {
          localStorage.removeItem('accessToken')
          set({ user: null, isAuthenticated: false })
        }
      },

      updateUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

export default useAuthStore
