"use client"

import React, { useState, useEffect, useContext, memo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  CheckCircle,
  Lock,
  Unlock,
  FileText,
  Video,
  TestTube,
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Brain,
  Target,
  Timer,
  Award,
  Loader2,
  AlertCircle,
  Eye,
  Clock,
  Zap,
  Star,
  Trophy,
  BookMarked,
  GraduationCap,
  History,
  Map,
  Expand,
  Circle,
  Info,
  Code,
  X,
  XCircle,
  RotateCcw,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { useAuthStore } from "@/lib/auth"
import VideoPlayer from "@/components/video-player"
import { QuizPlatform } from "@/components/quiz-platform"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { GlobalLoadingContext } from '@/app/context/global-loading'

interface Concept {
  _id: string
  title: string
  description: string
  complexity: number
  estLearningTimeHours: number
  masteryScore: number
  status: 'not_started' | 'in_progress' | 'completed'
  mastered: boolean
  timeSpent: number
  attempts: number
  isUnlocked: boolean
  prerequisites?: string[]
  content?: {
    intro?: string
    sections?: Array<{
      heading: string
      content: string
      codeExamples?: string[]
    }>
    description?: string
    videoUrl?: string
    articleUrl?: string
  }
  videoUrl?: string
  estimatedTime?: string
  quiz?: {
    questions: Array<{
      questionId: string
      text: string
      options: string[]
      answer: number
      explanation: string
    }>
  }
  finalTestScore?: number
  canTakeQuiz?: boolean
}

interface CourseLearning {
  course: {
    _id: string
    title: string
    description: string
    category: string
    level: string
    instructor: {
      name: string
      avatar: string
    }
  }
  userProgress: {
    overallProgress: number
    status: string
    lastAccessedAt: string
    timeSpent: number
    conceptsCompleted: number
    totalConcepts: number
  }
  sequentialConcepts: Concept[]
  currentConcept: string
  pagination: {
    currentPage: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

interface LearningPageProps {
  params: Promise<{ id: string }>
}

export default function DynamicLearningPage({ params }: LearningPageProps) {
  const [courseId, setCourseId] = useState<string | null>(null)
  const [courseData, setCourseData] = useState<CourseLearning | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0)
  const [videoLoading, setVideoLoading] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)
  const [showLearningGraph, setShowLearningGraph] = useState(false)
  const [allConcepts, setAllConcepts] = useState<any[]>([])
  const [loadingGraph, setLoadingGraph] = useState(false)
  const [conceptProgress, setConceptProgress] = useState<{
    descriptionRead: boolean
    videoWatched: boolean
    quizPassed: boolean
    attempts: number
    isCompleted: boolean
    contentRead: boolean
  }>({
    descriptionRead: false,
    videoWatched: false,
    quizPassed: false,
    attempts: 0,
    isCompleted: false,
    contentRead: false
  })
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [videoWatchTime, setVideoWatchTime] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [contentExpanded, setContentExpanded] = useState(false)
  const [videoExpanded, setVideoExpanded] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [showReview, setShowReview] = useState(true)
  const [lastQuizPassed, setLastQuizPassed] = useState(true)
  const [showQuizResults, setShowQuizResults] = useState(false)
  const [quizResults, setQuizResults] = useState<{score: number, passed: boolean, userAnswers?: number[]} | null>(null)

  const [markingContent, setMarkingContent] = useState(false)
  const [markingVideo, setMarkingVideo] = useState(false)
  const [nextConcept, setNextConcept] = useState<any>(null)
  
  const { user } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { toast } = useToast()
  const { isLoading, setLoading: setGlobalLoading } = useContext(GlobalLoadingContext)

  // Resolve params safely
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolved = await params
        setCourseId(resolved.id)
      } catch (error) {
        console.error('Failed to resolve params:', error)
      }
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (courseId) {
      loadCourseLearning()
    }
  }, [courseId])

  useEffect(() => {
    if (courseData && courseData.sequentialConcepts[currentConceptIndex]) {
      loadConceptProgress()
    }
  }, [currentConceptIndex, courseData])

  // On mount, reset quiz modal state
  useEffect(() => {
    // Reset quiz modal state on page load to prevent it from staying open after refresh
    setShowQuizModal(false)
    setShowReview(false)
    setQuizScore(0)
    setShowQuizResults(false)
    setQuizResults(null)
  }, [])

  const loadCourseLearning = async (page: number = 1) => {
    if (!courseId) return
    
    try {
      setLoading(true)
      
      // First get the course dashboard to get the current concept
      const dashboardResponse = await apiClient.getCourseDashboard(courseId)
      
      if (!dashboardResponse.success) {
        setError(dashboardResponse.message || 'Failed to load course dashboard')
        return
      }

      const dashboard = dashboardResponse.data
      const concepts = dashboard.sequentialConcepts || []
      
      if (concepts.length === 0) {
        setError('No learning concepts found for this course')
        return
      }

      // Check if there's a specific concept in the URL
      const urlParams = new URLSearchParams(window.location.search)
      const conceptParam = urlParams.get('concept')
      
      let currentConcept
      if (conceptParam) {
        // Find the specific concept from URL
        currentConcept = concepts.find((c: any) => c._id === conceptParam)
        if (!currentConcept) {
          // Fallback to first concept if not found
          currentConcept = concepts[0]
        }
      } else {
        // Find the current concept (first non-completed concept or first concept)
        currentConcept = concepts.find((c: any) => c.status !== 'completed') || concepts[0]
      }
      
      console.log('🎯 Current concept found:', {
        conceptId: currentConcept._id,
        title: currentConcept.title,
        status: currentConcept.status
      })

      // Now fetch the full concept content
      const conceptResponse = await apiClient.getConceptLearningPage(courseId, currentConcept._id)
      
      if (!conceptResponse.success) {
        setError(conceptResponse.message || 'Failed to load concept content')
        return
      }

      const conceptData = conceptResponse.data
      
      console.log('📚 Full concept data received:', {
        hasDescription: !!conceptData.concept.description,
        hasVideoUrl: !!conceptData.concept.videoUrl,
        hasContent: !!conceptData.concept.content,
        hasQuiz: !!conceptData.concept.quiz
      })

      // Transform the data to match the expected structure
      const transformedData: CourseLearning = {
        course: dashboard.course,
        userProgress: dashboard.userProgress,
        sequentialConcepts: [conceptData.concept], // Only the current concept with full data
        currentConcept: currentConcept._id,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      }

      setCourseData(transformedData)
      setCurrentConceptIndex(0)
      setLoading(false)
      
    } catch (err) {
      console.error('❌ Error loading course learning:', err)
      setError('Failed to load course learning data')
    } finally {
      setLoading(false)
    }
  }

  const loadConceptProgress = async () => {
    if (!courseData || !courseData.sequentialConcepts[currentConceptIndex] || !courseId) return
    
    const concept = courseData.sequentialConcepts[currentConceptIndex]
    
    try {
      // Fetch actual progress from backend
      const response = await apiClient.getCourseDashboard(courseId)
      
      if (response.success && response.data.sequentialConcepts) {
        const conceptWithProgress = response.data.sequentialConcepts.find(
          (c: any) => c._id === concept._id
        )
        
        if (conceptWithProgress) {
          // Get the actual progress from UserConceptProgress using API client
          const progressResponse = await apiClient.getConceptProgress(concept._id, courseId)
          
          if (progressResponse.success) {
            setConceptProgress({
              descriptionRead: progressResponse.data?.descriptionRead || false,
              videoWatched: progressResponse.data?.videoWatched || false,
              quizPassed: progressResponse.data?.quizPassed || false,
              attempts: progressResponse.data?.attempts || 0,
              isCompleted: progressResponse.data?.status === 'completed',
              contentRead: progressResponse.data?.descriptionRead || false
            })
          } else {
            // Fallback to concept status if progress fetch fails
            setConceptProgress({
              descriptionRead: concept.status === 'completed' || concept.status === 'in_progress',
              videoWatched: concept.status === 'completed' || concept.status === 'in_progress',
              quizPassed: concept.status === 'completed',
              attempts: concept.attempts || 0,
              isCompleted: concept.status === 'completed',
              contentRead: concept.status === 'completed' || concept.status === 'in_progress'
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to load concept progress:', error)
      // Fallback to concept status if API call fails
      setConceptProgress({
        descriptionRead: concept.status === 'completed' || concept.status === 'in_progress',
        videoWatched: concept.status === 'completed' || concept.status === 'in_progress',
        quizPassed: concept.status === 'completed',
        attempts: concept.attempts || 0,
        isCompleted: concept.status === 'completed',
        contentRead: concept.status === 'completed' || concept.status === 'in_progress'
      })
    }
  }

  const loadLearningGraph = async () => {
    if (!courseId) return
    
    try {
      setLoadingGraph(true)
      
      // Use the course dashboard API to get all concepts
      const response: any = await apiClient.getCourseDashboard(courseId)
      
      if (response.success && response.data.sequentialConcepts) {
        // Get all concepts from the dashboard data
        const allConceptsFromDashboard = response.data.sequentialConcepts
        
        // Create a comprehensive list of all concepts for the graph
        const graphConcepts = allConceptsFromDashboard.map((concept: any) => ({
          _id: concept._id,
          title: concept.title,
          description: concept.description,
          status: concept.status || 'not_started',
          complexity: concept.complexity || 1,
          estLearningTimeHours: concept.estLearningTimeHours || 1,
          masteryScore: concept.masteryScore || 0,
          attempts: concept.attempts || 0,
          timeSpent: concept.timeSpent || 0,
          isUnlocked: concept.isUnlocked || true
        }))
        
        setAllConcepts(graphConcepts)
      } else {
        // Fallback: use the existing course data if available
        if (courseData && courseData.sequentialConcepts) {
          setAllConcepts(courseData.sequentialConcepts)
        }
      }
    } catch (err) {
      console.error('Error loading learning graph:', err)
      // Fallback: use the existing course data if available
      if (courseData && courseData.sequentialConcepts) {
        console.log('Using fallback course data after error')
        setAllConcepts(courseData.sequentialConcepts)
      }
    } finally {
      setLoadingGraph(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getComplexityColor = (complexity: number) => {
    if (complexity <= 2) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (complexity <= 4) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  const getComplexityText = (complexity: number) => {
    if (complexity <= 2) return 'Easy'
    if (complexity <= 4) return 'Medium'
    return 'Hard'
  }

  const handleMarkContentRead = async () => {
    if (!courseData || !courseData.sequentialConcepts[currentConceptIndex] || !courseId) return
    setMarkingContent(true)
    try {
      const concept = courseData.sequentialConcepts[currentConceptIndex]
      await apiClient.updateConceptProgress(concept._id, 'mark_description_read', {
        courseId: courseId,
        timeSpent: 0
      })
      
      // Update local state immediately
      setConceptProgress(prev => ({
        ...prev,
        contentRead: true,
        descriptionRead: true
      }))
      
      // Refresh progress data in background (no loading spinner)
      loadConceptProgress().catch(console.error)
      
      // Show success toast
      toast({
        title: "Content Marked as Read! 📖",
        description: "Great progress! Keep going to unlock the next steps.",
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark content as read. Please try again.",
        duration: 3000,
      })
    } finally {
      setMarkingContent(false)
    }
  }

  const handleVideoWatch = async () => {
    if (!courseData || !courseData.sequentialConcepts[currentConceptIndex]) return
    
    const concept = courseData.sequentialConcepts[currentConceptIndex]
    const videoUrl = concept.videoUrl || concept.content?.videoUrl
    if (videoUrl) {
      setShowVideoPlayer(true)
      setVideoLoading(true)
      
      // Simulate video watching progress
      setTimeout(() => {
        setVideoLoading(false)
        setConceptProgress(prev => ({ ...prev, videoWatched: true }))
        
        // Update progress in backend
        if (courseId) {
          apiClient.updateConceptProgress(concept._id, 'mark_video_watched', {
            courseId: courseId,
            timeSpent: 120 // 2 minutes
          }).catch(error => {
            console.error('Failed to update video progress:', error)
          })
        }
      }, 2000)
    }
  }

  const handleMarkVideoWatched = async () => {
    if (!courseData || !courseData.sequentialConcepts[currentConceptIndex] || !courseId) return
    setMarkingVideo(true)
    try {
      const concept = courseData.sequentialConcepts[currentConceptIndex]
      await apiClient.updateConceptProgress(concept._id, 'mark_video_watched', {
        courseId: courseId,
        timeSpent: 120
      })
      
      // Update local state immediately
      setConceptProgress(prev => ({
        ...prev,
        videoWatched: true
      }))
      
      // Refresh progress data in background (no loading spinner)
      loadConceptProgress().catch(console.error)
      
      // Show success toast
      toast({
        title: "Video Marked as Watched! 🎥",
        description: "Excellent! You're making great progress through this concept.",
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark video as watched. Please try again.",
        duration: 3000,
      })
    } finally {
      setMarkingVideo(false)
    }
  }

  const handleQuizStart = async () => {
    if (!courseData || !courseData.sequentialConcepts[currentConceptIndex]) return
    setShowQuizModal(true)
    // If you need to update backend progress, do it here but do not block the modal
    try {
      // await apiClient.markQuizStarted(...)
    } catch (error) {
      // Optionally show a toast or error, but do not close the modal
      console.error('Failed to update quiz start progress:', error)
    }
  }

  const handleQuizComplete = async (score: number, passed: boolean, userAnswers?: number[]) => {
    if (!courseData || !courseData.sequentialConcepts[currentConceptIndex]) return;
    
    // Store quiz results and show them outside the modal
    setQuizResults({ score, passed, userAnswers });
    setShowQuizResults(true);
    setShowQuizModal(false); // Close the modal
    
    setQuizScore(score);
    setLastQuizPassed(passed);
    setShowReview(passed); // Only show review if passed
    
    if (passed) {
      setConceptProgress(prev => ({
        ...prev,
        quizPassed: true,
        attempts: prev.attempts + 1,
        isCompleted: true
      }));
      
      // Refresh course data to update progress
      await loadCourseLearning();
    } else {
      // For failed quiz, reset progress
      const concept = courseData.sequentialConcepts[currentConceptIndex];
      if (courseId) {
        await apiClient.resetConceptProgress(concept._id, courseId);
      }
      setConceptProgress(prev => ({
        ...prev,
        descriptionRead: false,
        videoWatched: false,
        contentRead: false,
        quizPassed: false,
        isCompleted: false,
        attempts: prev.attempts + 1
      }));
      
      // Refresh course data
      await loadCourseLearning();
    }
  };

  const handleQuizClose = async (passed: boolean) => {
    setShowQuizModal(false);
    
    if (passed) {
      // Go to next concept
      const next = await getNextConcept();
      if (next) {
        router.push(`/courses/${courseId}/learn?concept=${next._id}`);
    } else {
        // Course completed
        router.push(`/courses/${courseId}`);
      }
    } else {
      // Return to current concept (reset everything)
      setQuizScore(0);
      setShowReview(false);
      setShowQuizResults(false);
      setQuizResults(null);
      await loadConceptProgress();
      await loadCourseLearning();
    }
  }

  const getNextConcept = async () => {
    if (!courseId) return null
    
    try {
      // Get the full course dashboard to find the next concept
      const dashboardResponse = await apiClient.getCourseDashboard(courseId)
      
      if (!dashboardResponse.success) {
        console.error('Failed to get course dashboard for next concept')
        return null
      }

      const concepts = dashboardResponse.data.sequentialConcepts || []
      const currentConceptId = currentConcept?._id
      
      if (!currentConceptId) return null
      
      // Find the current concept index
      const currentIndex = concepts.findIndex((c: any) => c._id === currentConceptId)
      
      if (currentIndex === -1 || currentIndex >= concepts.length - 1) {
        return null // No next concept
      }
      
      return concepts[currentIndex + 1]
    } catch (error) {
      console.error('Error getting next concept:', error)
    return null
    }
  }

  if (isLoading) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Loading Learning Content...</h3>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !courseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Course</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
              <Button onClick={() => loadCourseLearning()}>
                Try Again
          </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { course, userProgress, sequentialConcepts } = courseData
  const currentConcept = sequentialConcepts[currentConceptIndex]

  // Load next concept when current concept changes
  useEffect(() => {
    if (courseData && currentConcept?._id) {
      const loadNextConcept = async () => {
        const next = await getNextConcept()
        setNextConcept(next)
      }
      loadNextConcept()
    }
  }, [courseData, currentConcept?._id])
  
  // Comprehensive console logging for debugging
  console.log('=== CURRENT CONCEPT FULL DATA ===')
  console.log('Title:', currentConcept?.title)
  console.log('Description:', currentConcept?.description)
  console.log('Video URL:', currentConcept?.videoUrl)
  console.log('Has Content:', !!currentConcept?.content)
  console.log('Content Keys:', currentConcept?.content ? Object.keys(currentConcept?.content) : 'No content')
  console.log('Content Intro:', currentConcept?.content?.intro)
  console.log('Content Sections Count:', currentConcept?.content?.sections?.length || 0)
  console.log('Has Quiz:', !!currentConcept?.quiz)
  console.log('Quiz Questions Count:', currentConcept?.quiz?.questions?.length || 0)
  console.log('Status:', currentConcept?.status)
  console.log('Complexity:', currentConcept?.complexity)
  console.log('Estimated Time:', currentConcept?.estLearningTimeHours)
  console.log('Full Content Object:', currentConcept?.content)
  console.log('Full Quiz Object:', currentConcept?.quiz)
  console.log('=== END CONCEPT DATA ===')
  

  
  // Check if we have valid data
  if (!currentConcept || sequentialConcepts.length === 0) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Learning Content Available</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This course doesn't have any concepts configured yet.
              </p>
              <Button onClick={() => router.push(`/courses/${courseId}`)}>
                Back to Course
              </Button>
          </div>
          </div>
        </div>
      </div>
    )
  }
          
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        {/* Header */}
        <div className="mb-8" style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {course.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Learning Progress: {userProgress.conceptsCompleted || 0}/{userProgress.totalConcepts || 0} concepts completed ({userProgress.overallProgress}%)
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  if (!showLearningGraph) {
                    loadLearningGraph()
                  }
                  setShowLearningGraph(!showLearningGraph)
                }}
                className="flex items-center gap-2"
                disabled={loadingGraph}
              >
                <Brain className="w-4 h-4" />
                {loadingGraph ? 'Loading...' : 'Learning Graph'}
              </Button>
            </div>
          </div>
          
          <Progress value={userProgress.overallProgress} className="h-3" />
        </div>

                {/* Learning Graph Modal */}
        {showLearningGraph && (
          <div className="w-full mb-6" style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Learning Progress Graph
                  {allConcepts.length > 0 && (
                    <Badge className="ml-2">
                      {allConcepts.length} concepts
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingGraph ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                    Loading learning graph...
                  </div>
                ) : allConcepts.length > 0 ? (
                  <div className="w-full overflow-hidden" style={{ maxWidth: '800px' }}>
                    <div className="w-full overflow-x-auto py-6 border border-gray-200 dark:border-gray-700 rounded-lg relative">
                      {allConcepts.length > 6 && (
                        <div className="absolute top-2 right-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full z-10">
                          Scroll to see more →
                        </div>
                      )}
                      <div className="flex gap-3 items-center min-h-[100px] px-4" style={{ minWidth: Math.max(200, allConcepts.length * 80) }}>
                    {allConcepts.map((concept: any, idx: number) => {
                      const isLast = idx === allConcepts.length - 1;
                      const isCurrent = concept._id === currentConcept._id;
                      const isCompleted = concept.status === 'completed';
                      
                      // Update status based on current concept
                      let nodeStatus = concept.status;
                      if (isCurrent) {
                        nodeStatus = 'in_progress';
                      }
                      
                      // Color coding: Green=completed, Yellow=current, Blue=remaining
                      let nodeColor = 'bg-gradient-to-br from-blue-500 to-purple-500';
                      let textColor = 'text-blue-700';
                      
                      if (nodeStatus === 'completed') {
                        nodeColor = 'bg-green-500';
                        textColor = 'text-green-600';
                      } else if (isCurrent) {
                        nodeColor = 'bg-yellow-400';
                        textColor = 'text-yellow-600';
                      }
                      
                      return (
                        <div key={concept._id} className="flex items-center flex-shrink-0" style={{ minWidth: 70, maxWidth: 90 }}>
                          <div className="flex flex-col items-center">
                            <div className={`rounded-full flex items-center justify-center w-10 h-10 text-sm font-bold shadow-lg border-2 border-white ${nodeColor} text-white`}>
                              {nodeStatus === 'completed' ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : isCurrent ? (
                                <Target className="w-5 h-5" />
                              ) : (
                                <Circle className="w-5 h-5" />
                          )}
                        </div>
                            <div className={`text-xs font-semibold text-center mt-1 px-1 break-words ${textColor}`} style={{ maxWidth: 80 }}>
                              {concept.title}
                          </div>
                        </div>
                          {!isLast && (
                            <svg width="20" height="12" viewBox="0 0 20 12" fill="none" className="mx-1">
                              <defs>
                                <marker id="arrowhead-h" markerWidth="4" markerHeight="4" refX="4" refY="2" orient="auto" markerUnits="strokeWidth">
                                  <polygon points="0 0, 4 2, 0 4" fill="#7c3aed" />
                                </marker>
                              </defs>
                              <line x1="1" y1="6" x2="19" y2="6" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrowhead-h)" />
                            </svg>
                          )}
                      </div>
                      );
                    })}
                    </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No concepts found for this course.
              </p>
                          )}
              </CardContent>
            </Card>
          </div>
      )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Concept - Full Content */}
          <div className="lg:col-span-2">
            <Card className="dark:bg-gray-800/80 dark:border-gray-700 border-2 border-yellow-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Target className="w-6 h-6 text-yellow-600" />
                      {currentConcept.title}
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      {currentConcept.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Current
                    </Badge>
                    <Badge className={getComplexityColor(currentConcept.complexity)}>
                      {getComplexityText(currentConcept.complexity)}
                  </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Step 1: Description - Always Visible */}
                <div className="mb-6">
                  <div className="mb-4 p-4 rounded-xl border-2 border-blue-400 bg-white/80 dark:bg-gray-900/60 shadow flex flex-col gap-2 relative">
                    <h3 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
                      {currentConcept.title}
                    </h3>
                    {/* Description/theory */}
                    {(currentConcept.description || currentConcept.content?.intro) && (
                      <div className="mb-4">
                        <h4 className="font-bold mb-2 text-blue-700 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Description
                  </h4>
                        <p className="text-base text-muted-foreground">
                          {currentConcept.description || currentConcept.content?.intro}
                        </p>
                      </div>
                    )}
                        </div>
                          </div>
                      
                {/* Vertical Layout with Collapsible Sections */}
                <div className="space-y-6 mb-6">
                  {/* Content Section */}
                  <ContentSection
                    content={currentConcept.content}
                    contentRead={conceptProgress.contentRead}
                    onMarkRead={handleMarkContentRead}
                    markingContent={markingContent}
                    contentExpanded={contentExpanded}
                    setContentExpanded={setContentExpanded}
                  />
                  {/* Video Section */}
                  <VideoSection
                    videoUrl={currentConcept.videoUrl || currentConcept.content?.videoUrl || ''}
                    videoWatched={conceptProgress.videoWatched}
                    onMarkWatched={handleMarkVideoWatched}
                    markingVideo={markingVideo}
                    showVideoPlayer={showVideoPlayer}
                    setShowVideoPlayer={setShowVideoPlayer}
                    videoLoading={videoLoading}
                    setVideoLoading={setVideoLoading}
                    videoWatchTime={videoWatchTime}
                    setVideoWatchTime={setVideoWatchTime}
                    handleVideoWatch={handleVideoWatch}
                    videoExpanded={videoExpanded}
                    setVideoExpanded={setVideoExpanded}
                  />
                  {/* Quiz Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <TestTube className="w-5 h-5" />
                        Practice Quiz ({currentConcept?.quiz?.questions?.length || 0} questions)
                      </h4>
                      <Button
                        onClick={handleQuizStart}
                        disabled={quizLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {quizLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <TestTube className="w-4 h-4 mr-2" />
                        )}
                        {quizLoading ? 'Taking Quiz...' : 'Start Quiz'}
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <p className="text-blue-800 dark:text-blue-200 text-sm">
                        Complete the quiz to unlock the next concept. You need to score at least 75% to pass.
                      </p>
                    </div>
                  </div>
                  
                                    {/* Quiz Results Display - REMOVED FROM HERE */}
                      </div>
                      
                {/* Step 5: Next Button - Only show after quiz completion */}
                {conceptProgress.quizPassed && nextConcept && (
                  <div className="mb-6 flex flex-col md:flex-row gap-4">
                        <Button
                      onClick={() => setShowQuizModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                      size="lg"
                    >
                      Retest
                        </Button>
                        <Button
                      onClick={() => {
                        router.push(`/courses/${courseId}/learn?concept=${nextConcept._id}`)
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      size="lg"
                    >
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Continue to Next Concept: {nextConcept.title}
                        </Button>
                      </div>
                )}


              </CardContent>
            </Card>
                    </div>
                    
          {/* Progress Tab */}
          <div className="lg:col-span-1">
            <Card className="dark:bg-gray-800/80 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Concept Progress */}
                  <div className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Current Concept Progress
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Read Content</span>
                        {conceptProgress.contentRead ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400" />
                        )}
                        </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Watch Video</span>
                        {conceptProgress.videoWatched ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Complete Quiz</span>
                        {conceptProgress.quizPassed ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Course Overall Progress */}
                  <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Course Progress
                    </h4>
                    <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700 dark:text-green-300">Overall Progress</span>
                        <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                          {userProgress.conceptsCompleted || 0}/{userProgress.totalConcepts || 0} ({userProgress.overallProgress}%)
                        </span>
                      </div>
                      <Progress value={userProgress.overallProgress} className="h-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400">
                          Time Spent: {Math.round(userProgress.timeSpent / 60)}m
                        </span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {userProgress.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Next Concept Preview */}
                  {nextConcept && (
                    <div className="p-4 border border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700 rounded-lg">
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        Next Concept
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {nextConcept.isUnlocked ? (
                            <Unlock className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                            {nextConcept.title}
                          </span>
                        </div>
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          {nextConcept.description}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-purple-600 dark:text-purple-400">
                            {nextConcept.estLearningTimeHours}h
                          </span>
                          <Badge className={getComplexityColor(nextConcept.complexity)}>
                            {getComplexityText(nextConcept.complexity)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
                          </div>
                        </div>
                      </div>
                      
      {/* Quiz Modal */}
      {showQuizModal && currentConcept?.quiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <QuizPlatform
              quiz={{
                id: currentConcept._id,
                title: `${currentConcept.title} Quiz`,
                timeLimit: 600, // 10 minutes
                questions: currentConcept.quiz.questions.map((q, index) => ({
                  id: q.questionId || index,
                  question: q.text,
                  options: q.options,
                  correct: q.answer,
                  explanation: q.explanation
                })),
                completed: false,
                totalQuestions: currentConcept.quiz.questions.length,
                testType: 'concept_quiz',
                conceptId: currentConcept._id,
                courseId: courseId || '',
                passingScore: 75
              }}
              onQuizComplete={handleQuizComplete}
              onQuizClose={handleQuizClose}
              showModal={true}
              allowRetake={false}
              showReview={showReview}
            />
          </div>
        </div>
      )}

      {/* Quiz Results Modal */}
      {showQuizResults && quizResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <Card className={`dark:bg-gray-800/80 dark:border-gray-700 ${quizResults.passed ? 'border-green-500' : 'border-red-500'}`}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-900 dark:text-white mb-4">Quiz Results</CardTitle>

                <div className="space-y-4">
                  <div className={`text-6xl font-bold ${quizResults.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {quizResults.score}/{currentConcept?.quiz?.questions?.length || 0}
                  </div>

                  <div className="text-xl text-gray-600 dark:text-gray-300">You scored {Math.round((quizResults.score / (currentConcept?.quiz?.questions?.length || 1)) * 100)}%</div>

                  <div className="flex items-center justify-center space-x-6">
                    <Badge className={`${quizResults.passed ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
                      {quizResults.passed ? "Passed!" : "Failed"}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Passing Score: 75%
                    </Badge>
                  </div>
                  
                  {!quizResults.passed && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <p className="text-red-800 dark:text-red-200 text-center font-medium">
                        Don't worry! Every failure is a step towards success. Keep learning and try again! 💪
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>

              {quizResults.passed && (
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Question Review:</h3>

                    {currentConcept?.quiz?.questions?.map((question: any, index: number) => {
                      const userAnswer = quizResults.userAnswers?.[index];
                      const isCorrect = userAnswer === question.answer;

                      return (
                        <div
                          key={question.questionId || index}
                          className={`p-4 rounded-lg border ${
                            isCorrect
                              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                              : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                            ) : (
                              <X className="w-5 h-5 text-red-600 mt-1" />
                            )}

                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                {index + 1}. {question.text}
                              </h4>

                              <div className="space-y-1 text-sm">
                                {question.options.map((option: string, optionIndex: number) => (
                                  <div
                                    key={optionIndex}
                                    className={`p-2 rounded ${
                                      optionIndex === question.answer
                                        ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
                                        : optionIndex === userAnswer && userAnswer !== question.answer
                                          ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200"
                                          : "text-gray-600 dark:text-gray-300"
                                    }`}
                                  >
                                    {optionIndex === question.answer && "✓ "}
                                    {optionIndex === userAnswer && userAnswer !== question.answer && "✗ "}
                                    {option}
                                  </div>
                                ))}
                              </div>
                                
                              {question.explanation && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Explanation:</strong> {question.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              )}

              <CardContent>
                <div className="flex justify-center mt-6">
                  {quizResults.passed ? (
                    <Button 
                      onClick={async () => {
                        const next = await getNextConcept();
                        if (next) {
                          setShowQuizResults(false);
                          setQuizResults(null);
                          router.push(`/courses/${courseId}/learn?concept=${next._id}`);
                        } else {
                          router.push(`/courses/${courseId}`);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Go to Next Course
                    </Button>
                  ) : (
                          <Button
            onClick={() => {
                        setShowQuizResults(false);
                        setQuizResults(null);
                        // Reset progress and stay on current concept
                        setConceptProgress(prev => ({
                          ...prev,
                          descriptionRead: false,
                          videoWatched: false,
                          contentRead: false,
                          quizPassed: false,
                          isCompleted: false
                        }));
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Return Back to Course
                          </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}


    </div>
  )
} 

// Define types for the memoized components
interface ContentSectionProps {
  content: any;
  contentRead: boolean;
  onMarkRead: () => Promise<void>;
  markingContent: boolean;
  contentExpanded: boolean;
  setContentExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

interface VideoSectionProps {
  videoUrl: string;
  videoWatched: boolean;
  onMarkWatched: () => Promise<void>;
  markingVideo: boolean;
  showVideoPlayer: boolean;
  setShowVideoPlayer: React.Dispatch<React.SetStateAction<boolean>>;
  videoLoading: boolean;
  setVideoLoading: React.Dispatch<React.SetStateAction<boolean>>;
  videoWatchTime: number;
  setVideoWatchTime: React.Dispatch<React.SetStateAction<number>>;
  handleVideoWatch: () => void;
  videoExpanded: boolean;
  setVideoExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

// Update ContentSection to use props and contentExpanded/setContentExpanded
const ContentSection = memo(function ContentSection(props: ContentSectionProps) {
  const { content, contentRead, onMarkRead, markingContent, contentExpanded, setContentExpanded } = props;
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <div
        className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setContentExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-gray-900 dark:text-white">
          Read Content
        </h4>
          {contentRead && (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
      </div>
        <div className="flex items-center gap-2">
        {!contentRead && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onMarkRead()
              }}
              size="sm"
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              disabled={markingContent}
            >
              {markingContent ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <BookOpen className="w-4 h-4 mr-2" />
              )}
            {markingContent ? 'Marking...' : 'Mark as Read'}
                        </Button>
        )}
        {contentRead && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onMarkRead()
              }}
              disabled={true}
              className="bg-green-500 cursor-not-allowed text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
            Marked as Read
          </Button>
          )}
          {contentExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
                      </div>
      </div>
      
      {contentExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {content ? (
            <div className="space-y-6">
              {content.intro && (
                <div className="p-4 rounded-xl border-2 border-blue-400 bg-white/80 dark:bg-gray-900/60 shadow">
                  <h5 className="font-bold text-lg mb-2 text-blue-700 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Introduction
                  </h5>
                  <p className="text-base text-muted-foreground">{content.intro}</p>
                    </div>
              )}
              {content.sections && content.sections.length > 0 && (
                <div className="space-y-6">
                  {content.sections.map((section: any, index: number) => (
                    <div key={index} className="p-4 rounded-xl border border-purple-200 bg-purple-50 dark:bg-gray-900/30">
                      <h6 className="font-bold text-lg mb-2 text-purple-700 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {section.heading}
                      </h6>
                      <p className="mb-2 text-base text-muted-foreground">{section.content}</p>
                      {section.codeExamples && section.codeExamples.length > 0 && (
                        <div className="bg-gray-900 text-white rounded-lg p-3 overflow-x-auto text-sm">
                          {section.codeExamples.map((code: string, cidx: number) => (
                            <pre key={cidx} className="mb-2 whitespace-pre-wrap"><code>{code}</code></pre>
                          ))}
                        </div>
                      )}
                        </div>
                  ))}
                          </div>
              )}
                        </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No content available for this concept.</p>
            </div>
          )}
                      </div>
      )}
    </div>
  )
})

const VideoSection = memo(function VideoSection(props: VideoSectionProps) {
  const { videoUrl, videoWatched, onMarkWatched, markingVideo, showVideoPlayer, setShowVideoPlayer, videoLoading, setVideoLoading, videoWatchTime, setVideoWatchTime, handleVideoWatch, videoExpanded, setVideoExpanded } = props;
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setVideoExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Watch Video
            </h4>
            {videoWatched && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {!videoWatched && (
                      <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkWatched()
                }}
                        size="sm"
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              disabled={markingVideo}
            >
                {markingVideo ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Video className="w-4 h-4 mr-2" />
                )}
                Mark as Watched
                      </Button>
          )}
            {videoWatched && (
            <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkWatched()
                  }}
                  disabled={true}
                className="bg-green-500 cursor-not-allowed text-white"
                >
                <CheckCircle className="w-4 h-4 mr-2" />
                  Already Watched
            </Button>
            )}
            {videoExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
                  </div>
                </div>

        {/* Collapsible Video */}
        {videoExpanded && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              {showVideoPlayer ? (
                <VideoPlayer
                  videoUrl={videoUrl || ''}
                  title={''}
                  onTimeUpdate={setVideoWatchTime}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Button onClick={handleVideoWatch} disabled={videoLoading}>
                    {videoLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {videoLoading ? 'Loading...' : 'Watch Video'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
})

 