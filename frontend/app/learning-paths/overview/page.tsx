"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Calendar,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Edit,
  Trash2,
  Pause,
  Play as PlayIcon
} from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/lib/auth"
import apiClient from "@/lib/api"
import type { DashboardData } from "@/lib/types/dashboard"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  createdAt: string
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

export default function LearningPathsOverview() {
  const { user } = useAuthStore()
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [filteredPaths, setFilteredPaths] = useState<LearningPath[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("lastAccessed")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const fetchLearningPaths = async () => {
      if (!user) return
      
      try {
        const response = await apiClient.getDashboardData()
        if (response.success && response.data.learningPaths) {
          // Ensure all required fields are present
          const paths = response.data.learningPaths.map((p: any) => ({
            ...p,
            totalConcepts: p.totalConcepts ?? 0,
            completedConcepts: p.completedConcepts ?? 0,
            createdAt: p.createdAt ?? p.lastAccessed ?? new Date().toISOString(),
          }))
          setLearningPaths(paths)
          setFilteredPaths(paths)
        }
      } catch (error) {
        console.error('Failed to fetch learning paths:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLearningPaths()
  }, [user])

  useEffect(() => {
    let filtered = learningPaths

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(path => 
        path.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        path.currentNode.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(path => path.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case "progress":
          aValue = a.progress
          bValue = b.progress
          break
        case "lastAccessed":
          aValue = new Date(a.lastAccessed)
          bValue = new Date(b.lastAccessed)
          break
        case "createdAt":
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case "totalTimeSpent":
          aValue = a.totalTimeSpent
          bValue = b.totalTimeSpent
          break
        case "streakDays":
          aValue = a.streakDays
          bValue = b.streakDays
          break
        default:
          aValue = a.courseTitle
          bValue = b.courseTitle
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredPaths(filtered)
  }, [learningPaths, searchQuery, statusFilter, sortBy, sortOrder])

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

  const handlePathAction = async (pathId: string, action: string) => {
    try {
      // TODO: Implement path actions (pause, resume, delete, etc.)
      console.log(`Action ${action} for path ${pathId}`)
    } catch (error) {
      console.error(`Failed to ${action} path:`, error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading learning paths...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learning Paths</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage and track your learning journeys
                </p>
              </div>
              <Button asChild>
                <Link href="/learning-paths">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Path
                </Link>
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <Card className="dark:bg-gray-800/80 dark:border-gray-700 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search learning paths..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastAccessed">Last Accessed</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="totalTimeSpent">Time Spent</SelectItem>
                    <SelectItem value="streakDays">Streak Days</SelectItem>
                    <SelectItem value="courseTitle">Course Name</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Learning Paths List */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({learningPaths.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({learningPaths.filter(p => p.status === 'active').length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({learningPaths.filter(p => p.status === 'completed').length})</TabsTrigger>
              <TabsTrigger value="paused">Paused ({learningPaths.filter(p => p.status === 'paused').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredPaths.length > 0 ? (
                filteredPaths.map((path) => {
                  const IconComponent = getCourseIcon(path.courseTitle)
                  const colorClass = getCourseColor(path.courseTitle)
                  
                  return (
                    <Card key={path.id} className="dark:bg-gray-800/80 dark:border-gray-700 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClass} text-white`}>
                              <IconComponent className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/learning-paths/${path.id}`}>
                                  <PlayIcon className="w-4 h-4 mr-2" />
                                  Continue
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePathAction(path.id, 'edit')}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {path.status === 'active' && (
                                <DropdownMenuItem onClick={() => handlePathAction(path.id, 'pause')}>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause
                                </DropdownMenuItem>
                              )}
                              {path.status === 'paused' && (
                                <DropdownMenuItem onClick={() => handlePathAction(path.id, 'resume')}>
                                  <Play className="w-4 h-4 mr-2" />
                                  Resume
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handlePathAction(path.id, 'delete')}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <Progress value={path.progress} className="mb-4" />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-300">Current Node</p>
                            <p className="font-medium text-gray-900 dark:text-white">{path.currentNode}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-300">Progress</p>
                            <p className="font-medium text-gray-900 dark:text-white">{path.progress}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-300">Time Spent</p>
                            <p className="font-medium text-gray-900 dark:text-white">{formatTime(path.totalTimeSpent)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-300">Streak</p>
                            <p className="font-medium text-gray-900 dark:text-white">{path.streakDays} days</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Last accessed: {formatDate(path.lastAccessed)}
                          </div>
                          <Button asChild>
                            <Link href={`/learning-paths/${path.id}`}>
                              <Play className="w-4 h-4 mr-2" />
                              Continue Learning
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <Card className="dark:bg-gray-800/80 dark:border-gray-700">
                  <CardContent className="p-8 text-center">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Learning Paths Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {searchQuery || statusFilter !== "all" 
                        ? "Try adjusting your search or filters"
                        : "Start your learning journey by creating a new path"
                      }
                    </p>
                    {!searchQuery && statusFilter === "all" && (
                      <Button asChild>
                        <Link href="/learning-paths">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Path
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {filteredPaths.filter(p => p.status === 'active').map((path) => (
                // Same card structure as above
                <div key={path.id}>Active path card</div>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {filteredPaths.filter(p => p.status === 'completed').map((path) => (
                // Same card structure as above
                <div key={path.id}>Completed path card</div>
              ))}
            </TabsContent>

            <TabsContent value="paused" className="space-y-4">
              {filteredPaths.filter(p => p.status === 'paused').map((path) => (
                // Same card structure as above
                <div key={path.id}>Paused path card</div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 