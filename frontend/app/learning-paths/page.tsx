"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import Quiz from "@/components/Quiz"
import { apiClient } from "@/lib/api"
import { Search } from "lucide-react"
import { QuizPlatform } from "@/components/quiz-platform"

export default function LearningPathPage() {
  const router = useRouter()
  // UI state
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string>("")
  const [concepts, setConcepts] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedConcept, setSelectedConcept] = useState<any>(null)
  const [conceptDetails, setConceptDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  // Add state to force remount QuizPlatform for retake
  const [quizKey, setQuizKey] = useState(0);

  // Fetch all courses on mount
  useEffect(() => {
    setLoading(true)
    apiClient.getCourses()
      .then((data) => {
        setCourses(data.map((c: any) => ({ _id: c._id, title: c.title, slug: c.slug })))
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load courses.")
        setLoading(false)
      })
  }, [])

  // When a course is selected, fetch all concepts and filter to those in the course
  const handleCourseChange = async (courseId: string) => {
    setSelectedCourse(courseId)
    setShowSearch(false)
    setSelectedConcept(null)
    setConceptDetails(null)
    setSearch("")
    setSearchResults([])
    setError("")
    setLoading(true)
    try {
      const course = courses.find((c) => c._id === courseId)
      setSelectedCourseSlug(course.slug)
      // Fetch course details to get concept IDs
      const courseRes = await apiClient.getCourseBySlug(course.slug)
      let courseData: any = null;
      if (courseRes && typeof courseRes === 'object') {
        if ('data' in courseRes && courseRes.data && typeof courseRes.data === 'object' && 'course' in courseRes.data) {
          courseData = (courseRes as any).data.course;
        } else if ('course' in courseRes) {
          courseData = (courseRes as any).course;
        }
      }
      const courseConceptIds = (courseData?.concepts || []).map((c: any) => String(c.conceptId));
      // Fetch all concepts
      const allConcepts = await apiClient.getConcepts();
      // Filter only concepts that are in this course (by _id)
      const filteredConcepts = allConcepts.filter((concept: any) => {
        const conceptIdStr = typeof concept._id === 'string' ? concept._id : concept._id?.$oid || '';
        return courseConceptIds.includes(conceptIdStr);
      });
      console.log('Filtered concepts:', filteredConcepts);
      setConcepts(filteredConcepts);
    } catch {
      setError("Failed to load concepts.");
    }
    setLoading(false);
  }

  // When user clicks 'Search Custom Path', show search bar and all concepts
  const handleShowSearch = () => {
    setShowSearch(true)
    setSearch("")
    setSearchResults([...concepts])
    setSelectedConcept(null)
    setConceptDetails(null)
  }

  // Filter search results as user types
  useEffect(() => {
    if (showSearch) {
      if (search.trim().length > 0) {
        setSearchResults(concepts.filter((c: any) =>
          c.title.toLowerCase().includes(search.trim().toLowerCase())
        ))
      } else {
        setSearchResults([...concepts])
      }
    }
  }, [search, concepts, showSearch])

  // When a concept is clicked, fetch its details
  const handleConceptClick = async (concept: any) => {
    setSelectedConcept(concept)
    setConceptDetails(null)
    setLoading(true)
    try {
      const res = await apiClient.getConceptById(concept._id)
      setConceptDetails(res)
    } catch {
      setError("Failed to load concept details.")
    }
    setLoading(false)
  }

  // Handle Start Complete Learning
  const handleStartCompleteCourse = async () => {
    if (!selectedCourse || !selectedCourseSlug) return
    setLoading(true)
    try {
      await apiClient.enrollInCourse(selectedCourse)
      setLoading(false)
      router.push(`/courses/${selectedCourseSlug}`)
    } catch (e: any) {
      setLoading(false)
      if (
        typeof e?.message === 'string' &&
        e.message.toLowerCase().includes('already enrolled')
      ) {
        router.push(`/courses/${selectedCourseSlug}`)
      } else {
        setError(e?.message || 'Failed to enroll in course.')
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 flex flex-col md:flex-row gap-8">
      {/* Left info/marketing panel */}
      <div className="hidden md:flex flex-col justify-center items-start w-1/2 min-w-[320px] max-w-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-pink-900/40 rounded-2xl shadow-lg p-10 border border-blue-100 dark:border-blue-900/30 sticky top-8 h-fit self-start">
        <h1 className="text-4xl font-extrabold mb-4 leading-tight">
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">AI-Powered Learning Paths</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          <span className="text-blue-700 font-semibold">Personalize</span> your journey, <span className="text-purple-700 font-semibold">unlock</span> any topic, and <span className="text-pink-600 font-semibold">master</span> skills at your own pace.<br/>
          Choose a course, start from the beginning or any node, and let our platform guide you through all prerequisites with interactive quizzes.
        </p>
        <div className="flex flex-col gap-2 mt-4">
          <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">Dynamic</span>
          <span className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">Adaptive</span>
          <span className="inline-block bg-gradient-to-r from-green-400 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">Skill-Based</span>
        </div>
      </div>
      {/* Right interactive panel */}
      <div className="w-full md:w-1/2 min-w-[320px] max-w-2xl flex flex-col justify-center min-h-[600px]">
        <div className="rounded-2xl border-4 border-transparent bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 shadow-2xl p-0 relative overflow-hidden min-h-[600px] flex flex-col justify-center">
          <div className="relative z-10 p-8 flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">Create Your Learning Path</h2>
            {error && <div className="mb-4 text-destructive font-semibold">{error}</div>}
            {/* Course selection dropdown */}
            <div className="mb-4">
              <label className="block mb-1 font-bold text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">Select Course</label>
              <Select value={selectedCourse || ""} onValueChange={handleCourseChange} disabled={loading}>
                <SelectTrigger className="w-full text-base font-semibold border-2 border-blue-300 focus:border-blue-500 shadow-md focus:shadow-lg transition-all">
                  <SelectValue placeholder={loading ? "Loading courses..." : "Choose a course"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* After course selection */}
            {selectedCourse && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">{courses.find(c => c._id === selectedCourse)?.title}</h2>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold shadow-lg text-lg py-3" onClick={handleStartCompleteCourse} disabled={loading}>
                    {loading ? "Processing..." : "Start Complete Learning"}
                  </Button>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg text-lg py-3" onClick={handleShowSearch}>
                    Search Custom Path
                  </Button>
                </div>
                {concepts.length === 0 && <div className="mb-4 text-lg text-red-500 font-semibold">No concepts found for this course.</div>}
              </>
            )}
            {/* Search bar and results */}
            {showSearch && selectedCourse && concepts.length > 0 && !conceptDetails && (
              <div className="mb-8">
                <label className="block mb-2 font-extrabold text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">Search for a Concept</label>
                <div className="relative rounded-2xl overflow-hidden mb-4">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-7 h-7 z-10" />
                  <Input
                    type="text"
                    placeholder="Type concept title..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full text-lg pl-14 py-4 border-4 border-blue-400 focus:border-blue-600 shadow-xl focus:shadow-2xl transition-all bg-white dark:bg-gray-900 text-primary font-bold relative z-10 placeholder:text-blue-400 rounded-2xl"
                    autoFocus
                  />
                </div>
                <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                  {searchResults.length === 0 ? (
                    <div className="text-muted-foreground text-lg font-semibold">No topics found.</div>
                  ) : (
                    searchResults.map((concept: any) => (
                      <Card
                        key={concept._id}
                        className={`transition-all border-2 ${selectedConcept?._id === concept._id ? 'border-gradient-to-r from-blue-500 to-purple-500 bg-primary/10' : 'border-transparent bg-card hover:border-blue-400'} cursor-pointer group`}
                        onClick={() => handleConceptClick(concept)}
                      >
                        <CardContent className="py-4 px-6 flex flex-col gap-1">
                          <span className="font-semibold text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent group-hover:text-blue-700 transition-colors">
                            {concept.title}
                          </span>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
            {/* Concept details view */}
            {conceptDetails && (
              <div className="mb-10 mt-6 border-t-4 border-blue-300 pt-8 w-full">
                <Button
                  className="mb-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg text-base px-6 py-2"
                  onClick={() => { setConceptDetails(null); setSelectedConcept(null); }}
                >
                  ← Back to Search
                </Button>
                <div className="mb-6">
                  <div className="mb-4 p-4 rounded-xl border-2 border-blue-400 bg-white/80 dark:bg-gray-900/60 shadow flex flex-col gap-2 relative">
                    <h3 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
                      {conceptDetails.title}
                    </h3>
                    {/* Description/theory */}
                    {(conceptDetails.description || conceptDetails.content?.intro) && (
                      <div className="mb-4">
                        <h4 className="font-bold mb-1 text-blue-700">Description</h4>
                        <p className="text-base text-muted-foreground">{conceptDetails.description || conceptDetails.content?.intro}</p>
                      </div>
                    )}
                    {/* Video */}
                    {conceptDetails.videoUrl && (
                      <div className="mb-4">
                        <h4 className="font-bold mb-1 text-blue-700">Video</h4>
                        <video controls className="w-full rounded-xl border border-blue-200">
                          <source src={conceptDetails.videoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                    {/* Content Sections */}
                    {conceptDetails.content?.sections && conceptDetails.content.sections.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-bold mb-2 text-purple-700">Content</h4>
                        <div className="space-y-6">
                          {conceptDetails.content.sections.map((section: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-xl border border-purple-200 bg-purple-50 dark:bg-gray-900/30">
                              <h5 className="font-bold text-lg mb-1 text-purple-700">{section.heading}</h5>
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
                      </div>
                    )}
                    {/* Quiz */}
                    {conceptDetails.quiz && conceptDetails.quiz.questions && conceptDetails.quiz.questions.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-bold mb-2 text-green-700">Quiz</h4>
                        <QuizPlatform
                          key={quizKey}
                          quiz={{
                            id: conceptDetails.quiz._id || conceptDetails._id,
                            title: `Quiz: ${conceptDetails.title}`,
                            timeLimit: 600,
                            questions: conceptDetails.quiz.questions,
                            completed: false,
                            totalQuestions: conceptDetails.quiz.questions.length,
                            testType: 'concept_quiz',
                            conceptId: conceptDetails._id,
                            passingScore: 75,
                          }}
                          allowRetake={true}
                          showReview={true}
                          onQuizComplete={() => {}}
                          onQuizClose={() => setQuizKey(prev => prev + 1)}
                        />
                        <Button className="mt-4" onClick={() => setQuizKey(prev => prev + 1)}>
                          Retake Quiz
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}