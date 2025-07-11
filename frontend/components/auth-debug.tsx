"use client"

import { useAuthStore } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, LogOut, User, Shield } from "lucide-react"

export function AuthDebug() {
  const { user, isAuthenticated, isLoading, checkAuth, logout } = useAuthStore()

  const handleRefresh = async () => {
    try {
      await checkAuth()
    } catch (error) {
      console.error("Refresh failed:", error)
    }
  }

  const handleLogout = () => {
    logout()
  }

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center space-x-2">
          <Shield className="w-4 h-4" />
          <span>Auth Debug</span>
          <Badge variant={isAuthenticated ? "default" : "destructive"} className="text-xs">
            {isAuthenticated ? "Authenticated" : "Not Auth"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span>Loading:</span>
          <Badge variant={isLoading ? "default" : "secondary"}>
            {isLoading ? "Yes" : "No"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>User:</span>
          <Badge variant={user ? "default" : "destructive"}>
            {user ? "Present" : "Missing"}
          </Badge>
        </div>
        {user && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-1">
              <User className="w-3 h-3" />
              <span className="font-medium">{user.profile?.fullName || user.email}</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {user.email}
            </div>
          </div>
        )}
        <div className="flex space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button size="sm" variant="outline" onClick={handleRefresh} className="flex-1">
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={handleLogout} className="flex-1">
            <LogOut className="w-3 h-3 mr-1" />
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 