"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import Quiz, { QuizQuestion } from "@/components/Quiz"
import { apiClient } from "@/lib/api"
import { RadioGroup } from "@/components/ui/radio-group"
import { RadioGroupItem } from "@/components/ui/radio-group"

interface CourseOption {
  _id: string
  title: string
  slug: string
}

interface ConceptOption {
  _id: string
  title: string
  prerequisites?: string[]
  quiz?: any
}

export default function CustomLearningPath() {
  const router = useRouter()
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [concepts, setConcepts] = useState<ConceptOption[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string>("")
  const [learningMode, setLearningMode] = useState<'complete' | 'specific' | null>(null)
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<ConceptOption[]>([])
  const [selectedConcept, setSelectedConcept] = useState<string>("")
  const [prereqStatus, setPrereqStatus] = useState<{ [conceptId: string]: boolean }>({})
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [conceptIdToTitle, setConceptIdToTitle] = useState<{ [id: string]: string }>({})

  // Load courses on mount
  useEffect(() => {
    setLoading(true)
    apiClient.getCourses()
      .then((data) => {
        setCourses(data.map((c: any) => ({ _id: c._id, title: c.title, slug: c.slug })))
        setLoading(false)
      })
      .catch((e) => {
        setError("Failed to load courses.")
        setLoading(false)
      })
  }, [])

  // Load concepts when course changes
  const handleCourseChange = async (courseId: string) => {
    setSelectedCourse(courseId)
    setLearningMode(null)
    setSelectedConcept("")
    setConcepts([])
    setSearch("")
    setSearchResults([])
    setPrereqStatus({})
    setActiveQuiz(null)
    setQuizQuestions([])
    setError("")
    setLoading(true)
    try {
      const course = courses.find((c) => c._id === courseId)
      if (!course) throw new Error("Course not found")
      setSelectedCourseSlug(course.slug)
      const courseRes: any = await apiClient.getCourseBySlug(course.slug)
      const courseData = courseRes?.data?.course || courseRes?.course
      const allConcepts: ConceptOption[] = []
      const idToTitle: { [id: string]: string } = {}
      if (courseData && Array.isArray(courseData.concepts)) {
        courseData.concepts.forEach((concept: any) => {
          allConcepts.push({
            _id: concept._id,
            title: concept.title,
            prerequisites: concept.prerequisites || [],
            quiz: concept.quiz || null,
          })
          idToTitle[concept._id] = concept.title
        })
      }
      setConcepts(allConcepts)
      setConceptIdToTitle(idToTitle)
    } catch (e) {
      setError("Failed to load concepts.")
    }
    setLoading(false)
  }

  // When learning mode changes, reset concept selection
  const handleLearningModeChange = (mode: 'complete' | 'specific') => {
    setLearningMode(mode)
    setPrereqStatus({})
    setActiveQuiz(null)
    setQuizQuestions([])
    setError("")
    setSearch("")
    setSearchResults([])
    if (mode === 'complete') {
      setSelectedConcept("")
      // Redirect to the main course page
      if (selectedCourseSlug) {
        router.push(`/courses/${selectedCourseSlug}`)
      }
    } else {
      setSelectedConcept("")
    }
  }

  // Search logic for concepts
  useEffect(() => {
    if (learningMode === 'specific' && search.trim().length > 0) {
      const results = concepts.filter(c => c.title.toLowerCase().includes(search.trim().toLowerCase()))
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [search, concepts, learningMode])

  // Handle concept selection from search results
  const handleConceptClick = (conceptId: string) => {
    setSelectedConcept(conceptId)
    setPrereqStatus({})
    setActiveQuiz(null)
    setQuizQuestions([])
    setError("")
  }

  // Handle taking a prerequisite quiz
  const handleTakeQuiz = async (conceptId: string) => {
    setActiveQuiz(conceptId)
    setQuizQuestions([])
    setLoading(true)
    setError("")
    try {
      const concept = concepts.find((c) => c._id === conceptId)
      if (!concept || !concept.quiz || !concept.quiz._id) throw new Error("Quiz not found for this concept.")
      const quizData = await apiClient.getQuiz(concept.quiz._id)
      const questions: QuizQuestion[] = (quizData?.data?.questions || []).map((q: any, idx: number) => ({
        id: q._id || idx,
        question: q.question,
        options: q.options,
        correct: Array.isArray(q.correctAnswers) ? q.correctAnswers[0] : q.correctAnswers,
        explanation: q.explanation,
      }))
      setQuizQuestions(questions)
    } catch (e) {
      setError("Failed to load quiz for prerequisite.")
    }
    setLoading(false)
  }

  // Handle quiz completion
  const handleQuizSubmit = (score: number, passed: boolean) => {
    if (activeQuiz) {
      setPrereqStatus((prev) => ({ ...prev, [activeQuiz]: passed && score >= 70 }))
      setActiveQuiz(null)
      setQuizQuestions([])
    }
  }

  // Get selected concept object
  const selectedConceptObj = concepts.find(c => c._id === selectedConcept)
  const prereqs = selectedConceptObj?.prerequisites || []
  const allPrereqsPassed = prereqs.length === 0 || prereqs.every(cid => prereqStatus[cid])

  // Build the concept node URL for redirect
  const conceptNodeUrl = selectedCourseSlug && selectedConcept ? `/courses/${selectedCourseSlug}/concepts/${selectedConcept}` : "#"

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 flex flex-col md:flex-row gap-8">
      <div className="flex-1 min-w-[320px] max-w-lg">
        <h1 className="text-2xl font-bold mb-6">Create Your Learning Path</h1>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Select Course</label>
          <Select value={selectedCourse} onValueChange={handleCourseChange} disabled={loading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loading ? "Loading courses..." : "Choose a course"} />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {concepts.length > 0 && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Learning Mode</label>
            <RadioGroup value={learningMode || undefined} onValueChange={handleLearningModeChange} className="flex gap-6">
              <RadioGroupItem value="complete" id="complete" />
              <label htmlFor="complete" className="mr-4">Complete Course</label>
              <RadioGroupItem value="specific" id="specific" />
              <label htmlFor="specific">Start from Specific Concept</label>
            </RadioGroup>
          </div>
        )}
        {concepts.length > 0 && learningMode === 'specific' && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Search Concept</label>
            <Input
              type="text"
              placeholder="Type concept title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
        )}
        {learningMode === 'specific' && selectedConcept && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Prerequisites</h2>
            {prereqs.length === 0 && <div className="text-green-600 mb-2">No prerequisites. You can start learning!</div>}
            {prereqs.map(cid => (
              <div key={cid} className="mb-2">
                <span className="font-medium">{conceptIdToTitle[cid] || cid}</span>
                {prereqStatus[cid] ? (
                  <span className="ml-2 text-green-600">✔ Passed</span>
                ) : activeQuiz === cid ? (
                  quizQuestions.length > 0 ? (
                    <Quiz
                      title={`Prerequisite Quiz: ${conceptIdToTitle[cid] || cid}`}
                      questions={quizQuestions}
                      onSubmit={handleQuizSubmit}
                    />
                  ) : (
                    <span className="ml-2 text-gray-500">Loading quiz...</span>
                  )
                ) : (
                  <Button size="sm" className="ml-2" onClick={() => handleTakeQuiz(cid)} disabled={loading}>
                    Take Prerequisite Quiz
                  </Button>
                )}
              </div>
            ))}
            {allPrereqsPassed && (
              <Button className="w-full mt-4" onClick={() => router.push(conceptNodeUrl)}>
                Start Learning from this Node
              </Button>
            )}
          </div>
        )}
      </div>
      {/* Right side: Search results */}
      {learningMode === 'specific' && search.trim().length > 0 && (
        <div className="flex-1 min-w-[320px] max-w-lg border-l pl-8">
          <h2 className="text-lg font-semibold mb-3">Search Results</h2>
          {searchResults.length === 0 ? (
            <div className="text-gray-500">No concepts found.</div>
          ) : (
            <ul className="space-y-2">
              {searchResults.map(concept => (
                <li key={concept._id}>
                  <Button
                    variant={selectedConcept === concept._id ? "default" : "outline"}
                    className="w-full text-left justify-start"
                    onClick={() => handleConceptClick(concept._id)}
                  >
                    {concept.title}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
