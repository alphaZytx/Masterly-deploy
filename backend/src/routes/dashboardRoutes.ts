import { Router } from 'express';
import DashboardController from '../controllers/dashboardController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// @route   GET /api/dashboard
// @desc    Get comprehensive dashboard data for authenticated user
// @access  Private
router.get('/', authenticateToken, DashboardController.getDashboardData);

// @route   GET /api/dashboard/summary
// @desc    Get learning summary for authenticated user
// @access  Private
router.get('/summary', authenticateToken, DashboardController.getLearningSummary);

export default router; 