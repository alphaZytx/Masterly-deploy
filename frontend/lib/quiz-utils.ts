import { apiClient } from "./api"

export interface QuizConfig {
  id: string
  title: string
  timeLimit: number // in seconds
  questions: Array<{
    id: string | number
    question: string
    options: string[]
    correct: number
    explanation?: string
  }>
  testType: 'concept_quiz' | 'mock_test' | 'course_test' | 'assessment'
  conceptId?: string
  courseId?: string
  passingScore?: number
}

export const createConceptQuiz = async (
  conceptId: string, 
  courseId: string, 
  title: string,
  timeLimit: number = 600 // 10 minutes default
): Promise<QuizConfig> => {
  try {
    // Fetch concept quiz data from backend
    const response = await apiClient.getConceptLearningPage(courseId, conceptId)
    
    if (!response.success || !response.data.concept.quiz) {
      throw new Error('No quiz data available for this concept')
    }

    const quizData = response.data.concept.quiz
    
    return {
      id: conceptId,
      title: `${title} Quiz`,
      timeLimit,
      questions: quizData.questions.map((q: any, index: number) => ({
        id: q.questionId || index,
        question: q.text,
        options: q.options,
        correct: q.answer,
        explanation: q.explanation
      })),
      testType: 'concept_quiz',
      conceptId,
      courseId,
      passingScore: 75
    }
  } catch (error) {
    console.error('Failed to create concept quiz:', error)
    throw error
  }
}

export const createMockTest = async (
  courseId: string,
  title: string = 'Mock Test',
  timeLimit: number = 1800 // 30 minutes default
): Promise<QuizConfig> => {
  try {
    // Fetch mock test questions from backend
    const response = await apiClient.getCourseMockTestQuestions(courseId)
    
    if (!response.success || !response.data.questions) {
      throw new Error('No mock test questions available')
    }

    return {
      id: `mock-test-${courseId}`,
      title,
      timeLimit,
      questions: response.data.questions.map((q: any, index: number) => ({
        id: q.id || index,
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation
      })),
      testType: 'mock_test',
      courseId,
      passingScore: 70
    }
  } catch (error) {
    console.error('Failed to create mock test:', error)
    throw error
  }
}

export const createCourseTest = async (
  courseId: string,
  title: string = 'Course Test',
  timeLimit: number = 3600 // 1 hour default
): Promise<QuizConfig> => {
  try {
    // Fetch course test questions from backend
    const response = await apiClient.getCourseTestQuestions(courseId)
    
    if (!response.success || !response.data.questions) {
      throw new Error('No course test questions available')
    }

    return {
      id: `course-test-${courseId}`,
      title,
      timeLimit,
      questions: response.data.questions.map((q: any, index: number) => ({
        id: q.id || index,
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation
      })),
      testType: 'course_test',
      courseId,
      passingScore: 80
    }
  } catch (error) {
    console.error('Failed to create course test:', error)
    throw error
  }
}

export const createAssessment = async (
  assessmentId: string,
  title: string,
  timeLimit: number = 1200 // 20 minutes default
): Promise<QuizConfig> => {
  try {
    // Fetch assessment questions from backend
    const response = await apiClient.getQuiz(assessmentId)
    
    if (!response.success || !response.data.questions) {
      throw new Error('No assessment questions available')
    }

    return {
      id: assessmentId,
      title,
      timeLimit,
      questions: response.data.questions.map((q: any, index: number) => ({
        id: q.id || index,
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation
      })),
      testType: 'assessment',
      passingScore: 75
    }
  } catch (error) {
    console.error('Failed to create assessment:', error)
    throw error
  }
}

// Helper function to submit quiz results
export const submitQuizResults = async (
  quizConfig: QuizConfig,
  score: number,
  timeSpent: number
) => {
  try {
    switch (quizConfig.testType) {
      case 'concept_quiz':
        if (quizConfig.conceptId && quizConfig.courseId) {
          await apiClient.updateConceptProgress(quizConfig.conceptId, 'quiz_completed', {
            courseId: quizConfig.courseId,
            score
          })
        }
        break
        
      case 'mock_test':
        if (quizConfig.courseId) {
          await apiClient.submitCourseTest(quizConfig.courseId, {
            answers: {}, // This would need to be implemented based on your backend
            timeSpent,
            testType: 'mock_test'
          })
        }
        break
        
      case 'course_test':
        if (quizConfig.courseId) {
          await apiClient.submitCourseTest(quizConfig.courseId, {
            answers: {}, // This would need to be implemented based on your backend
            timeSpent,
            testType: 'course_test'
          })
        }
        break
        
      case 'assessment':
        await apiClient.submitQuiz(quizConfig.id, {
          answers: {}, // This would need to be implemented based on your backend
          timeSpent
        })
        break
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to submit quiz results:', error)
    return { success: false, error }
  }
} 