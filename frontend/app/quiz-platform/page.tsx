"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, X, Clock, Trophy, RotateCcw, ArrowRight, Target, BookOpen, BrainCircuit, TestTube } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api"
import { useRouter } from "next/navigation"

interface Question {
  _id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  conceptId?: string
  topic?: string
}

interface Quiz {
  id: string
  title: string
  description: string
  timeLimit: number // in seconds
  questions: Question[]
  topic?: string
  currentMastery?: number
  targetMastery?: number
  courseId?: string
  testType?: 'course_test' | 'mock_test' | 'concept_quiz'
}

export default function QuizPlatform() {
  const searchParams = useSearchParams()
  const quizId = searchParams.get("quiz")
  const topicId = searchParams.get("topic")
  const courseId = searchParams.get("courseId")
  const testType = searchParams.get("testType") as 'course_test' | 'mock_test' | 'concept_quiz' | null

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    loadQuiz()
  }, [quizId, topicId, courseId, testType])

  const loadQuiz = async () => {
    try {
      setLoading(true)
      setError(null)

      let response
      
      if (courseId && testType) {
        // Load course-specific test
        if (testType === 'course_test') {
          response = await apiClient.getCourseTestQuestions(courseId)
        } else if (testType === 'mock_test') {
          response = await apiClient.getCourseMockTestQuestions(courseId)
        }
        
        if (response?.success) {
          const quizData: Quiz = {
            id: courseId,
            title: testType === 'course_test' ? 'Course Assessment' : 'Mock Test',
            description: testType === 'course_test' 
              ? 'Test your knowledge of the entire course material'
              : 'Practice test with comprehensive questions from all topics',
            timeLimit: response.data.timeLimit || 3600,
            questions: response.data.questions,
            courseId,
            testType
          }
          setQuiz(quizData)
          setTimeLeft(quizData.timeLimit)
        } else {
          setError(response?.message || 'Failed to load test questions')
        }
      } else if (quizId) {
        // Load regular quiz (existing functionality)
        response = await apiClient.getQuiz(quizId)
        
        if (response?.success) {
          setQuiz(response.data)
          setTimeLeft(response.data.timeLimit)
        } else {
          setError(response?.message || 'Failed to load quiz')
        }
      } else if (topicId) {
        // Load topic-specific quiz
        response = await apiClient.getTopicQuiz(topicId)
        
        if (response?.success) {
          setQuiz(response.data)
          setTimeLeft(response.data.timeLimit)
        } else {
          setError(response?.message || 'Failed to load topic quiz')
        }
      } else {
        // Default quiz for demo
        const defaultQuiz: Quiz = {
          id: "1",
          title: "Arrays and Strings Mastery Quiz",
          description: "Test your understanding of arrays and string manipulation concepts",
          timeLimit: 900, // 15 minutes
          topic: "Arrays & Strings",
          currentMastery: 65,
          targetMastery: 80,
          questions: [
            {
              _id: "1",
              question: "What is the time complexity of accessing an element in an array by index?",
              options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
              correctAnswer: 0,
              explanation: "Array access by index is O(1) because arrays store elements in contiguous memory locations, allowing direct access using the index.",
              difficulty: "easy",
              topic: "Arrays",
            },
            {
              _id: "2",
              question: "Which of the following string methods modifies the original string in JavaScript?",
              options: ["slice()", "substring()", "replace()", "None of the above"],
              correctAnswer: 3,
              explanation: "Strings in JavaScript are immutable. All string methods return a new string rather than modifying the original string.",
              difficulty: "medium",
              topic: "Strings",
            },
            {
              _id: "3",
              question: "What is the space complexity of the two-pointer technique for reversing an array in-place?",
              options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
              correctAnswer: 0,
              explanation: "The two-pointer technique uses only a constant amount of extra space regardless of input size, making it O(1) space complexity.",
              difficulty: "medium",
              topic: "Arrays",
            },
            {
              _id: "4",
              question: "Which algorithm is most efficient for finding all anagrams of a pattern in a text?",
              options: ["Brute Force", "Sliding Window", "Dynamic Programming", "Divide and Conquer"],
              correctAnswer: 1,
              explanation: "Sliding window technique is most efficient for this problem, maintaining a window of pattern length and comparing character frequencies.",
              difficulty: "hard",
              topic: "Strings",
            },
            {
              _id: "5",
              question: "What happens when you try to access an array element beyond its bounds in Java?",
              options: ["Returns null", "Returns 0", "Throws ArrayIndexOutOfBoundsException", "Returns undefined"],
              correctAnswer: 2,
              explanation: "Java throws an ArrayIndexOutOfBoundsException when trying to access an array element with an invalid index.",
              difficulty: "easy",
              topic: "Arrays",
            },
          ],
        }
        setQuiz(defaultQuiz)
        setTimeLeft(defaultQuiz.timeLimit)
      }
    } catch (err) {
      console.error('Error loading quiz:', err)
      setError('Failed to load quiz data')
    } finally {
      setLoading(false)
    }
  }

  // Timer effect
  useEffect(() => {
    if (quizStarted && !quizCompleted && timeLeft > 0 && quiz) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleQuizComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [quizStarted, quizCompleted, timeLeft, quiz])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startQuiz = () => {
    setQuizStarted(true)
    setStartTime(new Date())
  }

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))
  }

  const nextQuestion = () => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleQuizComplete = async () => {
    setQuizCompleted(true)
    setEndTime(new Date())
    
    // Submit results to backend
    if (quiz && (quiz.courseId || quiz.id)) {
      try {
        setSubmitting(true)
        
        const timeTaken = startTime && endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0
        
        let response
        if (quiz.courseId && quiz.testType) {
          // Submit course test results
          response = await apiClient.submitCourseTest(quiz.courseId, {
            answers: selectedAnswers,
            timeSpent: timeTaken,
            testType: quiz.testType
          })
        } else {
          // Submit regular quiz results
          response = await apiClient.submitQuiz(quiz.id, {
            answers: selectedAnswers,
            timeSpent: timeTaken
          })
        }
        
        if (response?.success) {
          // Results will be shown in the UI
        } else {
          console.error('Failed to submit results:', response?.message)
        }
      } catch (err) {
        console.error('Error submitting results:', err)
      } finally {
        setSubmitting(false)
      }
    }
    
    setShowResults(true)
  }

  const calculateResults = () => {
    if (!quiz) return null
    
    const correctAnswers = quiz.questions.filter((question, index) => 
      selectedAnswers[question._id] === question.correctAnswer
    ).length

    const totalQuestions = quiz.questions.length
    const percentage = Math.round((correctAnswers / totalQuestions) * 100)
    const timeTaken = startTime && endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0

    // Calculate new mastery score
    const currentMastery = quiz.currentMastery || 0
    const masteryIncrease = Math.max(0, Math.min(15, percentage - 60)) // 0-15 point increase
    const newMastery = Math.min(100, currentMastery + masteryIncrease)

    return {
      correctAnswers,
      totalQuestions,
      percentage,
      timeTaken,
      newMastery,
      masteryIncrease,
    }
  }

  const restartQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswers({})
    if (quiz) {
      setTimeLeft(quiz.timeLimit)
    }
    setQuizStarted(false)
    setQuizCompleted(false)
    setShowResults(false)
    setStartTime(null)
    setEndTime(null)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
      case "hard":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const goBackToCourse = () => {
    if (courseId) {
      router.push(`/courses/${courseId}`)
    } else {
      router.push('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Quiz</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Button onClick={goBackToCourse}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestionData = quiz.questions[currentQuestion]
  const answeredQuestions = Object.keys(selectedAnswers).length
  const answerProgress = (answeredQuestions / quiz.questions.length) * 100

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl dark:bg-gray-800/80 dark:border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900 dark:text-white mb-4">{quiz.title}</CardTitle>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{quiz.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900 dark:text-white">Time Limit</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{formatTime(quiz.timeLimit)}</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900 dark:text-white">Questions</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{quiz.questions.length} questions</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Mastery</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{quiz.currentMastery}%</span>
              </div>
              <Progress value={quiz.currentMastery} className="mb-2" />
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Target: {quiz.targetMastery}% • Topic: {quiz.topic}
              </div>
            </div>
          </CardHeader>

          <CardContent className="text-center">
            <Button onClick={startQuiz} size="lg" className="w-full">
              Start Quiz
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Make sure you have a stable internet connection and won't be interrupted
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showResults) {
    const results = calculateResults()

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="dark:bg-gray-800/80 dark:border-gray-700 mb-6">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900 dark:text-white mb-2">Quiz Completed!</CardTitle>
              <p className="text-gray-600 dark:text-gray-300">Great job! Here are your results for {quiz.title}</p>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{results.percentage}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Score</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {results.correctAnswers}/{results.totalQuestions} correct
                  </div>
                </div>

                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{formatTime(results.timeTaken)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Time Taken</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">of {formatTime(quiz.timeLimit)}</div>
                </div>

                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {results.newMastery}%
                    {results.masteryIncrease > 0 && (
                      <span className="text-sm text-green-500 ml-1">(+{results.masteryIncrease})</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">New Mastery</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{quiz.topic}</div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mastery Progress</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {quiz.currentMastery}% → {results.newMastery}%
                  </span>
                </div>
                <Progress value={results.newMastery} className="mb-2" />
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {results.newMastery >= quiz.targetMastery
                    ? "🎉 Target mastery achieved!"
                    : `${quiz.targetMastery - results.newMastery}% more to reach target`}
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Button onClick={restartQuiz} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake Quiz
                </Button>
                <Button asChild>
                  <a href={`/courses/${courseId || "arrays"}`}>
                    Continue Learning
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card className="dark:bg-gray-800/80 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Question Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quiz.questions.map((question, index) => {
                const userAnswer = selectedAnswers[question._id]
                const isCorrect = userAnswer === question.correctAnswer

                return (
                  <div key={question._id} className="border dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">Question {index + 1}</span>
                          <Badge className={getDifficultyColor(question.difficulty)}>{question.difficulty}</Badge>
                          <Badge variant="outline">{question.topic}</Badge>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">{question.question}</p>
                      </div>
                      <div className="ml-4">
                        {isCorrect ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <X className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-2 rounded border text-sm ${
                            optionIndex === question.correctAnswer
                              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                              : optionIndex === userAnswer && !isCorrect
                                ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                                : "bg-gray-50 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span>
                            <span>{option}</span>
                            {optionIndex === question.correctAnswer && (
                              <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                            )}
                            {optionIndex === userAnswer && !isCorrect && <X className="w-4 h-4 text-red-600 ml-auto" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                      <div className="font-medium text-blue-900 dark:text-blue-300 mb-1">Explanation:</div>
                      <div className="text-sm text-blue-800 dark:text-blue-200">{question.explanation}</div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const currentQ = quiz.questions[currentQuestion]
  const questionProgress = ((currentQuestion + 1) / quiz.questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className={`font-mono ${timeLeft < 60 ? "text-red-600" : "text-gray-900 dark:text-white"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleQuizComplete}>
              Submit Quiz
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={questionProgress} className="h-2" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <Card className="dark:bg-gray-800/80 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className={getDifficultyColor(currentQ.difficulty)}>{currentQ.difficulty}</Badge>
                <Badge variant="outline">{currentQ.topic}</Badge>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {answeredQuestions} / {quiz.questions.length} answered
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{currentQ.question}</h2>

              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQ._id, index)}
                    className={`w-full p-4 text-left rounded-lg border transition-all ${
                      selectedAnswers[currentQ._id] === index
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswers[currentQ._id] === index
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300 dark:border-gray-500"
                        }`}
                      >
                        {selectedAnswers[currentQ._id] === index && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="text-gray-900 dark:text-white">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={prevQuestion} disabled={currentQuestion === 0}>
                Previous
              </Button>

              <div className="flex space-x-2">
                {quiz.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-8 h-8 rounded text-xs font-medium ${
                      index === currentQuestion
                        ? "bg-blue-600 text-white"
                        : selectedAnswers[quiz.questions[index]._id] !== undefined
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {currentQuestion === quiz.questions.length - 1 ? (
                <Button onClick={handleQuizComplete} disabled={selectedAnswers[currentQ._id] === undefined}>
                  Submit Quiz
                </Button>
              ) : (
                <Button onClick={nextQuestion} disabled={selectedAnswers[currentQ._id] === undefined}>
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
