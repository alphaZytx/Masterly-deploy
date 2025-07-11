import express from "express";
import { LearningPathController } from "../controllers/learningPathController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

// Enable authentication for all learning path routes
router.use(protect);

/**
 * @route POST /api/learning-path/save
 * @desc Save user's learning path
 */
router.post("/save", LearningPathController.createLearningPath);

/**
 * @route GET /api/learning-path/get
 * @desc Get user's saved learning path
 */
router.get("/get", LearningPathController.getLearningPath);

export default router; 