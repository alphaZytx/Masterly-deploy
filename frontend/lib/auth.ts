import { create } from "zustand"
import { persist } from "zustand/middleware"
import apiClient from "./api"

export interface User {
  _id: string
  email: string
  profile: {
    firstName: string
    lastName: string
    displayName: string
    fullName?: string
    avatar?: string
    bio?: string
    location?: string
    phone?: string
    website?: string
    socialLinks?: {
      github?: string
      linkedin?: string
      twitter?: string
    }
  }
  subscription: {
    plan: string
    status: string
    endDate?: string
  }
  stats: {
    level: number
    experiencePoints: number
    currentStreak: number
    totalStudyTime: number
    coursesCompleted: number
    coursesEnrolled: number
    conceptsMastered: number
    longestStreak: number
    quizzesCompleted: number
  }
  preferences: {
    notifications: {
      email: boolean
      push: boolean
      courseReminders: boolean
      achievements: boolean
      weeklyReports: boolean
    }
    learning: {
      difficultyPreference: string
      dailyGoal: number
      preferredLanguages: string[]
    }
    privacy: {
      profileVisibility: string
      showProgress: boolean
      showAchievements: boolean
    }
  }
  role: string
  emailVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User }>
  register: (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => Promise<{ success: boolean; user?: User }>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  checkAuth: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User | null) => void
  setIsAuthenticated: (isAuthenticated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true, // Start with loading true
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true })
          const response = await apiClient.login({ email, password })
          if (response.success) {
            const { user } = response.data
            if (!user) {
              throw new Error('Invalid login response: missing user')
            }
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            })
            // FIXED: Return success response
            return { success: true, user }
          } else {
            throw new Error(response.message || 'Login failed')
          }
        } catch (error: any) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true })
          const response = await apiClient.register(userData)
          if (response.success) {
            const { user } = response.data
            if (!user) {
              throw new Error('Invalid register response: missing user')
            }
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            })
            // FIXED: Return success response
            return { success: true, user }
          } else {
            throw new Error(response.message || 'Registration failed')
          }
        } catch (error: any) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await apiClient.logout()
        } catch (err) {}
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      updateUser: (userData) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          })
        }
      },

      checkAuth: async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data?.user) {
              set({
                user: data.data.user,
                isAuthenticated: true,
                isLoading: false,
              })
              return
            }
          }
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        } catch (error: any) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      refreshUser: async () => {
        try {
          const response = await apiClient.getCurrentUser()
          if (response.success) {
            set({ user: response.data.user })
          }
        } catch (error) {}
      },

      setUser: (user: User | null) => {
        set({ user })
      },

      setIsAuthenticated: (isAuthenticated: boolean) => {
        set({ isAuthenticated })
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)