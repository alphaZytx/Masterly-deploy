export interface DashboardData {
  user: {
    id: string
    name: string
    email: string
    avatar?: string
    level: string
    plan: string
    joinDate: string
    lastActive: string
  }
  stats: {
    totalConcepts: number
    completedConcepts: number
    inProgressConcepts: number
    totalTimeSpent: number // in hours
    totalQuizAttempts: number
    averageMasteryScore: number
    currentStreak: number
    completionRate: number
    coursesEnrolled: number
    coursesCompleted: number
    courseProgress: {
      [courseId: string]: {
        courseTitle: string
        totalConcepts: number
        completedConcepts: number
        totalTimeSpent: number
        averageMastery: number
        progressPercentage: number
      }
    }
  }
  learningPaths: Array<{
    id: string
    courseTitle: string
    courseThumbnail?: string
    progress: number
    currentNode: string
    status: 'active' | 'paused' | 'completed' | 'abandoned'
    lastAccessed: string
    totalTimeSpent: number
    streakDays: number
  }>
  recentActivity: Array<{
    id: string
    conceptTitle: string
    courseTitle: string
    action: 'completed' | 'studied'
    timestamp: string
    masteryScore: number
    timeSpent: number
  }>
  recommendedCourses: Array<{
    id: string
    title: string
    description: string
    thumbnail?: string
    category: string
    level: string
    totalStudents: number
    averageRating: number
  }>
  achievements: Array<{
    id: string
    title: string
    description: string
    icon: string
    unlockedAt: string
    type: 'course' | 'streak' | 'mastery'
  }>
  upcomingDeadlines: Array<{
    id: string
    title: string
    description: string
    type: 'reminder' | 'deadline'
    dueDate: string
    priority: 'low' | 'medium' | 'high'
  }>
}

export interface LearningSummary {
  totalStudyTime: number
  conceptsMastered: number
  averageMasteryScore: number
  coursesStudied: number
  recentActivity: Array<{
    concept: string
    course: string
    action: string
    date: string
  }>
}