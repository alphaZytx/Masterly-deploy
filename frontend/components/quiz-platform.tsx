"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, X, Clock, Trophy, RotateCcw, ArrowRight, Target, AlertTriangle } from "lucide-react"
import { apiClient } from "@/lib/api"

interface Question {
  id: number | string
  question: string
  options: string[]
  correct: number
  explanation?: string
}

interface Quiz {
  id: string | number
  title: string
  timeLimit: number // in seconds
  questions: Question[]
  completed: boolean
  score?: number
  totalQuestions: number
  testType?: 'concept_quiz' | 'mock_test' | 'course_test' | 'assessment'
  conceptId?: string
  courseId?: string
  passingScore?: number // Default 75%
}

interface QuizPlatformProps {
  quiz: Quiz
  onQuizComplete?: (score: number, passed: boolean) => void
  onQuizClose?: (passed: boolean) => void
  showModal?: boolean
  allowRetake?: boolean
  showReview?: boolean
}

export function QuizPlatform({ 
  quiz, 
  onQuizComplete, 
  onQuizClose, 
  showModal = false,
  allowRetake = true,
  showReview = true
}: QuizPlatformProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [questionTimeLeft, setQuestionTimeLeft] = useState(20)
  const [isActive, setIsActive] = useState(false)
  const [showResults, setShowResults] = useState(quiz.completed)
  const [quizStarted, setQuizStarted] = useState(quiz.completed)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copyAttempts, setCopyAttempts] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [warningCount, setWarningCount] = useState(0)
  const [warningMessage, setWarningMessage] = useState('')
  const [passed, setPassed] = useState(true)
  const [questionTimedOut, setQuestionTimedOut] = useState(false)
  // Remove old navigation and answer logic for per-question UI
  // Add new state to track if the question is locked (after answer or timeout)
  const [questionLocked, setQuestionLocked] = useState(false)

  // Anti-cheat: Prevent copy-paste and right-click
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      setCopyAttempts(prev => prev + 1)
      setWarningCount((w) => {
        const newCount = w + 1
        setWarningMessage('Copy-paste detected!')
        setShowWarning(true)
        setTimeout(() => setShowWarning(false), 3000)
        if (newCount >= 3) {
          finishQuiz(false)
        }
        return newCount
      })
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      setCopyAttempts(prev => prev + 1)
      setWarningCount((w) => {
        const newCount = w + 1
        setWarningMessage('Right-click detected!')
        setShowWarning(true)
        setTimeout(() => setShowWarning(false), 3000)
        if (newCount >= 3) {
          finishQuiz(false)
        }
        return newCount
      })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 'z')) {
        e.preventDefault()
        setCopyAttempts(prev => prev + 1)
        setWarningCount((w) => {
          const newCount = w + 1
          setWarningMessage('Common shortcut detected!')
          setShowWarning(true)
          setTimeout(() => setShowWarning(false), 3000)
          if (newCount >= 3) {
            finishQuiz(false)
          }
          return newCount
        })
      }
      
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
        e.preventDefault()
        setCopyAttempts(prev => prev + 1)
        setWarningCount((w) => {
          const newCount = w + 1
          setWarningMessage('F12 or suspicious key combination detected!')
          setShowWarning(true)
          setTimeout(() => setShowWarning(false), 3000)
          if (newCount >= 3) {
            finishQuiz(false)
          }
          return newCount
        })
      }
    }

    if (quizStarted && !showResults) {
      document.addEventListener('copy', handleCopy)
      document.addEventListener('contextmenu', handleContextMenu)
      document.addEventListener('keydown', handleKeyDown)
      
      // Disable text selection using CSS class
      document.body.classList.add('no-select')
    }

    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      
      // Re-enable text selection
      document.body.classList.remove('no-select')
    }
  }, [quizStarted, showResults])

  // Add tab switch/blur warning logic
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && quizStarted && !showResults) {
        setWarningCount((w) => {
          const newCount = w + 1
          setWarningMessage('Tab switch detected!')
          setShowWarning(true)
          setTimeout(() => setShowWarning(false), 3000)
          if (newCount >= 3) {
            finishQuiz(false)
          }
          return newCount
        })
      }
    }
    const handleBlur = () => {
      if (quizStarted && !showResults) {
        setWarningCount((w) => {
          const newCount = w + 1
          setWarningMessage('Window lost focus!')
          setShowWarning(true)
          setTimeout(() => setShowWarning(false), 3000)
          if (newCount >= 3) {
            finishQuiz(false)
          }
          return newCount
        })
      }
    }
    if (quizStarted && !showResults) {
      document.addEventListener('visibilitychange', handleVisibility)
      window.addEventListener('blur', handleBlur)
    }
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
    }
  }, [quizStarted, showResults])

  // Reset timer on question change
  useEffect(() => {
    if (quizStarted && !showResults) {
      setQuestionTimeLeft(20)
    }
  }, [currentQuestion, quizStarted, showResults])

  // Update timer useEffect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isActive && questionTimeLeft > 0 && !showResults && !questionLocked) {
      interval = setInterval(() => {
        setQuestionTimeLeft((t) => {
          if (t <= 1) {
            setQuestionLocked(true)
            setSelectedAnswers((prev) => {
              const newAnswers = [...prev]
              newAnswers[currentQuestion] = -1
              return newAnswers
            })
            setTimeout(() => {
              goToNextQuestion()
            }, 300)
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, questionTimeLeft, currentQuestion, showResults, questionLocked])

  // Helper to go to next question or finish
  const goToNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setQuestionTimeLeft(20)
      setQuestionLocked(false)
    } else {
      setIsActive(false)
      finishQuiz()
    }
  }

  // Save and Continue handler
  const handleSaveAndContinue = () => {
    setQuestionLocked(true)
    setTimeout(() => {
      goToNextQuestion()
    }, 300)
  }

  // Continue handler (no answer saved)
  const handleContinue = () => {
    setSelectedAnswers((prev) => {
      const newAnswers = [...prev]
      newAnswers[currentQuestion] = -1
      return newAnswers
    })
    setQuestionLocked(true)
    setTimeout(() => {
      goToNextQuestion()
    }, 300)
  }

  const startQuiz = () => {
    setQuizStarted(true)
    setIsActive(true)
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setShowResults(false)
    setCopyAttempts(0)
    setQuestionTimeLeft(20)
    setWarningCount(0)
    setWarningMessage('')
    setPassed(true)
  }

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const finishQuiz = async (forceFail?: boolean) => {
    setIsActive(false)
    setShowResults(true)
    
    let finalScore = Math.round((calculateScore() / quiz.questions.length) * 100)
    const passingScore = quiz.passingScore || 75
    let didPass = finalScore >= passingScore
    if (forceFail) {
      didPass = false
      finalScore = 0
    }
    setPassed(didPass)
    
    // Call the completion callback
    if (onQuizComplete) {
      onQuizComplete(finalScore, didPass)
    }
    
    // Submit to backend if we have the required IDs
    if (quiz.conceptId && quiz.courseId && quiz.testType === 'concept_quiz') {
      setIsSubmitting(true)
      try {
        await apiClient.updateConceptProgress(quiz.conceptId, 'quiz_completed', {
          courseId: quiz.courseId,
          score: finalScore
        })
        console.log('Quiz results submitted successfully')
      } catch (error) {
        console.error('Failed to submit quiz results:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const calculateScore = () => {
    let correct = 0
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct) {
        correct++
      }
    })
    return correct
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    const passingScore = quiz.passingScore || 75
    
    if (percentage >= passingScore) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getTestTypeInfo = () => {
    switch (quiz.testType) {
      case 'concept_quiz':
        return { icon: Target, label: 'Concept Quiz', color: 'text-blue-600' }
      case 'mock_test':
        return { icon: Trophy, label: 'Mock Test', color: 'text-purple-600' }
      case 'course_test':
        return { icon: Target, label: 'Course Test', color: 'text-green-600' }
      case 'assessment':
        return { icon: Target, label: 'Assessment', color: 'text-orange-600' }
      default:
        return { icon: Target, label: 'Quiz', color: 'text-gray-600' }
    }
  }

  const testTypeInfo = getTestTypeInfo()
  const TestTypeIcon = testTypeInfo.icon

  if (!quizStarted) {
    return (
      <Card className="dark:bg-gray-800/80 dark:border-gray-700 max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TestTypeIcon className={`w-6 h-6 ${testTypeInfo.color}`} />
            <CardTitle className="text-2xl text-gray-900 dark:text-white">{quiz.title}</CardTitle>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-6 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>{Math.floor(quiz.timeLimit / 60)} minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>{quiz.questions.length} questions</span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quiz Instructions:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 text-left">
                <li>• You have {Math.floor(quiz.timeLimit / 60)} minutes to complete {quiz.questions.length} questions</li>
                <li>• Each question has only one correct answer</li>
                <li>• You can navigate between questions using the Next/Previous buttons</li>
                <li>• Your progress will be saved automatically</li>
                <li>• Click "Finish Quiz" when you're done or time runs out</li>
                <li>• Passing score: {(quiz.passingScore || 75)}%</li>
                <li className="text-red-600 font-medium">• Copy-paste and right-click are disabled for security</li>
              </ul>
            </div>
          </div>
        </CardHeader>

        <CardContent className="text-center">
          <Button onClick={startQuiz} size="lg" className="px-8">
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (showResults) {
    const score = quiz.completed ? quiz.score! : calculateScore()
    const total = quiz.questions.length
    const percentage = Math.round((score / total) * 100)
    const passingScore = quiz.passingScore || 75
    const didPass = percentage >= passingScore

    return (
      <Card className="dark:bg-gray-800/80 dark:border-gray-700 max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-gray-900 dark:text-white mb-4">Quiz Results</CardTitle>

          <div className="space-y-4">
            <div className={`text-6xl font-bold ${getScoreColor(score, total)}`}>
              {score}/{total}
            </div>

            <div className="text-xl text-gray-600 dark:text-gray-300">You scored {percentage}%</div>

            <div className="flex items-center justify-center space-x-6">
              <Badge
                className={`${didPass ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}
              >
                {didPass ? "Passed!" : "Failed"}
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                Passing Score: {passingScore}%
              </Badge>
            </div>
          </div>
        </CardHeader>

        {showReview && didPass && (
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Question Review:</h3>

            {quiz.questions.map((question, index) => {
              const userAnswer = selectedAnswers[index]
              const isCorrect = userAnswer === question.correct

              return (
                <div
                  key={question.id}
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
                        {index + 1}. {question.question}
                      </h4>

                      <div className="space-y-1 text-sm">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded ${
                              optionIndex === question.correct
                                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
                                : optionIndex === userAnswer && userAnswer !== question.correct
                                  ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200"
                                  : "text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            {optionIndex === question.correct && "✓ "}
                            {optionIndex === userAnswer && userAnswer !== question.correct && "✗ "}
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
            {onQuizClose && (
              <Button onClick={() => onQuizClose(didPass)} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                <Target className="w-4 h-4 mr-2" />
                    Continue
                  </>
                )}
            </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentQ = quiz.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100

  return (
    <>
      {/* Anti-cheat warning */}
      {showWarning && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{warningMessage}</span>
          </div>
        </div>
      )}

    <Card className="dark:bg-gray-800/80 dark:border-gray-700 max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-gray-900 dark:text-white">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </CardTitle>

          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                  questionTimeLeft <= 60
                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              }`}
            >
              <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(questionTimeLeft)}</span>
            </div>
              
              {copyAttempts > 0 && (
                <Badge variant="destructive" className="text-xs">
                  Warnings: {copyAttempts}
                </Badge>
              )}
          </div>
        </div>

        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-6">
          {currentQ && (
            <>
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{currentQ.question}</h2>
          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                      onClick={() => !questionLocked && selectAnswer(index)}
                className={`w-full p-4 text-left rounded-lg border transition-colors ${
                        selectedAnswers[currentQuestion] === index && selectedAnswers[currentQuestion] !== -1
                    ? "bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300"
                    : "bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600 dark:hover:bg-gray-600/50 text-gray-900 dark:text-white"
                }`}
                      disabled={questionLocked}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                            selectedAnswers[currentQuestion] === index && selectedAnswers[currentQuestion] !== -1
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300 dark:border-gray-500"
                    }`}
                  >
                          {selectedAnswers[currentQuestion] === index && selectedAnswers[currentQuestion] !== -1 && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
              <div className="flex justify-center gap-4 mt-6">
                <Button
                  onClick={handleSaveAndContinue}
                  disabled={questionLocked || selectedAnswers[currentQuestion] === undefined || selectedAnswers[currentQuestion] === -1}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save and Continue
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={questionLocked}
                  className="bg-gray-400 hover:bg-gray-500 text-white"
                >
                  Continue
          </Button>
          </div>
            </>
          )}
      </CardContent>
    </Card>
    </>
  )
}
