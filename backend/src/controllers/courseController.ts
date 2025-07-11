import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import Course from '../models/courseModel';
import User, { IUser } from '../models/userModel';
import Concept from '../models/conceptModel';
import { authenticateToken, optionalAuth } from '../middlewares/authMiddleware';
import { ICourse } from '../types';
import ConceptIntegrationService from '../utils/conceptIntegrationService';
import { CourseStatsCalculator } from '../utils/courseStatsCalculator';
import UserProgress from '../models/userProgressModel';
import Assessment from '../models/assessmentModel';

const router = Router();

// @route   POST /api/courses/create-dsa
// @desc    Create DSA course using existing concepts
// @access  Private (Admin only)
router.post("/create-dsa", authenticateToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const user = req.user as IUser;
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    const result = await ConceptIntegrationService.createDSACourse();
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.course,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error("Create DSA course error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create DSA course"
    });
  }
});

// @route   GET /api/courses/:courseId/topics/:topicId/concepts
// @desc    Get concepts for a specific topic (with references)
// @access  Public
router.get("/:courseId/topics/:topicId/concepts", async (req: Request, res: Response) => {
  try {
    const { courseId, topicId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const topic = (course as any).topics.find((t : any )=> t._id.toString() === topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found"
      });
    }

    let concepts = [];
    
    if (topic.useReferencedConcepts) {
      // Get referenced concepts
      const conceptIds = (topic as any).conceptReferences.map((ref : any)=> ref.conceptId);
      const referencedConcepts = await Concept.find({ _id: { $in: conceptIds } });
      
      concepts = (topic as any).conceptReferences.map((ref: any) => {
        const concept = referencedConcepts.find((c: any) => c._id.toString() === ref.conceptId.toString());
        return {
          ...concept?.toObject(),
          order: ref.order,
          isRequired: ref.isRequired,
          estimatedTime: ref.estimatedTime,
          difficulty: ref.difficulty,
          title: ref.customTitle || concept?.title,
          description: ref.customDescription || concept?.description
        };
      }).sort((a: any, b: any) => a.order - b.order);
    } else {
      // Use embedded concepts
      concepts = (topic as any).concepts;
    }

    res.json({
      success: true,
      data: {
        topic: {
          _id: topic._id,
          title: topic.title,
          description: topic.description,
          icon: topic.icon,
          estimatedHours: topic.estimatedHours
        },
        concepts
      }
    });
  } catch (error) {
    console.error("Get topic concepts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch topic concepts"
    });
  }
});

// @route   GET /api/courses
// @desc    Get all courses with dynamic stats
// @access  Public
router.get("/", async (req: Request, res: Response) => {
  try {
    const courses = await Course.find({ isActive: true }).sort({ createdAt: -1 });
    
    // Get dynamic stats for all courses
    const statsMap = await CourseStatsCalculator.calculateAllCourseStats();
    
    // Enhance courses with real-time stats
    const enhancedCourses = courses.map((course: any) => {
      const courseStats = statsMap.get(course._id.toString());
      return {
        ...course.toObject(),
        stats: courseStats || course.stats
      };
    });

    res.json({
      success: true,
      data: enhancedCourses,
      message: "Courses retrieved successfully"
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses"
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID with dynamic stats
// @access  Public
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Get real-time stats
    const realTimeStats = await CourseStatsCalculator.getRealTimeStats(course._id as Types.ObjectId);
    
    const enhancedCourse = {
      ...course.toObject(),
      stats: realTimeStats
    };

    res.json({
      success: true,
      data: enhancedCourse,
      message: "Course retrieved successfully"
    });
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course"
    });
  }
});

// @route   POST /api/courses/:id/update-stats
// @desc    Update course stats (admin only)
// @access  Private (Admin only)
router.post("/:id/update-stats", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as IUser;
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    await CourseStatsCalculator.updateCourseStats(new Types.ObjectId(id as string));
    
    res.json({
      success: true,
      message: "Course stats updated successfully"
    });
  } catch (error) {
    console.error("Update course stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update course stats"
    });
  }
});

// @route   POST /api/courses/update-all-stats
// @desc    Update stats for all courses (admin only)
// @access  Private (Admin only)
router.post("/update-all-stats", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    await CourseStatsCalculator.updateAllCourseStats();
    
    res.json({
      success: true,
      message: "All course stats updated successfully"
    });
  } catch (error) {
    console.error("Update all course stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update all course stats"
    });
  }
});

// Course Test Methods
router.get("/:courseId/test-questions", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params
    const userId = req.user?._id

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' })
    }

    // Check if user is enrolled in the course
    const enrollment = await UserProgress.findOne({ 
      userId, 
      courseId,
      status: { $in: ['enrolled', 'in_progress', 'completed'] }
    })

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'You must be enrolled in this course to take the test' })
    }

    // Get course with concepts
    const course = await Course.findById(courseId).populate({
      path: 'topics.concepts',
      model: 'Concept'
    })

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }

    // Generate test questions from course concepts
    const questions = await generateCourseTestQuestions(course, 'course_test')

    res.json({
      success: true,
      data: {
        questions,
        timeLimit: 3600, // 1 hour for course test
        totalQuestions: questions.length
      }
    })
  } catch (error) {
    console.error('Error getting course test questions:', error)
    res.status(500).json({ success: false, message: 'Failed to get test questions' })
  }
});

router.get("/:courseId/mock-test-questions", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params
    const userId = req.user?._id

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' })
    }

    // Check if user is enrolled in the course
    const enrollment = await UserProgress.findOne({ 
      userId, 
      courseId,
      status: { $in: ['enrolled', 'in_progress', 'completed'] }
    })

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'You must be enrolled in this course to take the mock test' })
    }

    // Get course with concepts
    const course = await Course.findById(courseId).populate({
      path: 'topics.concepts',
      model: 'Concept'
    })

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }

    // Generate mock test questions from course concepts
    const questions = await generateCourseTestQuestions(course, 'mock_test')

    res.json({
      success: true,
      data: {
        questions,
        timeLimit: 7200, // 2 hours for mock test
        totalQuestions: questions.length
      }
    })
  } catch (error) {
    console.error('Error getting course mock test questions:', error)
    res.status(500).json({ success: false, message: 'Failed to get mock test questions' })
  }
});

router.post("/:courseId/submit-test", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params
    const { answers, timeSpent, testType = 'course_test' } = req.body
    const userId = req.user?._id

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' })
    }

    // Check if user is enrolled in the course
    const enrollment = await UserProgress.findOne({ 
      userId, 
      courseId,
      status: { $in: ['enrolled', 'in_progress', 'completed'] }
    })

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'You must be enrolled in this course to submit test results' })
    }

    // Get course with concepts to validate answers
    const course = await Course.findById(courseId).populate({
      path: 'topics.concepts',
      model: 'Concept'
    })

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }

    // Calculate test results
    const results = await calculateTestResults(course, answers, timeSpent, testType)

    // Save test results
    await saveTestResults(String(userId), String(courseId), results, String(testType));

    // Update user progress if test is passed
    if (results.passed && testType === 'course_test') {
      await updateCourseProgressAfterTest(String(userId), String(courseId), String(results))
    }

    res.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error submitting course test:', error)
    res.status(500).json({ success: false, message: 'Failed to submit test results' })
  }
});

// Helper methods
const generateCourseTestQuestions = async (course: any, testType: string) => {
  const questions = []
  const allConcepts = []

  // Collect all concepts from course topics
  for (const topic of course.topics) {
    if (topic.concepts && Array.isArray(topic.concepts)) {
      allConcepts.push(...topic.concepts)
    }
  }

  // Generate questions based on test type
  if (testType === 'course_test') {
    // Course test: 20-30 questions covering all concepts
    const numQuestions = Math.min(25, allConcepts.length * 2)
    const selectedConcepts = shuffleArray(allConcepts).slice(0, numQuestions)
    
    for (const concept of selectedConcepts) {
      const conceptQuestions = await generateConceptQuestions(concept, 1)
      questions.push(...conceptQuestions)
    }
  } else if (testType === 'mock_test') {
    // Mock test: 40-50 questions for comprehensive practice
    const numQuestions = Math.min(45, allConcepts.length * 3)
    const selectedConcepts = shuffleArray(allConcepts).slice(0, numQuestions)
    
    for (const concept of selectedConcepts) {
      const conceptQuestions = await generateConceptQuestions(concept, 2)
      questions.push(...conceptQuestions)
    }
  }

  return shuffleArray(questions)
}

const generateConceptQuestions = async (concept: any, numQuestions: number) => {
  // This is a simplified question generation
  // In a real implementation, you would have a question bank or use AI to generate questions
  const questions = []
  
  const questionTemplates = [
    {
      question: `What is the time complexity of ${concept.title}?`,
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      correctAnswer: Math.floor(Math.random() * 4),
      difficulty: 'medium'
    },
    {
      question: `Which of the following best describes ${concept.title}?`,
      options: [
        'A simple data structure',
        'An advanced algorithm',
        'A fundamental concept',
        'A complex optimization'
      ],
      correctAnswer: Math.floor(Math.random() * 4),
      difficulty: 'easy'
    },
    {
      question: `When would you use ${concept.title}?`,
      options: [
        'For simple calculations',
        'For complex problem solving',
        'For data organization',
        'For all scenarios'
      ],
      correctAnswer: Math.floor(Math.random() * 4),
      difficulty: 'medium'
    }
  ]

  for (let i = 0; i < Math.min(numQuestions, questionTemplates.length); i++) {
    const template = questionTemplates[i]
    questions.push({
      _id: `${concept._id}_q${i}`,
      question: template.question,
      options: template.options,
      correctAnswer: template.correctAnswer,
      explanation: `This question tests your understanding of ${concept.title}.`,
      difficulty: template.difficulty,
      conceptId: concept._id
    })
  }

  return questions
}

const calculateTestResults = async (course: any, answers: any, timeSpent: number, testType: string) => {
  const questions = await generateCourseTestQuestions(course, testType)
  let correctAnswers = 0
  let totalQuestions = 0

  for (const question of questions) {
    if (answers[question._id] !== undefined) {
      totalQuestions++
      if (answers[question._id] === question.correctAnswer) {
        correctAnswers++
      }
    }
  }

  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  const passed = score >= 70 // 70% passing threshold
  const masteryGained = passed ? Math.max(5, Math.min(15, score - 60)) : 0

  return {
    score,
    totalQuestions,
    correctAnswers,
    timeSpent,
    passed,
    masteryGained,
    testType
  }
}

const saveTestResults = async (userId: string, courseId: string, results: any, testType: string) => {
  // Save test results to database
  const testResult = new Assessment({
    userId,
    courseId,
    testType,
    score: results.score,
    totalQuestions: results.totalQuestions,
    correctAnswers: results.correctAnswers,
    timeSpent: results.timeSpent,
    passed: results.passed,
    masteryGained: results.masteryGained,
    completedAt: new Date()
  })

  await testResult.save()
}

const updateCourseProgressAfterTest = async (userId: string, courseId: string, results: any) => {
  // Update user progress after passing course test
  const userProgress = await UserProgress.findOne({ userId, courseId })
  
  if (userProgress) {
    userProgress.overallProgress = Math.min(100, userProgress.overallProgress + results.masteryGained)
    userProgress.lastAccessedAt = new Date()
    
    if (userProgress.overallProgress >= 100) {
      userProgress.status = 'completed'
    }
    
    await userProgress.save()
  }
}

const shuffleArray = (array: any[]) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default router; 