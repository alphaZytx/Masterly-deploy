import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import Course from '../models/courseModel';
import UserProgress from '../models/userProgressModel';
import User, { IUser } from '../models/userModel';
import { authenticateToken, optionalAuth } from '../middlewares/authMiddleware';
import { ICourse } from '../types';

// Extend course object to include user enrollment
interface CourseWithEnrollment extends ICourse {
  userEnrollment?: {
    enrolled: boolean;
    progress: number;
    status: string;
    lastAccessedAt?: Date;
  };
}

const router = Router();

// @route   GET /api/courses
// @desc    Get all courses with filtering and pagination
// @access  Public
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      level, 
      search, 
      sort = "-stats.enrollments", 
      free, 
      featured 
    } = req.query;

    // Build query
    const query: any = { status: { $in: ["published", "coming_soon"] }, isPublic: true };

    if (category && category !== "All Courses") query.category = category;
    if (level && level !== "all") {
      if (level === "beginner") query.level = { $regex: /beginner/i };
      else if (level === "intermediate") query.level = { $regex: /intermediate/i };
      else if (level === "advanced") query.level = { $regex: /advanced/i };
    }
    if (free === "true") query["pricing.type"] = "free";
    if (featured === "true") query.isFeatured = true;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search as string, "i")] } },
        { "instructor.name": { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const courses = await Course.find(query)
      .select("-concepts.topics.content") // Exclude detailed content for list view
      .sort(sort as string)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Course.countDocuments(query);

    // If user is authenticated, get their enrollment status
    let userEnrollments: any[] = [];
    if (req.user) {
      userEnrollments = await UserProgress.find({
        userId: (req.user as IUser)._id,
        courseId: { $in: courses.map((c) => c._id) },
      }).select("courseId overallProgress status");
    }

    // Add enrollment info to courses
    const coursesWithEnrollment: CourseWithEnrollment[] = courses.map((course) => {
      const courseObj = course.toObject() as CourseWithEnrollment;
      const enrollment = userEnrollments.find((e) => e.courseId.toString() === (course._id as any).toString());

      courseObj.userEnrollment = enrollment
        ? {
            enrolled: true,
            progress: enrollment.overallProgress,
            status: enrollment.status,
          }
        : {
            enrolled: false,
            progress: 0,
            status: "not_enrolled",
          };

      return courseObj;
    });

    res.json({
      success: true,
      data: {
        courses: coursesWithEnrollment,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
    });
  }
});

// @route   GET /api/courses/categories
// @desc    Get all course categories with counts
// @access  Public
router.get("/categories", async (req: Request, res: Response) => {
  try {
    const categories = await Course.aggregate([
      { $match: { status: { $in: ["published", "coming_soon"] }, isPublic: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          subcategories: { $addToSet: "$subcategory" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Add "All Courses" category
    const totalCourses = await Course.countDocuments({
      status: { $in: ["published", "coming_soon"] },
      isPublic: true,
    });

    const categoriesWithAll = [{ _id: "All Courses", count: totalCourses, subcategories: [] }, ...categories];

    res.json({
      success: true,
      data: { categories: categoriesWithAll },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
});

// @route   GET /api/courses/:slug
// @desc    Get single course by slug
// @access  Public
router.get("/:slug", optionalAuth, async (req: Request, res: Response) => {
  try {
    const course = await Course.findOne({
      slug: req.params.slug,
      status: { $in: ["published", "coming_soon"] },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Increment view count
    course.stats.views += 1;
    await course.save();

    // If user is authenticated, get their progress
    let userProgress = null;
    if (req.user) {
      userProgress = await UserProgress.findOne({
        userId: (req.user as IUser)._id,
        courseId: course._id,
      });
    }

    const courseObj = course.toObject() as CourseWithEnrollment;
    courseObj.userEnrollment = userProgress
      ? {
          enrolled: true,
          progress: userProgress.overallProgress,
          status: userProgress.status,
          lastAccessedAt: userProgress.lastAccessedAt,
        }
      : {
          enrolled: false,
          progress: 0,
          status: "not_enrolled",
        };

    res.json({
      success: true,
      data: {
        course: courseObj,
        userProgress,
      },
    });
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course",
    });
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private
router.post("/:id/enroll", authenticateToken, async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;
    const userId = (req.user as IUser)._id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if course is published
    if (course.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "Course is not available for enrollment",
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = await UserProgress.findOne({
      userId,
      courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    // Create enrollment
    const userProgress = new UserProgress({
      userId,
      courseId,
      enrolledAt: new Date(),
      lastAccessedAt: new Date(),
    });

    await userProgress.save();

    // Update course enrollment count
    course.stats.enrollments += 1;
    await course.save();

    // Update user enrollments
    const user = await User.findById(userId);
    if (user) {
      user.enrollments.push({
        courseId: course._id as any,
        enrolledAt: new Date(),
        progress: 0,
        certificateIssued: false,
      });
      user.stats.coursesEnrolled += 1;
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: "Successfully enrolled in course",
      data: {
        enrollment: userProgress,
      },
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to enroll in course",
    });
  }
});

// @route   GET /api/courses/:id/progress
// @desc    Get user's progress in a course
// @access  Private
router.get("/:id/progress", authenticateToken, async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;
    const userId = (req.user as IUser)._id;

    const userProgress = await UserProgress.findOne({
      userId,
      courseId,
    }).populate("courseId");

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: "No progress found for this course",
      });
    }

    res.json({
      success: true,
      data: {
        progress: userProgress,
      },
    });
  } catch (error) {
    console.error("Get progress error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch progress",
    });
  }
});

// @route   PUT /api/courses/:id/progress
// @desc    Update user's progress in a course
// @access  Private
router.put("/:id/progress", authenticateToken, async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;
    const userId = (req.user as IUser)._id;
    const { conceptId, topicId, timeSpent, status } = req.body;

    let userProgress = await UserProgress.findOne({
      userId,
      courseId,
    });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: "No progress found for this course",
      });
    }

    // Update concept progress if conceptId is provided
    if (conceptId) {
      let concept = userProgress.concepts.find(
        (c) => c.conceptId.toString() === conceptId
      );

      if (!concept) {
        concept = {
          conceptId,
          status: "not-started",
          progress: 0,
          timeSpent: 0,
          lastAccessedAt: new Date(),
          topics: [],
          assessments: [],
        };
        userProgress.concepts.push(concept);
      }

      // Update topic progress if topicId is provided
      if (topicId) {
        let topic = concept.topics.find(
          (t) => t.topicId.toString() === topicId
        );

        if (!topic) {
          topic = {
            topicId,
            status: "not-started",
            timeSpent: 0,
            attempts: 0,
            lastAccessedAt: new Date(),
            activityData: {},
          };
          concept.topics.push(topic);
        }

        if (status) topic.status = status;
        if (timeSpent) topic.timeSpent += timeSpent;
        topic.lastAccessedAt = new Date();
      }

      // Update concept progress
      userProgress.updateConceptProgress(conceptId);
    }

    // Update overall time spent
    if (timeSpent) {
      userProgress.addTimeSpent(timeSpent, conceptId, topicId);
    }

    userProgress.lastAccessedAt = new Date();
    await userProgress.save();

    res.json({
      success: true,
      message: "Progress updated successfully",
      data: {
        progress: userProgress,
      },
    });
  } catch (error) {
    console.error("Update progress error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update progress",
    });
  }
});

// @route   GET /api/courses/:id/past-learning
// @desc    Get user's past learning (completed concepts) with test scores
// @access  Private
router.get("/:id/past-learning", authenticateToken, async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;
    const userId = (req.user as IUser)._id;

    // Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Get user progress
    const userProgress = await UserProgress.findOne({
      userId,
      courseId,
    });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: "No progress found for this course",
      });
    }

    // Get all concepts from course
    const allConcepts = course.concepts || [];
    
    // Filter completed concepts and add test scores
    const completedConcepts = allConcepts
      .map((concept: any) => {
        const conceptProgress = userProgress.concepts.find(
          (c: any) => c.conceptId.toString() === (concept.conceptId || concept._id).toString()
        );
        
        if (conceptProgress && conceptProgress.status === 'completed') {
          return {
            _id: concept.conceptId || concept._id,
            title: concept.title,
            description: concept.description,
            complexity: concept.difficulty === 'Easy' ? 1 : concept.difficulty === 'Medium' ? 3 : 5,
            estLearningTimeHours: concept.estimatedTime ? parseFloat(concept.estimatedTime) : 1,
            masteryScore: conceptProgress.masteryScore || 0,
            finalTestScore: conceptProgress.finalTestScore || null,
            completedAt: conceptProgress.lastAccessedAt,
            timeSpent: conceptProgress.timeSpent || 0,
            attempts: conceptProgress.attempts || 0
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    res.json({
      success: true,
      data: {
        completedConcepts,
        totalCompleted: completedConcepts.length,
        averageScore: completedConcepts.length > 0 
          ? completedConcepts.reduce((sum: number, c: any) => sum + (c.finalTestScore || 0), 0) / completedConcepts.length
          : 0
      },
    });
  } catch (error) {
    console.error("Get past learning error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch past learning",
    });
  }
});

// @route   GET /api/courses/:id/future-paths
// @desc    Get user's future learning paths (remaining concepts)
// @access  Private
router.get("/:id/future-paths", authenticateToken, async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;
    const userId = (req.user as IUser)._id;

    // Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Get user progress
    const userProgress = await UserProgress.findOne({
      userId,
      courseId,
    });

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: "No progress found for this course",
      });
    }

    // Get all concepts from course
    const allConcepts = course.concepts || [];
    
    // Filter remaining concepts
    const remainingConcepts = allConcepts
      .map((concept: any) => {
        const conceptProgress = userProgress.concepts.find(
          (c: any) => c.conceptId.toString() === (concept.conceptId || concept._id).toString()
        );
        
        if (!conceptProgress || conceptProgress.status !== 'completed') {
          const isUnlocked = !conceptProgress || conceptProgress.status === 'in_progress' || 
            (conceptProgress.status === 'not_started' && this.checkPrerequisites(concept, userProgress));
          
          return {
            _id: concept.conceptId || concept._id,
            title: concept.title,
            description: concept.description,
            complexity: concept.difficulty === 'Easy' ? 1 : concept.difficulty === 'Medium' ? 3 : 5,
            estLearningTimeHours: concept.estimatedTime ? parseFloat(concept.estimatedTime) : 1,
            prerequisites: concept.prerequisites || [],
            isUnlocked,
            status: conceptProgress?.status || 'not_started',
            estimatedCompletionTime: this.calculateEstimatedCompletionTime(concept, userProgress)
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        // Sort by unlock status first, then by complexity
        if (a.isUnlocked !== b.isUnlocked) {
          return a.isUnlocked ? -1 : 1;
        }
        return a.complexity - b.complexity;
      });

    res.json({
      success: true,
      data: {
        remainingConcepts,
        totalRemaining: remainingConcepts.length,
        unlockedCount: remainingConcepts.filter((c: any) => c.isUnlocked).length,
        estimatedTotalTime: remainingConcepts.reduce((sum: number, c: any) => sum + c.estLearningTimeHours, 0)
      },
    });
  } catch (error) {
    console.error("Get future paths error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch future paths",
    });
  }
});

// Helper function to check prerequisites
const checkPrerequisites = (concept: any, userProgress: any) => {
  if (!concept.prerequisites || concept.prerequisites.length === 0) {
    return true;
  }
  
  return concept.prerequisites.every((prereqId: string) => {
    const prereqProgress = userProgress.concepts.find(
      (c: any) => c.conceptId.toString() === prereqId
    );
    return prereqProgress && prereqProgress.status === 'completed';
  });
};

// Helper function to calculate estimated completion time
const calculateEstimatedCompletionTime = (concept: any, userProgress: any) => {
  const baseTime = concept.estimatedTime ? parseFloat(concept.estimatedTime) : 1;
  const userAvgTime = userProgress.concepts.length > 0 
    ? userProgress.concepts.reduce((sum: number, c: any) => sum + (c.timeSpent || 0), 0) / userProgress.concepts.length
    : baseTime;
  
  return Math.max(baseTime, userAvgTime);
};

// @route   POST /api/courses/:id/review
// @desc    Add a review to a course
// @access  Private
router.post("/:id/review", authenticateToken, async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;
    const userId = (req.user as IUser)._id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Add review
    await course.addReview(userId as Types.ObjectId, rating, comment);

    res.json({
      success: true,
      message: "Review added successfully",
      data: {
        course,
      },
    });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add review",
    });
  }
});

// Course Test Routes
// @route   GET /api/courses/:courseId/test-questions
// @desc    Get course test questions
// @access  Private (enrolled users only)
router.get("/:courseId/test-questions", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const userId = (req.user as IUser)._id;

    // Check if user is enrolled in the course
    const enrollment = await UserProgress.findOne({
      userId,
      courseId,
      status: { $in: ['enrolled', 'in_progress', 'completed'] }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to take the test'
      });
    }

    // Get course with concepts
    const course = await Course.findById(courseId).populate({
      path: 'topics.concepts',
      model: 'Concept'
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Generate test questions from course concepts
    const questions = await generateCourseTestQuestions(course, 'course_test');

    res.json({
      success: true,
      data: {
        questions,
        timeLimit: 3600, // 1 hour for course test
        totalQuestions: questions.length
      }
    });
  } catch (error) {
    console.error('Error getting course test questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test questions'
    });
  }
});

// @route   GET /api/courses/:courseId/mock-test-questions
// @desc    Get course mock test questions
// @access  Private (enrolled users only)
router.get("/:courseId/mock-test-questions", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const userId = (req.user as IUser)._id;

    // Check if user is enrolled in the course
    const enrollment = await UserProgress.findOne({
      userId,
      courseId,
      status: { $in: ['enrolled', 'in_progress', 'completed'] }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to take the mock test'
      });
    }

    // Get course with concepts
    const course = await Course.findById(courseId).populate({
      path: 'topics.concepts',
      model: 'Concept'
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Generate mock test questions from course concepts
    const questions = await generateCourseTestQuestions(course, 'mock_test');

    res.json({
      success: true,
      data: {
        questions,
        timeLimit: 7200, // 2 hours for mock test
        totalQuestions: questions.length
      }
    });
  } catch (error) {
    console.error('Error getting course mock test questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mock test questions'
    });
  }
});

// @route   POST /api/courses/:courseId/submit-test
// @desc    Submit course test results
// @access  Private (enrolled users only)
router.post("/:courseId/submit-test", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { answers, timeSpent, testType = 'course_test' } = req.body;
    const userId = (req.user as IUser)._id;

    // Check if user is enrolled in the course
    const enrollment = await UserProgress.findOne({
      userId,
      courseId,
      status: { $in: ['enrolled', 'in_progress', 'completed'] }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to submit test results'
      });
    }

    // Get course with concepts to validate answers
    const course = await Course.findById(courseId).populate({
      path: 'topics.concepts',
      model: 'Concept'
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Calculate test results
    const results = await calculateTestResults(course, answers, timeSpent, testType);

    // Save test results
    await saveTestResults(userId, courseId, results, testType);

    // Update user progress if test is passed
    if (results.passed && testType === 'course_test') {
      await updateCourseProgressAfterTest(userId, courseId, results);
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error submitting course test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit test results'
    });
  }
});



// @route   POST /api/learning/concepts/:conceptId/progress
// @desc    Update concept progress (mark as read, video watched, etc.)
// @access  Private
router.post("/:conceptId/progress", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { conceptId } = req.params;
    const { action, courseId, watchTime } = req.body;
    const userId = (req.user as IUser)._id;

    // Check if user is enrolled in the course
    const enrollment = await UserProgress.findOne({
      userId,
      courseId,
      status: { $in: ['enrolled', 'in_progress', 'completed'] }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to update progress'
      });
    }

    // Get or create concept progress
    let conceptProgress = await UserConceptProgress.findOne({
      userId,
      conceptId,
      courseId
    });

    if (!conceptProgress) {
      conceptProgress = new UserConceptProgress({
        userId,
        conceptId,
        courseId,
        status: 'not_started',
        masteryScore: 0,
        timeSpent: 0,
        attempts: 0,
        descriptionRead: false,
        videoWatched: false,
        quizPassed: false
      });
    }

    // Update based on action
    switch (action) {
      case 'mark_description_read':
        conceptProgress.descriptionRead = true;
        if (conceptProgress.status === 'not_started') {
          conceptProgress.status = 'in_progress';
        }
        break;

      case 'mark_video_watched':
        conceptProgress.videoWatched = true;
        if (watchTime) {
          conceptProgress.timeSpent += watchTime;
        }
        break;

      case 'quiz_completed':
        conceptProgress.quizPassed = true;
        conceptProgress.attempts += 1;
        if (conceptProgress.masteryScore >= 75) {
          conceptProgress.status = 'completed';
        }
        break;

      case 'quiz_failed':
        conceptProgress.attempts += 1;
        // Reset progress if too many failed attempts (anti-cheating)
        if (conceptProgress.attempts >= 3) {
          conceptProgress.descriptionRead = false;
          conceptProgress.videoWatched = false;
          conceptProgress.quizPassed = false;
          conceptProgress.status = 'in_progress';
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    await conceptProgress.save();

    // Update overall course progress
    await updateCourseProgress(userId, courseId);

    res.json({
      success: true,
      data: conceptProgress
    });
  } catch (error) {
    console.error('Error updating concept progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
});

// Helper functions for test generation and evaluation
const generateCourseTestQuestions = async (course: any, testType: string) => {
  const questions = [];
  const allConcepts = [];

  // Collect all concepts from course topics
  for (const topic of course.topics) {
    if (topic.concepts && Array.isArray(topic.concepts)) {
      allConcepts.push(...topic.concepts);
    }
  }

  // Generate questions based on test type
  if (testType === 'course_test') {
    // Course test: 20-30 questions covering all concepts
    const numQuestions = Math.min(25, allConcepts.length * 2);
    const selectedConcepts = shuffleArray(allConcepts).slice(0, numQuestions);
    
    for (const concept of selectedConcepts) {
      const conceptQuestions = await generateConceptQuestions(concept, 1);
      questions.push(...conceptQuestions);
    }
  } else if (testType === 'mock_test') {
    // Mock test: 40-50 questions for comprehensive practice
    const numQuestions = Math.min(45, allConcepts.length * 3);
    const selectedConcepts = shuffleArray(allConcepts).slice(0, numQuestions);
    
    for (const concept of selectedConcepts) {
      const conceptQuestions = await generateConceptQuestions(concept, 2);
      questions.push(...conceptQuestions);
    }
  }

  return shuffleArray(questions);
};

const generateConceptQuestions = async (concept: any, numQuestions: number) => {
  // This is a simplified question generation
  // In a real implementation, you would have a question bank or use AI to generate questions
  const questions = [];
  
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
  ];

  for (let i = 0; i < Math.min(numQuestions, questionTemplates.length); i++) {
    const template = questionTemplates[i];
    questions.push({
      _id: `${concept._id}_q${i}`,
      question: template.question,
      options: template.options,
      correctAnswer: template.correctAnswer,
      explanation: `This question tests your understanding of ${concept.title}.`,
      difficulty: template.difficulty,
      conceptId: concept._id
    });
  }

  return questions;
};

const calculateTestResults = async (course: any, answers: any, timeSpent: number, testType: string) => {
  const questions = await generateCourseTestQuestions(course, testType);
  let correctAnswers = 0;
  let totalQuestions = 0;

  for (const question of questions) {
    if (answers[question._id] !== undefined) {
      totalQuestions++;
      if (answers[question._id] === question.correctAnswer) {
        correctAnswers++;
      }
    }
  }

  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const passed = score >= 70; // 70% passing threshold
  const masteryGained = passed ? Math.max(5, Math.min(15, score - 60)) : 0;

  return {
    score,
    totalQuestions,
    correctAnswers,
    timeSpent,
    passed,
    masteryGained,
    testType
  };
};

const saveTestResults = async (userId: string, courseId: string, results: any, testType: string) => {
  // Import Assessment model
  const Assessment = require('../models/assessmentModel').default;
  
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
  });

  await testResult.save();
};

const updateCourseProgressAfterTest = async (userId: string, courseId: string, results: any) => {
  // Update user progress after passing course test
  const userProgress = await UserProgress.findOne({ userId, courseId });
  
  if (userProgress) {
    userProgress.overallProgress = Math.min(100, userProgress.overallProgress + results.masteryGained);
    userProgress.lastAccessedAt = new Date();
    
    if (userProgress.overallProgress >= 100) {
      userProgress.status = 'completed';
    }
    
    await userProgress.save();
  }
};

const shuffleArray = (array: any[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to build sequential concepts with prerequisites
const buildSequentialConcepts = async (course: any, progressMap: Map<string, any>, userId: string) => {
  const allConcepts = [];
  
  // Collect all concepts from course topics
  for (const topic of course.topics) {
    if (topic.concepts && Array.isArray(topic.concepts)) {
      allConcepts.push(...topic.concepts);
    }
  }

  // Sort concepts by prerequisites (topological sort)
  const sortedConcepts = [];
  const visited = new Set();
  const visiting = new Set();

  const visit = (concept: any) => {
    if (visiting.has(concept._id.toString())) {
      // Circular dependency detected
      return;
    }
    
    if (visited.has(concept._id.toString())) {
      return;
    }

    visiting.add(concept._id.toString());

    // Visit prerequisites first
    if (concept.prerequisites && Array.isArray(concept.prerequisites)) {
      for (const prereqId of concept.prerequisites) {
        const prereq = allConcepts.find(c => c._id.toString() === prereqId.toString());
        if (prereq) {
          visit(prereq);
        }
      }
    }

    visiting.delete(concept._id.toString());
    visited.add(concept._id.toString());

    // Get user progress for this concept
    const userProgress = progressMap.get(concept._id.toString());
    
    // Determine if concept is unlocked
    let isUnlocked = true;
    if (concept.prerequisites && Array.isArray(concept.prerequisites)) {
      for (const prereqId of concept.prerequisites) {
        const prereqProgress = progressMap.get(prereqId.toString());
        if (!prereqProgress || prereqProgress.status !== 'completed') {
          isUnlocked = false;
          break;
        }
      }
    }

    sortedConcepts.push({
      _id: concept._id,
      title: concept.title,
      description: concept.description,
      complexity: concept.complexity,
      estLearningTimeHours: concept.estLearningTimeHours,
      masteryScore: userProgress?.masteryScore || 0,
      status: userProgress?.status || 'not_started',
      mastered: userProgress?.masteryScore >= 75,
      timeSpent: userProgress?.timeSpent || 0,
      attempts: userProgress?.attempts || 0,
      isUnlocked,
      prerequisites: concept.prerequisites || [],
      content: {
        description: concept.description,
        videoUrl: concept.videoUrl,
        articleUrl: concept.articleUrl
      }
    });
  };

  // Visit all concepts
  for (const concept of allConcepts) {
    if (!visited.has(concept._id.toString())) {
      visit(concept);
    }
  }

  return sortedConcepts;
};

// Helper function to update overall course progress
const updateCourseProgress = async (userId: string, courseId: string) => {
  const conceptProgresses = await UserConceptProgress.find({
    userId,
    courseId
  });

  const totalConcepts = conceptProgresses.length;
  const completedConcepts = conceptProgresses.filter(cp => cp.status === 'completed').length;
  const overallProgress = totalConcepts > 0 ? Math.round((completedConcepts / totalConcepts) * 100) : 0;

  await UserProgress.findOneAndUpdate(
    { userId, courseId },
    {
      overallProgress,
      conceptsCompleted: completedConcepts,
      lastAccessedAt: new Date()
    },
    { upsert: true }
  );
};

export default router; 