"use client"
import React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth"

function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = React.useState(false)
  React.useEffect(() => {
    setHasHydrated(true)
  }, [])
  return hasHydrated
}

export default function AuthGuard({ children, redirectTo = "/login" }: { children: React.ReactNode, redirectTo?: string }) {
  const { user, isLoading } = useAuthStore()
  const hasHydrated = useHasHydrated()
  const router = useRouter()

  React.useEffect(() => {
    if (hasHydrated && !isLoading && !user) {
      router.replace(redirectTo)
    }
  }, [hasHydrated, isLoading, user, router, redirectTo])

  if (!hasHydrated || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white">Loading...</p>
        </div>
      </div>
    )
  }
  return <>{children}</>
} 