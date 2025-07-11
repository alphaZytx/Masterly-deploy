"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth"

interface LenientAuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function LenientAuthGuard({ children, fallback }: LenientAuthGuardProps) {
  const { isAuthenticated, isLoading, checkAuth, token } = useAuthStore()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [authAttempts, setAuthAttempts] = useState(0)

  useEffect(() => {
    const validateAuth = async () => {
      try {
        // Give the auth store time to initialize
        if (isLoading) {
          return
        }

        // If already authenticated, we're good
        if (isAuthenticated) {
          setIsChecking(false)
          return
        }

        // Try to check auth (this will handle both token and cookie-based auth)
        if (authAttempts < 2) { // Only try twice
          console.log(`🔄 Auth attempt ${authAttempts + 1}/2...`)
          await checkAuth()
          setAuthAttempts(prev => prev + 1)
          
          // Give it a moment to update state
          setTimeout(() => {
            if (!isAuthenticated) {
              setIsChecking(false)
            }
          }, 1000)
        } else {
          setIsChecking(false)
        }
      } catch (error) {
        console.error("❌ Auth validation failed:", error)
        setIsChecking(false)
      }
    }

    validateAuth()
  }, [isAuthenticated, isLoading, checkAuth, authAttempts])

  // Show loading while checking auth
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white">Loading...</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Checking your session</p>
        </div>
      </div>
    )
  }

  // If not authenticated, show a gentle message instead of redirecting
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Session Expired</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Your session has expired. Please log in again to continue.
          </p>
          <button
            onClick={() => router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Log In Again
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 