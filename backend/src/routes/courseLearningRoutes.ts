import express from 'express';
import courseLearningController from '../controllers/courseLearningController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Course enrollment
router.post('/courses/:courseId/enroll', courseLearningController.enrollInCourse);

// Course learning dashboard
router.get('/courses/:courseId/dashboard', courseLearningController.getCourseDashboard);

// Concept learning page
router.get('/courses/:courseId/concepts/:conceptId', courseLearningController.getConceptLearningPage);

// Get concept progress
router.get('/concepts/:conceptId/progress', courseLearningController.getConceptProgress);

// Update concept progress
router.post('/concepts/:conceptId/progress', courseLearningController.updateConceptProgress);

// Submit quiz results
router.post('/concepts/:conceptId/quiz', courseLearningController.submitQuizResults);

// Sequential learning route - use controller method
router.get('/courses/:courseId/sequential', courseLearningController.getCourseLearning);

// Reset concept progress for a user
router.post('/concepts/:conceptId/reset-progress', courseLearningController.resetConceptProgress);

export default router; 