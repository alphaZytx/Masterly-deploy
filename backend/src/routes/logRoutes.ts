import express from 'express';
import { getSystemLogs, getLogStats, clearOldLogs, exportLogs } from '../controllers/logController';
import { protectAdmin } from '../middlewares/authMiddleware';

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

// Get system logs with filtering and pagination
router.get('/', getSystemLogs);

// Get log statistics
router.get('/stats', getLogStats);

// Clear old logs
router.delete('/clear', clearOldLogs);

// Export logs
router.get('/export', exportLogs);

export default router; 