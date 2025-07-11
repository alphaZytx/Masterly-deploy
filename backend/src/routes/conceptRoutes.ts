import { Router } from 'express';
import {
    getAllConcepts,
    getConceptById,
    searchConcepts,
    testConcepts,
    getConceptQuiz,
    testQuiz
} from '../controllers/conceptController';
import { protect } from '../middlewares/authMiddleware';
import { Request, Response } from 'express';
import { User } from '../models/userModel';

const router = Router();

// Test endpoint (public)
router.get('/test', testConcepts);

// Test quiz endpoint (public)
router.get('/test-quiz', testQuiz);

// Public route to get concept content (for learning)
router.get('/content/:id', getConceptById);

// Test endpoint to get test user ID
router.get('/test-user', async (req: Request, res: Response) => {
  try {
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (testUser) {
      res.json({ 
        userId: testUser._id,
        message: 'Test user found',
        user: {
          _id: testUser._id,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          email: testUser.email
        }
      });
    } else {
      res.status(404).json({ message: 'Test user not found. Run the test setup script first.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// All other concept routes are protected
router.use(protect);

router.get('/', getAllConcepts);
router.get('/search', searchConcepts);
router.get('/:id', getConceptById);
router.get('/:id/quiz', getConceptQuiz);

export default router;