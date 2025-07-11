"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return <>{children}</>
}
