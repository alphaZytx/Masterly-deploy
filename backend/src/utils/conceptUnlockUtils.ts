import Concept from '../models/conceptModel';
import UserConceptProgress from '../models/userConceptProgress';
import mongoose from 'mongoose';

/**
 * Mark a concept as mastered for a user, update mastery score, and unlock dependent concepts if all prerequisites are mastered.
 */
export async function updateMasteryAndGetUnlocks(userId: string, conceptId: string, score: number, courseId?: string) {
  // Find or create user progress doc for this specific concept
  let userProgress = await UserConceptProgress.findOne({ userId, conceptId });
  if (!userProgress) {
    userProgress = new UserConceptProgress({ 
      userId, 
      conceptId,
      courseId: courseId || new mongoose.Types.ObjectId(), // Use provided courseId or create a default one
      status: 'not_started',
      masteryScore: 0,
      timeSpent: 0,
      attempts: 0,
      descriptionRead: false,
      videoWatched: false,
      quizPassed: false
    });
  }
  
  // Update mastery score
  userProgress.masteryScore = Math.max(userProgress.masteryScore, score);
  userProgress.attempts += 1;
  userProgress.lastUpdated = new Date();
  
  if (score >= 75) {
    userProgress.mastered = true;
    userProgress.masteredAt = new Date();
    userProgress.status = 'completed';
  } else if (userProgress.status === 'not_started') {
    userProgress.status = 'in_progress';
  }
  
  await userProgress.save();

  // Unlock dependent concepts and update DB
  const unlockedConcepts = await unlockDependentConceptsAndUpdate(userId, courseId);
  return { mastered: userProgress.mastered, unlockedConcepts };
}

/**
 * Unlock all concepts for which all prerequisites are mastered by the user.
 * For each newly unlocked concept, ensure a progress entry exists in UserConceptProgress.
 */
export async function unlockDependentConceptsAndUpdate(userId: string, courseId?: string) {
  // Get all concepts
  const allConcepts = await Concept.find({});
  
  // Get all user progress records
  const userProgresses = await UserConceptProgress.find({ userId });
  
  const masteredSet = new Set(
    userProgresses
      .filter((c: any) => c.mastered)
      .map((c: any) => c.conceptId.toString())
  );
  
  let unlocked: string[] = [];
  
  for (const concept of allConcepts) {
    const conceptIdStr = concept._id.toString();
    
    if (!concept.prerequisites || concept.prerequisites.length === 0) {
      unlocked.push(conceptIdStr);
      // Ensure progress entry exists
      const existingProgress = userProgresses.find((c: any) => c.conceptId.toString() === conceptIdStr);
      if (!existingProgress) {
        const newProgress = new UserConceptProgress({
          userId,
          conceptId: concept._id,
          courseId: courseId || new mongoose.Types.ObjectId(), // Use provided courseId or create a default one
          status: 'not_started',
          masteryScore: 0,
          timeSpent: 0,
          attempts: 0,
          descriptionRead: false,
          videoWatched: false,
          quizPassed: false
        });
        await newProgress.save();
      }
      continue;
    }
    
    const allMastered = concept.prerequisites.every((prereqId: any) => masteredSet.has(prereqId.toString()));
    if (allMastered) {
      unlocked.push(conceptIdStr);
      // Ensure progress entry exists
      const existingProgress = userProgresses.find((c: any) => c.conceptId.toString() === conceptIdStr);
      if (!existingProgress) {
        const newProgress = new UserConceptProgress({
          userId,
          conceptId: concept._id,
          courseId: courseId || new mongoose.Types.ObjectId(), // Use provided courseId or create a default one
          status: 'not_started',
          masteryScore: 0,
          timeSpent: 0,
          attempts: 0,
          descriptionRead: false,
          videoWatched: false,
          quizPassed: false
        });
        await newProgress.save();
      }
    }
  }
  
  return unlocked;
}

/**
 * Get all unlocked concepts for a user (for learning path display)
 */
export async function getUnlockedConcepts(userId: string, courseId?: string) {
  return unlockDependentConceptsAndUpdate(userId, courseId);
} 