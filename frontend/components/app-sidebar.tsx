"use client"

import { useEffect, useState } from "react"
import {
  BookOpen,
  Home,
  Brain,
  Trophy,
  FileText,
  User,
  Settings,
  BarChart3,
  HelpCircle,
  Target,
  Clock,
  TrendingUp,
  Play,
  CheckCircle,
  Calendar,
  Award,
  Zap,
  Star,
  Bookmark,
  Lightbulb,
  GraduationCap,
  Rocket
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuthStore } from "@/lib/auth"
import apiClient from "@/lib/api"
import type { DashboardData } from "@/lib/types/dashboard"

interface SidebarItem {
  title: string
  url: string
  icon: any
  badge?: number | string
  description?: string
  progress?: number
  isNew?: boolean
}

// Accept dashboardData as a prop
export function AppSidebar({ dashboardData = null }: { dashboardData?: DashboardData | null }) {
  const { user, isAuthenticated } = useAuthStore()
  const pathname = usePathname()

  // Function to check if a menu item is active
  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard"
    }
    if (url === "/progress?tab=achievements") {
      return pathname === "/progress" && pathname.includes("tab=achievements")
    }
    return pathname.startsWith(url)
  }

  // Dynamic learning menu items based on user progress
  const getLearningMenuItems = (): SidebarItem[] => {
    const items: SidebarItem[] = [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        description: "Your learning overview"
      }
    ]

    // Add learning paths if user has any
    if (dashboardData?.learningPaths && dashboardData.learningPaths.length > 0) {
      items.push({
        title: "Learning Paths",
        url: "/learning-paths",
        icon: Brain,
        badge: dashboardData.learningPaths.length,
        description: `${dashboardData.learningPaths.length} active path${dashboardData.learningPaths.length > 1 ? 's' : ''}`
      })
    } else {
      items.push({
        title: "Learning Paths",
        url: "/learning-paths",
        icon: Brain,
        description: "Create your learning journey",
        isNew: true
      })
    }

    // Add courses with progress
    if (dashboardData?.stats?.coursesEnrolled && dashboardData.stats.coursesEnrolled > 0) {
      items.push({
        title: "My Courses",
        url: "/courses",
        icon: BookOpen,
        badge: dashboardData.stats.coursesEnrolled,
        description: `${dashboardData.stats.completedConcepts || 0} concepts mastered`
      })
    } else {
      items.push({
        title: "Courses",
        url: "/courses",
        icon: BookOpen,
        description: "Explore available courses"
      })
    }

    // Add progress tracking
    if (dashboardData?.stats?.totalConcepts && dashboardData.stats.totalConcepts > 0) {
      items.push({
        title: "Progress",
        url: "/progress",
        icon: BarChart3,
        progress: dashboardData.stats.completionRate || 0,
        description: `${dashboardData.stats.completionRate || 0}% complete`
      })
    } else {
      items.push({
        title: "Progress",
        url: "/progress",
        icon: BarChart3,
        description: "Track your learning journey"
      })
    }

    // Add achievements if user has any
    if (dashboardData?.achievements && dashboardData.achievements.length > 0) {
      items.push({
        title: "Achievements",
        url: "/progress?tab=achievements",
        icon: Trophy,
        badge: dashboardData.achievements.length,
        description: `${dashboardData.achievements.length} unlocked`
      })
    }

    // Add mock tests
    items.push({
      title: "Mock Tests",
      url: "/mock-tests",
      icon: FileText,
      description: "Practice and assess"
    })

    return items
  }

  // Dynamic quick actions based on user progress
  const getQuickActions = (): SidebarItem[] => {
    const actions: SidebarItem[] = []

    // Continue learning if user has active paths
    if (dashboardData?.learningPaths && dashboardData.learningPaths.length > 0) {
      const activePath = dashboardData.learningPaths.find(p => p.status === 'active')
      if (activePath) {
        actions.push({
          title: "Continue Learning",
          url: `/learning-paths/${activePath.id}`,
          icon: Play,
          description: activePath.currentNode,
          progress: activePath.progress
        })
      }
    }

    // Recommended courses
    if (dashboardData?.recommendedCourses && dashboardData.recommendedCourses.length > 0) {
      actions.push({
        title: "Recommended",
        url: "/courses",
        icon: Star,
        description: `${dashboardData.recommendedCourses.length} courses for you`
      })
    }

    // Streak reminder
    if (dashboardData?.stats?.currentStreak && dashboardData.stats.currentStreak > 0) {
      actions.push({
        title: "Maintain Streak",
        url: "/dashboard",
        icon: Zap,
        description: `${dashboardData.stats.currentStreak} day streak`,
        badge: dashboardData.stats.currentStreak
      })
    }

    return actions
  }

  const learningItems = getLearningMenuItems()
  const quickActions = getQuickActions()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center space-x-2 px-2 py-2">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Masterly
            </span>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Learning Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Learning</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {learningItems.map((item) => {
                const active = isActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={active ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500" : ""}
                      tooltip={item.description}
                    >
                      <Link href={item.url} className="flex items-center space-x-3">
                        <item.icon className="w-4 h-4" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium flex items-center space-x-2">
                            <span>{item.title}</span>
                            {item.isNew && (
                              <Badge variant="destructive" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          {/* Removed description from visible sidebar */}
                          {item.progress !== undefined && (
                            <Progress value={item.progress} className="h-1 mt-1" />
                          )}
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/profile">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/settings">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/help">
                    <HelpCircle className="w-4 h-4" />
                    <span>Help</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions - Moved to bottom */}
        {quickActions.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {quickActions.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.description}>
                      <Link href={item.url} className="flex items-center space-x-3">
                        <item.icon className="w-4 h-4" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{item.title}</div>
                          {/* Removed description from visible sidebar */}
                          {item.progress !== undefined && (
                            <Progress value={item.progress} className="h-1 mt-1" />
                          )}
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center justify-between p-2">
          <ThemeToggle />
        </div>

        {/* User Profile */}
        {isAuthenticated && user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/profile" className="flex items-center space-x-3 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage 
                      src={user.profile?.avatar || ""} 
                      alt="User avatar" 
                    />
                    <AvatarFallback>
                      {user.profile?.firstName?.[0] || user.profile?.displayName?.[0] || user.email?.[0] || 'U'}
                      {user.profile?.lastName?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {user.profile?.fullName || user.profile?.displayName || user.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center space-x-1">
                      <span>{user.subscription?.plan === "premium" ? "Premium" : "Free"}</span>
                      {dashboardData?.stats?.currentStreak && dashboardData.stats.currentStreak > 0 && (
                        <>
                          <span>•</span>
                          <span>{dashboardData.stats.currentStreak} day streak</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}