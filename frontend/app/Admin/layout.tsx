"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Bell, LogOut, Settings, User, Home,
  BookOpen, Users, BarChart2, Activity,
  Mail, Shield, Server, ArrowRight,
  ChevronDown, Check, Plus, X, 
  ClipboardList, FileText, Database,
  TrendingUp, Calendar, Target,
  AlertTriangle, CheckCircle, Clock, Menu
} from "lucide-react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { SidebarProvider, useSidebar } from "./context/SidebarContext"

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [emergencyCount, setEmergencyCount] = useState(0)
  const { sidebarOpen, setSidebarOpen } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let ignore = false
    
    // Debug logging
    console.log("Admin layout - Current pathname:", pathname)
    
    // Skip authentication check for login and register pages
    if (pathname === "/admin/login" || pathname === "/admin/register") {
      console.log("Skipping auth check for login/register page")
      setLoading(false)
      return
    }
    
    const fetchAdminData = async () => {
      try {
        // Check if API URL is configured
        if (!process.env.NEXT_PUBLIC_API_URL) {
          console.error("NEXT_PUBLIC_API_URL is not configured")
          if (!ignore) {
            setAdmin(null)
            setLoading(false)
            if (window.location.pathname !== "/admin/login") {
              window.location.href = "/admin/login"
            }
          }
          return
        }

        console.log("Fetching admin profile from:", `${process.env.NEXT_PUBLIC_API_URL}/admin/profile`)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/profile`, {
          credentials: "include"
        })

        if (res.status === 401 || res.status === 403) {
          console.log("Admin not authenticated, redirecting to login")
          if (!ignore) {
            setAdmin(null)
            setLoading(false)
            if (window.location.pathname !== "/admin/login") {
              window.location.href = "/admin/login"
            }
          }
          return
        }

        const data = await res.json()
        console.log("Admin profile data:", data)
        if (!ignore) {
          setAdmin(data)
          setLoading(false)
        }
      } catch (error) {
        console.error("Admin profile fetch error:", error)
        if (!ignore) {
          setAdmin(null)
          setLoading(false)
          if (window.location.pathname !== "/admin/login") {
            window.location.href = "/admin/login"
          }
        }
      }
    }

    fetchAdminData()

    // Fetch emergency contacts count only if admin is authenticated
    const fetchCount = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_API_URL) return
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/emergency-contacts`, { credentials: "include" });
        const data = await res.json();
        const pendingCount = data.filter((contact: any) => contact.status === 'pending').length;
        setEmergencyCount(pendingCount || 0);
      } catch {
        setEmergencyCount(0);
      }
    };
    fetchCount();

    return () => { ignore = true; }
  }, [pathname])

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/logout`, {
        method: "POST",
        credentials: "include",
      });
      document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setAdmin(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      window.location.href = "/admin/login";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="text-lg text-gray-500 dark:text-gray-400">Loading Admin Panel...</span>
        </div>
      </div>
    )
  }

  // For login and register pages, render children directly without admin layout
  if (pathname === "/admin/login" || pathname === "/admin/register") {
    console.log("Rendering login/register page without admin layout")
    return <>{children}</>
  }

  // For other admin pages, require authentication
  if (!admin) {
    console.log("No admin data, redirecting to login")
    // Redirect to login if not authenticated
    if (typeof window !== 'undefined') {
      window.location.href = "/admin/login"
    }
    return null
  }

  const menuItems = [
    {
      title: "Dashboard",
      icon: BarChart2,
      href: "/admin",
      color: "text-blue-600"
    },
    {
      title: "User Management",
      icon: Users,
      href: "/admin/users",
      color: "text-green-600"
    },
    {
      title: "Course Management",
      icon: BookOpen,
      href: "/admin/courses",
      color: "text-purple-600"
    },
    {
      title: "Emergency Contacts",
      icon: AlertTriangle,
      href: "/admin/emergency-contacts",
      color: "text-red-600",
      badge: emergencyCount
    },
    {
      title: "System Logs",
      icon: Database,
      href: "/admin/logs",
      color: "text-orange-600"
    },
    {
      title: "To-Do Management",
      icon: ClipboardList,
      href: "/admin/todos",
      color: "text-indigo-600"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Masterly</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Admin Profile */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={admin.avatarUrl || "/avatar-placeholder.png"} />
                <AvatarFallback className="bg-purple-100 text-purple-600">
                  {admin.firstName?.[0]}{admin.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {admin.firstName} {admin.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {admin.email}
                </p>
                <Badge className="mt-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  Administrator
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.title} href={item.href}>
                  <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                    isActive 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="flex-1 font-medium">{item.title}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge className="bg-red-500 text-white text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Top Navigation */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Masterly Admin
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Home Button */}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Go to Homepage"
                className="text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-full"
                onClick={() => router.push("/")}
              >
                <Home className="w-5 h-5" />
              </Button>

              {/* Notification Bell */}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Emergency Contacts"
                className="relative text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-full"
                onClick={() => router.push("/admin/emergency-contacts")}
              >
                <Bell className="w-5 h-5" />
                {emergencyCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {emergencyCount}
                  </span>
                )}
              </Button>

              {/* Settings */}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Settings"
                className="text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-full"
                onClick={() => router.push("/admin/settings")}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </SidebarProvider>
  )
}
