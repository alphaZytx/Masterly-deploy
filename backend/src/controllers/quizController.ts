import { Request, Response } from 'express';
import Concept from '../models/conceptModel';
import User from '../models/userModel';
import UserConceptProgress from "../models/userConceptProgress";
import { HydratedDocument } from "mongoose";
import { updateMasteryAndGetUnlocks } from '../utils/conceptUnlockUtils';

/**
 * @desc    Fetches a quiz for a concept, removing answers before sending to the client.
 * @route   GET /api/quizzes/:conceptId
 * @access  Private
 */
export const getQuizForConcept = async (req: Request, res: Response) => {
    try {
        const concept = await Concept.findById(req.params.conceptId).select('quiz');

        if (!concept || !concept.quiz || concept.quiz.questions.length === 0) {
            return res.status(404).json({ message: 'Quiz not found for this concept.' });
        }

        // IMPORTANT: We must remove the correct answers before sending the quiz.
        const sanitizedQuiz = concept.quiz.questions.map((q: any) => ({
            questionText: q.questionText,
            options: q.options,
            _id: (q as any)._id, // Useful for the frontend to key on
        }));

        res.status(200).json(sanitizedQuiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Grades a quiz submission and updates the user's learning profile.
 * @route   POST /api/quizzes/submit/:conceptId
 * @access  Private
 */
// export const submitQuiz = async (req: Request, res: Response) => {
//     try {
//         const { conceptId } = req.params;
//         const { answers } = req.body; // Expects an array of chosen answer indexes, e.g., [0, 2, 1]

//         const concept = await Concept.findById(conceptId).select('quiz');
//         if (!concept || !concept.quiz) {
//             return res.status(404).json({ message: 'Concept not found.' });
//         }

//         // --- Grade the submission ---
//         let correctCount = 0;
//         const results = concept.quiz.map((question, index) => {
//             const isCorrect = question.correctAnswerIndex === answers[index];
//             if (isCorrect) correctCount++;
//             return {
//                 questionText: question.questionText,
//                 yourAnswerIndex: answers[index],
//                 correctAnswerIndex: question.correctAnswerIndex,
//                 isCorrect,
//             };
//         });

//         const score = correctCount / concept.quiz.length;

//         // --- Update user's learning profile ---
//         const user = await User.findById((req.user as any)?._id);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found.' });
//         }

//         const profileEntryIndex = user.learningProfile.findIndex(
//             item => item.concept.toString() === conceptId
//         );
        
//         const newAttempt = {
//             score: score,
//             submittedAnswers: answers,
//             attemptedAt: new Date(),
//         };

//         if (profileEntryIndex > -1) {
//             // User has attempted this concept before, add a new attempt
//             const entry = user.learningProfile[profileEntryIndex];
//             entry.quizAttempts.push(newAttempt);
//             // Update masteryLevel to be the highest score they've achieved
//             entry.masteryLevel = Math.max(entry.masteryLevel, score);
//         } else {
//             // This is the user's first attempt for this concept
//             user.learningProfile.push({
//                 concept: concept._id,
//                 masteryLevel: score,
//                 quizAttempts: [newAttempt],
//             });
//         }
//         await user.save();

//         res.status(200).json({ score, correctCount, totalQuestions: concept.quiz.length, results });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };


// --For Quiz Recommendation and Mastery Tracking-- 
// Interface for request body
interface SubmitQuizRequestBody {
  conceptId: string;
  score: number; // 0–100
}

export const submitQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get authenticated user from middleware
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Cast to any to access Mongoose document properties
    const user = req.user as any;
    const authenticatedUserId = user._id?.toString();
    if (!authenticatedUserId) {
      res.status(401).json({ error: "Invalid user ID" });
      return;
    }

    const { conceptId } = req.params; // Get from URL parameter
    const { score }: { score: number } = req.body; // Get score from request body

    if (!conceptId || typeof score !== "number") {
      res.status(400).json({ error: "Missing or invalid parameters" });
      return;
    }

    console.log("Quiz submission:", { 
      authenticatedUserId, 
      conceptId, 
      score 
    });

    const masteryIncrement = Math.min(score / 100, 1); // Normalize score to 0–1

    // Find the user's progress document
    let userProgress = await UserConceptProgress.findOne({ userId: authenticatedUserId });

    if (!userProgress) {
      // No progress doc for user, create new
      userProgress = new UserConceptProgress({
        userId: authenticatedUserId,
        concepts: [{
          conceptId,
          score: masteryIncrement,
          attempts: 1,
          lastUpdated: new Date(),
          mastered: masteryIncrement >= 0.7,
          masteredAt: masteryIncrement >= 0.7 ? new Date() : undefined,
        }],
      });
      await userProgress.save();
      console.log("Created new user progress document for user:", authenticatedUserId);
      res.status(200).json({ message: "Quiz submitted and mastery updated (new user progress)." });
      return;
    }

    // Find concept entry in user's progress
    const conceptEntry = (userProgress as any).concepts.find((c: any) => c.conceptId.toString() === conceptId);
    const MASTERY_THRESHOLD = 0.7;
    
    // --- Achievement logic ---
    const achievements: string[] = [];
    const previousScore = conceptEntry ? conceptEntry.score : 0;
    const attemptCount = conceptEntry ? (conceptEntry.attempts || 0) + 1 : 1;
    // Score is normalized 0-1
    if (masteryIncrement === 1) achievements.push('Perfect Score');
    if (masteryIncrement >= 0.9) achievements.push('Master of Concept');
    if (masteryIncrement >= 0.75 && attemptCount === 1) achievements.push('Fast Learner');
    if (masteryIncrement > previousScore && attemptCount > 1) achievements.push('Improver');
    // (Optional) Add more achievement logic here
    // --- End achievement logic ---

    if (conceptEntry) {
      // Average previous and new score, cap at 1
      conceptEntry.score = Math.min((conceptEntry.score + masteryIncrement) / 2, 1);
      conceptEntry.attempts = (conceptEntry.attempts || 0) + 1;
      conceptEntry.lastUpdated = new Date();
      // Mastery logic
      if (conceptEntry.score >= MASTERY_THRESHOLD) {
        if (!conceptEntry.mastered) {
          conceptEntry.mastered = true;
          conceptEntry.masteredAt = new Date();
        }
      } else {
        conceptEntry.mastered = false;
        if (conceptEntry.masteredAt) delete conceptEntry.masteredAt;
      }
      // Add achievements (avoid duplicates)
      conceptEntry.achievements = Array.from(new Set([...(conceptEntry.achievements || []), ...achievements]));
    } else {
      // Add new concept progress
      const newConcept: any = {
        conceptId,
        score: masteryIncrement,
        attempts: 1,
        lastUpdated: new Date(),
        mastered: masteryIncrement >= MASTERY_THRESHOLD,
        masteredAt: masteryIncrement >= MASTERY_THRESHOLD ? new Date() : undefined,
        achievements,
      };
      (userProgress as any).concepts.push(newConcept);
    }
    
    await userProgress.save();
    console.log("Updated user progress for user:", authenticatedUserId);

    // --- Unlock logic: call updateMasteryAndGetUnlocks and get newly unlocked concept IDs ---
    const unlockResult = await updateMasteryAndGetUnlocks(authenticatedUserId, conceptId, masteryIncrement);
    const unlockedIds = unlockResult.unlockedConcepts || [];
    // Get titles for newly unlocked concepts
    const unlockedConcepts = await Concept.find({ _id: { $in: unlockedIds } }).select('title');
    const unlockedTitles = unlockedConcepts.map(c => c.title);

    res.status(200).json({ message: "Quiz submitted and mastery updated.", achievements, newlyUnlockedConcepts: unlockedTitles });
  } catch (error: any) {
    console.error("Error submitting quiz:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

