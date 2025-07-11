export interface Instructor {
    name: string
    bio?: string
    avatar?: string
    credentials?: string[]
  }
  
  export interface Pricing {
    type: "free" | "premium" | "one-time"
    amount: number
    currency: string
    originalPrice: number
    discountPrice?: number
    discountPercentage?: number
  }
  
  export interface Stats {
    enrollments: number
    completions: number
    views: number
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
  
  export interface Course {
    _id: string
    title: string
    slug: string
    description: string
    shortDescription?: string
    thumbnail: string
    category: string
    subcategory?: string
    level: string
    tags: string[]
    isActive: boolean
    comingSoon: boolean
    instructor: Instructor
    pricing: Pricing
    stats: Stats
    topics: Topic[] // ✅ ADD THIS
    userEnrollment?: {
      enrolled: boolean
      progress: number
      status: string
      lastAccessedAt?: string
    }
    isEnrolled?: boolean
  }
  
  export interface CourseResponse {
    success: boolean
    data: {
      courses: Course[]
      pagination: {
        current: number
        pages: number
        total: number
      }
    }
  }

  export interface TopicProgress {
    topicId: number
    completed: boolean
    timeSpent?: number
    completedAt?: string
    lastAccessedAt?: string
    attempts?: number
    score?: number
    maxScore?: number
    activityData?: {
      watchTime?: number
      watchPercentage?: number
    }
  }
  
  export interface ConceptProgress {
    conceptId: number
    completed: boolean
    topicsProgress: TopicProgress[]
  }
  
  export interface UserProgress {
    _id?: string
    userId: string
    courseId: string
    overallProgress: number
    status: string
    lastAccessedAt?: string
    conceptsProgress: ConceptProgress[]
  }
  
  export interface Topic {
    id: number
    title: string
    type: string
    duration: string
    videoUrl?: string
    thumbnail?: string
  }

  export interface Video {
    title: string
    description: string
    duration: string
    videoUrl: string
    thumbnail: string
    order: number
    isPreview?: boolean
    _id?: string
  }
  
  export interface Article {
    title: string
    content: string
    readTime?: string
    author?: string
    _id?: string
  }
  
  export interface CodingProblem {
    title: string
    description: string
    difficulty: string
    category: string
    hints: string[]
    starterCode: {
      python: string
      java: string
    }
    solution: {
      python: string
    }
    testCases: {
      input: string
      expectedOutput: string
      explanation: string
      isHidden?: boolean
      _id?: string
    }[]
    constraints: string[]
    timeLimit: number
    memoryLimit: string
    order: number
    _id?: string
  }
  
  export interface Quiz {
    title: string
    description: string
    timeLimit: number
    passingScore: number
    questions: {
      type: "mcq"
      question: string
      options: string[]
      correctAnswers: number[]
      explanation: string
      points: number
      difficulty: string
      _id?: string
    }[]
    order: number
    _id?: string
  }
  
  export interface Concept {
    title: string
    description: string
    order: number
    estimatedTime: string
    difficulty: string
    videos: Video[]
    articles: Article[]
    codingProblems: CodingProblem[]
    quiz?: Quiz
    prerequisites?: string[]
    _id?: string
  }
  
  export interface Topic {
    title: string
    description: string
    order: number
    icon?: string
    estimatedHours: number
    concepts: Concept[]
    _id?: string
  }
  
  