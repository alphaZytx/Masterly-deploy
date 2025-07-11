"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, Trophy, Target, Clock, TrendingUp, Play, CheckCircle, Brain, Calendar, Award, LogOut, Bell, ArrowRight, Plus, Users, Star, Zap, BarChart3, Activity, RefreshCw, Eye, Bookmark, Share2, Download, Filter, Search, Sparkles, Flame, Rocket, GraduationCap, Lightbulb, Timer, Target as TargetIcon, TrendingDown, AlertCircle, Info, FileText, HelpCircle } from 'lucide-react'
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import type { DashboardData } from "@/lib/types/dashboard"
import AuthGuard from "@/components/auth-guard"
import { apiClient } from "@/lib/api";


// --- Helpers and mock data ---
const ProgressChart = ({ data, title, color = "blue" }: { data: number[], title: string, color?: string }) => {
  const maxValue = Math.max(...data, 1)
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    red: "bg-red-500"
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Last 7 days</span>
      </div>
      <div className="flex items-end space-x-1 h-16">
        {data.map((value, index) => (
          <div
            key={index}
            className={`flex-1 ${colorClasses[color as keyof typeof colorClasses]} rounded-t transition-all duration-300 hover:opacity-80`}
            style={{ height: `${(value / maxValue) * 100}%` }}
          />
        ))}
      </div>
    </div>
  )
}

const weeklyData = {
  studyTime: [2, 3, 1, 4, 2, 5, 3],
  conceptsLearned: [3, 5, 2, 7, 4, 6, 3],
  quizzesCompleted: [2, 4, 1, 3, 2, 5, 2]
}

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

const ActivityItem = ({ activity }: { activity: any }) => {
  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        <CheckCircle className="w-4 h-4 text-green-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {activity.conceptTitle || 'Concept'}
          </p>
          <Badge variant={activity.action === 'completed' ? 'default' : 'secondary'} className="text-xs">
            {activity.action || 'completed'}
          </Badge>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
          {activity.courseTitle || 'Course'}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(activity.timeSpent || 0)} • {Math.round((activity.masteryScore || 0) * 100)}% mastery
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatDate(activity.timestamp || new Date().toISOString())}
          </span>
        </div>
      </div>
    </div>
  )
}

const AchievementItem = ({ achievement }: { achievement: any }) => {
  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800">
      <div className="flex-shrink-0">
        <Trophy className="w-5 h-5 text-yellow-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {achievement.title || 'Achievement'}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {achievement.description || 'Description'}
        </p>
      </div>
    </div>
  )
}

// Hydration hook
function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false)
  useEffect(() => {
    setHasHydrated(true)
  }, [])
  return hasHydrated
}

export default function Dashboard() {
  const router = useRouter()
  const { user, logout, isLoading } = useAuthStore()
  const hasHydrated = useHasHydrated()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [emergencyCount, setEmergencyCount] = useState(0)
  const { toast } = useToast()
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Auth guard: redirect to login if not authenticated after hydration
  useEffect(() => {
    if (hasHydrated && !isLoading && !user) {
      router.replace("/login?redirect=/dashboard")
    }
  }, [hasHydrated, isLoading, user, router])

  // Fetch dashboard data from backend
  useEffect(() => {
    if (user) {
      setDashboardLoading(true)
      apiClient.getDashboardData().then((res) => {
        if (res.success) {
          setDashboardData(res.data)
          setLastUpdated(new Date())
        } else {
          toast({ title: "Failed to load dashboard data", description: "Unknown error", variant: "destructive" })
        }
        setDashboardLoading(false)
      }).catch((err) => {
        toast({ title: "Failed to load dashboard data", description: err.message || "Unknown error", variant: "destructive" })
        setDashboardLoading(false)
      })
    }
  }, [user, toast])

  // Show spinner while hydrating, loading, or not authenticated
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

  // Show loading skeleton while dashboard data is loading
  if (dashboardLoading || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Main dashboard UI (use your existing UI here)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user.profile?.firstName || user.profile?.displayName || user.email?.split('@')[0] || 'User'}!
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDashboardLoading(true)}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-gray-600 dark:text-gray-300">Continue your learning journey</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Link href="/learning-paths">
                <Brain className="w-4 h-4 mr-2" />
                Create Learning Path
              </Link>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Emergency Contacts" className="relative text-gray-600 hover:bg-gray-100/50 dark:text-gray-300 dark:hover:bg-gray-700/50 rounded-full h-10 w-10">
              <Bell className="w-5 h-5" />
              {emergencyCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {emergencyCount}
                </span>
              )}
            </Button>
            <div className="flex items-center gap-4">
              {/* Existing profile/avatar button */}
              <Button variant="ghost" className="relative h-8 w-8 rounded-full" onClick={() => router.push('/profile')}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profile?.avatar && user.profile.avatar !== "null" ? user.profile.avatar : ""} alt="User avatar" />
                  <AvatarFallback className="bg-muted flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-muted-foreground">
                      <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
                    </svg>
                  </AvatarFallback>
                </Avatar>
              </Button>
              {/* Explicit Logout Button */}
              <Button variant="outline" onClick={async () => {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout-all`, {
                  method: "POST",
                  credentials: "include",
                });
                window.location.href = "/";
              }}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content (replace with your actual dashboard UI) */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="dark:bg-gray-800/80 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {dashboardData.stats.coursesEnrolled}
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <p className="text-xs text-green-600 dark:text-green-400">+2 this month</p>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800/80 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concepts Mastered</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {dashboardData.stats.completedConcepts}
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <Target className="w-3 h-3 text-green-500" />
                <p className="text-xs text-green-600 dark:text-green-400">
                  {dashboardData.stats.completionRate}% completion rate
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800/80 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {dashboardData.stats.currentStreak} days
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Keep it up!</p>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800/80 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {dashboardData.stats.totalTimeSpent}h
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <Timer className="w-3 h-3 text-blue-500" />
                <p className="text-xs text-blue-600 dark:text-blue-400">This month</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weekly Analytics */}
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                    Weekly Analytics
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Last 7 days
                  </Badge>
                </CardTitle>
                <CardDescription>Your learning activity over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ProgressChart data={weeklyData.studyTime} title="Study Time (hours)" color="blue" />
                  <ProgressChart data={weeklyData.conceptsLearned} title="Concepts Learned" color="green" />
                  <ProgressChart data={weeklyData.quizzesCompleted} title="Quizzes Completed" color="purple" />
                </div>
              </CardContent>
            </Card>

            {/* Learning Paths Overview */}
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-600" />
                    Active Learning Paths
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/learning-paths">
                      View All
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardTitle>
                <CardDescription>Your current learning journeys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData.learningPaths && dashboardData.learningPaths.length > 0 ? (
                  dashboardData.learningPaths.slice(0, 3).map((path, index) => (
                  <div
                    key={index}
                    className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{path.courseTitle}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary">{path.status}</Badge>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {Math.round(path.progress)}% complete
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">{path.progress}%</Badge>
                    </div>

                      <Progress value={path.progress} className="mb-3" />

                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <span>Current: {path.currentNode}</span>
                        <span>{formatTime(path.totalTimeSpent)} spent</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Flame className="w-3 h-3" />
                            <span>{path.streakDays} day streak</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(path.lastAccessed)}</span>
                          </div>
                        </div>
                      <Button size="sm" asChild>
                          <Link href={`/learning-paths/${path.id}`}>Continue</Link>
                      </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Learning Paths Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Start your learning journey by creating a personalized path
                    </p>
                    <Button asChild>
                      <Link href="/learning-paths">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Path
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-600" />
                    Recent Activity
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/progress">
                      View All
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardTitle>
                <CardDescription>Your latest learning activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                    <ActivityItem key={index} activity={activity} />
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Recent Activity
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Start learning to see your activity here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Smart Recommendations */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 dark:from-gray-800/90 dark:to-gray-700/90 dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Smart Recommendations
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Personalized suggestions based on your progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recommendedCourses && dashboardData.recommendedCourses.length > 0 ? (
                    dashboardData.recommendedCourses.slice(0, 2).map((course, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-white/80 border border-gray-200 dark:bg-gray-800/90 dark:border-gray-700">
                        <img
                          src={course.thumbnail || "/placeholder.svg"}
                          alt={course.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{course.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{course.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">{course.level}</Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {course.totalStudents} students
                            </span>
                  </div>
                    </div>
                        <Button size="sm" asChild>
                          <Link href={`/courses/${course.id}`}>Explore</Link>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Complete more courses to get personalized recommendations
                      </p>
                    </div>
                  )}

                  <Button className="w-full" asChild>
                    <Link href="/courses">Browse All Courses</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Insights */}
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Mastery</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {dashboardData.stats.averageMasteryScore}%
                    </span>
                  </div>
                  <Progress value={dashboardData.stats.averageMasteryScore} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Quiz Attempts</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {dashboardData.stats.totalQuizAttempts}
                    </span>
                  </div>
                  <Progress value={Math.min((dashboardData.stats.totalQuizAttempts / 50) * 100, 100)} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">In Progress</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">
                      {dashboardData.stats.inProgressConcepts}
                    </span>
                  </div>
                  <Progress value={Math.min((dashboardData.stats.inProgressConcepts / 20) * 100, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-600" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.achievements && dashboardData.achievements.length > 0 ? (
                  <>
                    {dashboardData.achievements.slice(0, 3).map((achievement, index) => (
                      <AchievementItem key={index} achievement={achievement} />
                    ))}
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <Link href="/progress?tab=achievements">View All Achievements</Link>
                </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Complete more milestones to earn achievements
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.upcomingDeadlines && dashboardData.upcomingDeadlines.length > 0 ? (
                  dashboardData.upcomingDeadlines.slice(0, 3).map((deadline, index) => (
                  <div key={index} className="border dark:border-gray-700 rounded-lg p-3">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">{deadline.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{deadline.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mt-2">
                        <span>{formatDate(deadline.dueDate)}</span>
                        <Badge variant={deadline.priority === 'high' ? 'destructive' : 'secondary'}>
                          {deadline.priority}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">No upcoming deadlines</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/courses">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Browse Courses
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/mock-tests">
                      <FileText className="w-4 h-4 mr-2" />
                      Take Mock Test
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/progress">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Progress
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/help">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Get Help
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
