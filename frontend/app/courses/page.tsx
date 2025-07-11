"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Clock, 
  Users, 
  Star, 
  Search, 
  Filter, 
  BookOpen, 
  Play, 
  CheckCircle, 
  TrendingUp,
  Award,
  Zap,
  Target,
  Brain,
  Code,
  Video,
  FileText,
  Heart,
  Share2,
  Eye,
  Calendar,
  Clock3,
  GraduationCap,
  Rocket,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/auth"
import type { Course } from "@/lib/types/courses"

interface CourseWithProgress extends Course {
  userProgress?: {
    progress: number
    status: string
    lastAccessedAt?: string
  }
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [filteredCourses, setFilteredCourses] = useState<CourseWithProgress[]>([])
  const [featuredCourses, setFeaturedCourses] = useState<CourseWithProgress[]>([])
  const [recommendedCourses, setRecommendedCourses] = useState<CourseWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedSort, setSelectedSort] = useState("popular")
  const [enrollingCourse, setEnrollingCourse] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    filterAndSortCourses()
  }, [courses, searchTerm, selectedCategory, selectedLevel, selectedSort, activeTab])

  const fetchCourses = async () => {
    try {
      const backendCourses = await apiClient.getCourses()

      // Only mark as enrolled if userEnrollment.enrolled is explicitly true
      const formattedCourses = backendCourses.map((course) => ({
        ...course,
        isEnrolled: course.userEnrollment?.enrolled === true,
      }))

      setCourses(formattedCourses)
      
      // Set featured courses (top rated and popular)
      const featured = formattedCourses
        .filter(course => course.stats?.averageRating >= 4.5 || course.stats?.enrollments >= 100)
        .sort((a, b) => (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0))
        .slice(0, 3)
      setFeaturedCourses(featured)

      // Set recommended courses (based on user preferences if authenticated)
      if (isAuthenticated && user) {
        const recommended = formattedCourses
          .filter(course => !course.isEnrolled) // Only show non-enrolled courses
          .sort((a, b) => (b.stats?.enrollments || 0) - (a.stats?.enrollments || 0))
          .slice(0, 6)
        setRecommendedCourses(recommended)
      } else {
        setRecommendedCourses(formattedCourses.slice(0, 6))
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortCourses = () => {
    let filtered = courses

    // Filter by tab
    if (activeTab === "enrolled") {
      filtered = filtered.filter(course => course.isEnrolled)
    } else if (activeTab === "featured") {
      filtered = featuredCourses
    } else if (activeTab === "recommended") {
      filtered = recommendedCourses
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((course) => course.category === selectedCategory)
    }

    // Filter by level
    if (selectedLevel !== "all") {
      filtered = filtered.filter((course) => course.level === selectedLevel)
    }

    // Sort courses
    switch (selectedSort) {
      case "popular":
        filtered.sort((a, b) => (b.stats?.enrollments || 0) - (a.stats?.enrollments || 0))
        break
      case "rating":
        filtered.sort((a, b) => (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0))
        break
      case "newest":
        filtered.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
        break
      case "price":
        filtered.sort((a, b) => (a.pricing?.amount || 0) - (b.pricing?.amount || 0))
        break
    }

    setFilteredCourses(filtered)
  }

  const handleEnroll = async (courseId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to enroll in courses.",
        variant: "destructive",
      })
      // Redirect to login with current page as redirect
      if (typeof window !== 'undefined') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      }
      return
    }

    try {
      setEnrollingCourse(courseId)
      await apiClient.enrollInCourse(courseId)

      // Update the course in the local state
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course._id === courseId
            ? {
              ...course,
              isEnrolled: true,
              userProgress: { progress: 0, status: "enrolled" },
              stats: {
                ...course.stats,
                enrollments: (course.stats?.enrollments || 0) + 1
              }
            }
            : course
        )
      )

      toast({
        title: "Success!",
        description: "You have successfully enrolled in the course.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll in course. Please try again.",
        variant: "destructive",
      })
    } finally {
      setEnrollingCourse(null)
    }
  }

  const categories = [...new Set(courses.map((course) => course.category))]
  const levels = [...new Set(courses.map((course) => course.level))]

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner": return Target
      case "intermediate": return Brain
      case "advanced": return Rocket
      default: return BookOpen
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "data structures": return Code
      case "algorithms": return Brain
      case "python": return Code
      case "web development": return Video
      case "machine learning": return Sparkles
      default: return BookOpen
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-2">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Courses</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Master new skills with our comprehensive courses designed by industry experts
        </p>
      </div>

      {/* Featured Courses Section */}
      {featuredCourses.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center space-x-2 mb-6">
            <Award className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Courses</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <FeaturedCourseCard 
                key={course._id} 
                course={course} 
                onEnroll={handleEnroll}
                enrollingCourse={enrollingCourse}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Courses</TabsTrigger>
          <TabsTrigger value="enrolled">My Courses</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search courses, instructors, or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {levels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSort} onValueChange={setSelectedSort}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price">Price: Low to High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <CourseCard 
            key={course._id} 
            course={course} 
            onEnroll={handleEnroll}
            enrollingCourse={enrollingCourse}
            getLevelIcon={getLevelIcon}
            getCategoryIcon={getCategoryIcon}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No courses found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Try adjusting your search criteria or browse all available courses.
          </p>
          <Button onClick={() => {
            setSearchTerm("")
            setSelectedCategory("all")
            setSelectedLevel("all")
            setActiveTab("all")
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}

// Featured Course Card Component
function FeaturedCourseCard({ 
  course, 
  onEnroll, 
  enrollingCourse 
}: { 
  course: CourseWithProgress
  onEnroll: (courseId: string) => void
  enrollingCourse: string | null
}) {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 dark:bg-gray-800/80 dark:border-gray-700 border-2 border-yellow-200 dark:border-yellow-800">
      <div className="relative">
        <img
          src={course.thumbnail || "/placeholder.svg"}
          alt={course.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-2 left-2">
          <Badge className="bg-yellow-500 text-white">
            <Award className="w-3 h-3 mr-1" />
            Featured
          </Badge>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg" />
      </div>

      <CardContent className="p-6">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              {course.category}
            </Badge>
            <div className="flex items-center space-x-1 text-sm text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span>{course.stats?.averageRating?.toFixed(1) || "N/A"}</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {course.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
            {course.description}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center space-x-1">
              <BookOpen className="w-4 h-4" />
              <span>{course.instructor.name}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{course.stats?.totalDuration || "N/A"}</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{(course.stats?.totalStudents || 0).toLocaleString()} students</span>
            </span>
            <Badge variant="outline">{course.level}</Badge>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ${course.pricing?.discountPrice ?? course.pricing.amount}
              </span>
              {course.pricing?.originalPrice > (course.pricing?.discountPrice ?? course.pricing.amount) && (
                <span className="text-sm text-gray-500 line-through">
                  ${course.pricing.originalPrice}
                </span>
              )}
            </div>

            {course.isEnrolled ? (
              <Link href={`/courses/${course.slug}`}>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Continue
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => onEnroll(course._id)}
                disabled={enrollingCourse === course._id}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {enrollingCourse === course._id ? "Enrolling..." : "Enroll Now"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Regular Course Card Component
function CourseCard({ 
  course, 
  onEnroll, 
  enrollingCourse,
  getLevelIcon,
  getCategoryIcon
}: { 
  course: CourseWithProgress
  onEnroll: (courseId: string) => void
  enrollingCourse: string | null
  getLevelIcon: (level: string) => any
  getCategoryIcon: (category: string) => any
}) {
  const LevelIcon = getLevelIcon(course.level)
  const CategoryIcon = getCategoryIcon(course.category)

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 dark:bg-gray-800/80 dark:border-gray-700">
      <div className="relative">
        <img
          src={course.thumbnail || "/placeholder.svg"}
          alt={course.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {course.isEnrolled && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-green-500 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Enrolled
            </Badge>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-t-lg" />
      </div>

      <CardContent className="p-6">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1">
              <CategoryIcon className="w-4 h-4 text-blue-500" />
              <Badge variant="secondary" className="text-xs">
                {course.category}
              </Badge>
            </div>
            <div className="flex items-center space-x-1 text-sm text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span>{course.stats?.averageRating?.toFixed(1) || "N/A"}</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {course.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
            {course.description}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center space-x-1">
              <BookOpen className="w-4 h-4" />
              <span>{course.instructor.name}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{course.stats?.totalDuration || "N/A"}</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{(course.stats?.totalStudents || 0).toLocaleString()} students</span>
            </span>
            <div className="flex items-center space-x-1">
              <LevelIcon className="w-4 h-4 text-blue-500" />
              <Badge variant="outline">{course.level}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {course.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ${course.pricing?.discountPrice ?? course.pricing.amount}
              </span>
              {course.pricing?.originalPrice > (course.pricing?.discountPrice ?? course.pricing.amount) && (
                <span className="text-sm text-gray-500 line-through">
                  ${course.pricing.originalPrice}
                </span>
              )}
            </div>

            {course.isEnrolled ? (
              <Link href={`/courses/${course.slug}`}>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Continue
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => onEnroll(course._id)}
                disabled={enrollingCourse === course._id}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {enrollingCourse === course._id ? "Enrolling..." : "Enroll Now"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
