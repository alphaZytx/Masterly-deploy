"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Brain, 
  Play, 
  Target, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  Lock, 
  Unlock,
  ArrowRight,
  Plus,
  BookOpen,
  Zap,
  Code,
  Database,
  Globe,
  Trophy,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/lib/auth"
import apiClient from "@/lib/api"
import type { DashboardData } from "@/lib/types/dashboard"

interface LearningPath {
  id: string
  courseTitle: string
  courseThumbnail?: string
  progress: number
  currentNode: string
  status: 'active' | 'completed' | 'paused'
  lastAccessed: string
  totalTimeSpent: number
  streakDays: number
  totalConcepts: number
  completedConcepts: number
}

interface RecommendedPath {
  id: string
  title: string
  description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  estimatedDuration: string
  prerequisites: string[]
  icon: any
  color: string
}

const courseIcons = {
  'Data Structures & Algorithms': Code,
  'System Design': Database,
  'Full Stack Web Development': Globe,
  'Machine Learning': Brain,
  'default': BookOpen
}

const courseColors = {
  'Data Structures & Algorithms': 'from-blue-500 to-purple-600',
  'System Design': 'from-orange-500 to-red-600',
  'Full Stack Web Development': 'from-green-500 to-teal-600',
  'Machine Learning': 'from-purple-500 to-pink-600',
  'default': 'from-gray-500 to-gray-600'
}

export default function LearningPathsDashboard() {
  const { user } = useAuthStore()
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [recommendedPaths, setRecommendedPaths] = useState<RecommendedPath[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activePath, setActivePath] = useState<string | null>(null)

  useEffect(() => {
    const fetchLearningPaths = async () => {
      if (!user) return
      
      try {
        const response = await apiClient.getDashboardData()
        if (response.success && response.data.learningPaths) {
          setLearningPaths(response.data.learningPaths)
          
          // Set active path (most recently accessed)
          if (response.data.learningPaths.length > 0) {
            const mostRecent = response.data.learningPaths.reduce((prev: any, current: any) => 
              new Date(current.lastAccessed) > new Date(prev.lastAccessed) ? current : prev
            )
            setActivePath(mostRecent.id)
          }
        }

        // Mock recommended paths for now
        setRecommendedPaths([
          {
            id: 'python-basics',
            title: 'Python Fundamentals',
            description: 'Master Python programming from basics to advanced concepts',
            difficulty: 'Beginner',
            estimatedDuration: '4-6 weeks',
            prerequisites: ['Basic computer literacy'],
            icon: Code,
            color: 'from-green-500 to-emerald-600'
          },
          {
            id: 'advanced-dsa',
            title: 'Advanced DSA',
            description: 'Deep dive into complex algorithms and data structures',
            difficulty: 'Advanced',
            estimatedDuration: '8-12 weeks',
            prerequisites: ['DSA Fundamentals', 'Problem Solving'],
            icon: Brain,
            color: 'from-purple-500 to-indigo-600'
          },
          {
            id: 'cloud-architecture',
            title: 'Cloud Architecture',
            description: 'Design and deploy scalable cloud solutions',
            difficulty: 'Intermediate',
            estimatedDuration: '6-8 weeks',
            prerequisites: ['System Design Basics', 'Networking'],
            icon: Database,
            color: 'from-blue-500 to-cyan-600'
          }
        ])
      } catch (error) {
        console.error('Failed to fetch learning paths:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLearningPaths()
  }, [user])

  const getCourseIcon = (courseTitle: string) => {
    return courseIcons[courseTitle as keyof typeof courseIcons] || courseIcons.default
  }

  const getCourseColor = (courseTitle: string) => {
    return courseColors[courseTitle as keyof typeof courseColors] || courseColors.default
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Paths</h2>
            <p className="text-gray-600 dark:text-gray-300">Track your learning journey</p>
          </div>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            New Path
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Paths</h2>
          <p className="text-gray-600 dark:text-gray-300">Track your learning journey</p>
        </div>
        <Button asChild>
          <Link href="/learning-paths">
            <Plus className="w-4 h-4 mr-2" />
            New Path
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Learning Paths */}
          <Card className="dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Your Learning Paths
              </CardTitle>
              <CardDescription>
                {learningPaths.length > 0 
                  ? `${learningPaths.length} active learning path${learningPaths.length > 1 ? 's' : ''}`
                  : 'No learning paths yet. Start your journey!'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {learningPaths.length > 0 ? (
                learningPaths.map((path) => {
                  const IconComponent = getCourseIcon(path.courseTitle)
                  const colorClass = getCourseColor(path.courseTitle)
                  
                  return (
                    <div
                      key={path.id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
                        activePath === path.id 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClass} text-white`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {path.courseTitle}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getStatusColor(path.status)}>
                                {path.status.charAt(0).toUpperCase() + path.status.slice(1)}
                              </Badge>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {path.completedConcepts}/{path.totalConcepts} concepts
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActivePath(path.id)}
                          className={activePath === path.id ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>

                      <Progress value={path.progress} className="mb-3" />

                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <span>Current: {path.currentNode}</span>
                        <span>{path.progress}% complete</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(path.totalTimeSpent)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{path.streakDays} day streak</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(path.lastAccessed)}</span>
                          </div>
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/learning-paths/${path.id}`}>
                            <Play className="w-3 h-3 mr-1" />
                            Continue
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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

          {/* Recommended Paths */}
          <Card className="dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                Recommended Paths
              </CardTitle>
              <CardDescription>
                Personalized recommendations based on your progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendedPaths.map((path) => {
                const IconComponent = path.icon
                
                return (
                  <div
                    key={path.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${path.color} text-white`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {path.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {path.description}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {path.difficulty}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-3">
                      <span>Duration: {path.estimatedDuration}</span>
                      <span>{path.prerequisites.length} prerequisites</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Prerequisites: {path.prerequisites.join(', ')}
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/learning-paths/new?course=${path.id}`}>
                          Start Path
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                Learning Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Active Paths</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {learningPaths.filter(p => p.status === 'active').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Completed</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {learningPaths.filter(p => p.status === 'completed').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Time</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatTime(learningPaths.reduce((sum, p) => sum + p.totalTimeSpent, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Best Streak</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {learningPaths.length > 0 
                    ? Math.max(...learningPaths.map(p => p.streakDays))
                    : 0
                  } days
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/learning-paths">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Path
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/courses">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Courses
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/progress">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Progress
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 