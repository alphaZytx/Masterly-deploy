"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  Clock, 
  BookOpen, 
  Play, 
  FileText, 
  Code, 
  Brain, 
  Star,
  TrendingUp,
  RefreshCw
} from "lucide-react"
import apiClient from "@/lib/api"

interface CourseStats {
  totalStudents: number
  totalRatings: number
  averageRating: number
  totalReviews: number
  completionRate: number
  totalDuration: number
  totalConcepts: number
  totalVideos: number
  totalArticles: number
  totalProblems: number
  totalQuizzes: number
}

interface CourseStatsDisplayProps {
  courseId: string
  initialStats?: CourseStats
  showRefreshButton?: boolean
  className?: string
}

export default function CourseStatsDisplay({ 
  courseId, 
  initialStats, 
  showRefreshButton = false,
  className = "" 
}: CourseStatsDisplayProps) {
  const [stats, setStats] = useState<CourseStats | null>(initialStats || null)
  const [isLoading, setIsLoading] = useState(!initialStats)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!initialStats) {
      fetchStats()
    }
  }, [courseId, initialStats])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get(`/courses/${courseId}`)
      if (response.success) {
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch course stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshStats = async () => {
    try {
      setIsRefreshing(true)
      await fetchStats()
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}d ${remainingHours}h`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (isLoading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">No stats available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with refresh button */}
      {showRefreshButton && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Course Statistics</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStats}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Students */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <Badge variant="secondary" className="text-xs">
                {stats.totalStudents > 0 ? 'Active' : 'New'}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(stats.totalStudents)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Students</p>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <Badge variant="outline" className="text-xs">
                {stats.completionRate}%
              </Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.completionRate}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Completion</p>
            <Progress value={stats.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        {/* Total Duration */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <Badge variant="outline" className="text-xs">
                {formatDuration(stats.totalDuration)}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDuration(stats.totalDuration)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Duration</p>
          </CardContent>
        </Card>

        {/* Total Concepts */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-5 h-5 text-orange-600" />
              <Badge variant="outline" className="text-xs">
                {stats.totalConcepts}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalConcepts}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Concepts</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Breakdown</CardTitle>
          <CardDescription>Detailed breakdown of course content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Videos */}
            <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Play className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {stats.totalVideos}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Videos</div>
              </div>
            </div>

            {/* Articles */}
            <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {stats.totalArticles}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Articles</div>
              </div>
            </div>

            {/* Problems */}
            <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Code className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {stats.totalProblems}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Problems</div>
              </div>
            </div>

            {/* Quizzes */}
            <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Brain className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {stats.totalQuizzes}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Quizzes</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Section (when implemented) */}
      {stats.totalRatings > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Student Ratings</CardTitle>
            <CardDescription>What students are saying about this course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.averageRating.toFixed(1)}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div>{stats.totalRatings} ratings</div>
                <div>{stats.totalReviews} reviews</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 