import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Course from '../models/courseModel';
import Concept from '../models/conceptModel';
import UserProgress from '../models/userProgressModel';
import UserConceptProgress from '../models/userConceptProgress';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export class CourseLearningController {
  // Helper method to find course by ID or slug
  private findCourse = async (courseId: string) => {
    // Check if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(courseId)) {
      return await Course.findById(courseId);
    } else {
      // Try to find by slug
      return await Course.findOne({ slug: courseId });
    }
  }

  // Helper method to get all concepts from course topics
  private getAllConceptsFromCourse = (course: any) => {
    // If new schema: flat concepts array
    if (Array.isArray(course.concepts)) {
      return course.concepts;
    }
    // If old schema: topics with concepts
    if (Array.isArray(course.topics)) {
    const allConcepts: any[] = [];
      course.topics?.forEach((topic: any) => {
      if (topic.concepts && topic.concepts.length > 0) {
        allConcepts.push(...topic.concepts);
      }
      if (topic.conceptReferences && topic.conceptReferences.length > 0) {
        topic.conceptReferences.forEach((ref: any) => {
          allConcepts.push({
            _id: ref.conceptId,
            title: ref.customTitle || 'Referenced Concept',
            description: ref.customDescription || '',
            order: ref.order,
            estimatedTime: ref.estimatedTime,
            difficulty: ref.difficulty,
            isReferenced: true
          });
        });
      }
    });
    return allConcepts;
    }
    // If neither, return empty array
    return [];
  }

  // Enroll user in a course
  enrollInCourse = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // Find course by ID or slug
      const course = await this.findCourse(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      // Get total concepts count
      const allConcepts = this.getAllConceptsFromCourse(course);

      // Check if already enrolled - use the actual course ID, not the slug
      let userProgress = await UserProgress.findOne({ userId, courseId: course._id });
      if (userProgress && userProgress.status !== 'not_enrolled') {
        return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
      }

      // Create or update user progress - use the actual course ID
      if (!userProgress) {
        userProgress = new UserProgress({
          userId,
          courseId: course._id,
          totalConcepts: allConcepts.length,
          status: 'enrolled'
        });
      } else {
        userProgress.status = 'enrolled';
        userProgress.enrolledAt = new Date();
      }

      await userProgress.save();

      res.json({
        success: true,
        message: 'Successfully enrolled in course',
        data: { userProgress }
      });
    } catch (error) {
      console.error('Enroll in course error:', error);
      res.status(500).json({ success: false, message: 'Failed to enroll in course' });
    }
  }

  // Get course learning dashboard with user progress
  getCourseDashboard = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // Find course by ID or slug
      const course = await this.findCourse(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      // Get user progress - use the actual course ID, not the slug
      let userProgress = await UserProgress.findOne({ userId, courseId: course._id });
      if (!userProgress) {
        const allConcepts = this.getAllConceptsFromCourse(course);
        userProgress = new UserProgress({
          userId,
          courseId: course._id,
          totalConcepts: allConcepts.length,
          status: 'not_enrolled'
        });
        await userProgress.save();
      }

      // Get concept progress for all concepts in this course - use the actual course ID
      const conceptProgresses = await UserConceptProgress.find({ 
        userId, 
        courseId: course._id 
      });

      // Get all concepts from the course (new schema)
      const allConcepts: any[] = this.getAllConceptsFromCourse(course);

      // Map concepts with progress
      const conceptsWithProgress = allConcepts.map((concept: any) => {
          const progress = conceptProgresses.find((cp: any) => 
          cp.conceptId.toString() === (concept._id?.toString?.() || concept.conceptId?.toString?.())
          );
          return {
          _id: concept._id || concept.conceptId,
            title: concept.title,
            description: concept.description,
            complexity: concept.difficulty === 'Easy' ? 1 : concept.difficulty === 'Medium' ? 3 : 5,
            estLearningTimeHours: this.parseTimeToHours(concept.estimatedTime),
            masteryScore: progress?.masteryScore || 0,
            status: progress?.status || 'not_started',
            mastered: progress?.mastered || false,
            timeSpent: progress?.timeSpent || 0,
            attempts: progress?.attempts || 0,
          isUnlocked: this.isConceptUnlocked(concept, conceptProgresses, allConcepts)
        };
      });

      // Process topics with progress
      // Remove topicsWithProgress and all references to course.topics
      // (No replacement needed, as conceptsWithProgress is already used)

      res.json({
        success: true,
        data: {
          course: {
            _id: course._id,
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail,
            level: course.level,
            estimatedDuration: course.stats?.totalDuration || 0,
            concepts: conceptsWithProgress // Always include the concepts array
          },
          sequentialConcepts: conceptsWithProgress, // Add this for the learning graph
          userProgress: {
            status: userProgress.status,
            overallProgress: userProgress.overallProgress,
            conceptsCompleted: userProgress.conceptsCompleted,
            totalConcepts: userProgress.totalConcepts,
            totalTimeSpent: userProgress.totalTimeSpent,
            enrolledAt: userProgress.enrolledAt,
            lastAccessedAt: userProgress.lastAccessedAt
          }
        }
      });
    } catch (error) {
      console.error('Get course dashboard error:', error);
      res.status(500).json({ success: false, message: 'Failed to get course dashboard' });
    }
  }

  // Get concept learning page
  getConceptLearningPage = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { courseId, conceptId } = req.params;
      const userId = req.user?._id;

      console.log('🔍 Getting concept learning page for:', { courseId, conceptId, userId });

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // Find course by ID or slug
      const course = await this.findCourse(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      // OPTIMIZATION: Only search for the specific current concept
      let currentConceptId = conceptId;
      
      // If no conceptId provided, start with first concept
      if (!currentConceptId) {
        const allConcepts = this.getAllConceptsFromCourse(course);
        if (allConcepts.length > 0) {
          currentConceptId = allConcepts[0].conceptId || allConcepts[0]._id;
        }
      }

      console.log('🎯 Current concept ID:', currentConceptId);

      // Find concept in course concepts to get position
      let courseConcept: any = null;
      let currentIndex = -1;
      const allConcepts: any[] = this.getAllConceptsFromCourse(course);
      allConcepts.forEach((c: any, idx: number) => {
        if ((c._id?.toString?.() || c.conceptId?.toString?.()) === currentConceptId) {
          courseConcept = c;
          currentIndex = idx;
        }
      });

      if (!courseConcept) {
        console.log('❌ Concept not found in course for ID:', currentConceptId);
        return res.status(404).json({ success: false, message: 'Concept not found in this course' });
      }

      // OPTIMIZATION: Fetch full concept data from Concept collection
      // Try multiple lookup strategies since course conceptId might not match Concept collection conceptId
      let fullConcept = await Concept.findOne({ conceptId: currentConceptId });
      
      if (!fullConcept) {
        // Try to find by title from course concept
        const courseConceptTitle = courseConcept.title;
        console.log('🔍 Trying to find concept by title:', courseConceptTitle);
        fullConcept = await Concept.findOne({ title: courseConceptTitle });
      }
      
      if (!fullConcept) {
        // Try to find by _id if currentConceptId is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(currentConceptId)) {
          console.log('🔍 Trying to find concept by _id:', currentConceptId);
          fullConcept = await Concept.findById(currentConceptId);
        }
      }
      
      if (!fullConcept) {
        console.log('❌ Full concept data not found for ID:', currentConceptId);
        console.log('❌ Course concept title:', courseConcept.title);
        console.log('❌ Available concepts in database:');
        const allConcepts = await Concept.find({}).limit(5);
        allConcepts.forEach(c => console.log('  - conceptId:', c.conceptId, 'title:', c.title));
        return res.status(404).json({ success: false, message: 'Concept data not found' });
      }

      console.log('✅ Found full concept:', {
        conceptId: fullConcept.conceptId,
        title: fullConcept.title,
        hasDescription: !!fullConcept.description,
        hasVideoUrl: !!fullConcept.videoUrl,
        hasContent: !!fullConcept.content,
        hasQuiz: !!fullConcept.quiz
      });

      // Get user progress for this concept
      let conceptProgress = await UserConceptProgress.findOne({ 
        userId, 
        conceptId: currentConceptId, 
        courseId: course._id 
      });

      // Check if user has completed this concept
      const isCompleted = conceptProgress?.status === 'completed' || conceptProgress?.mastered === true;
      const canTakeQuiz = isCompleted;

      // Get next and previous concepts
      const nextConcept = currentIndex < allConcepts.length - 1 ? (allConcepts[currentIndex + 1]._id || allConcepts[currentIndex + 1].conceptId) : null;
      const prevConcept = currentIndex > 0 ? (allConcepts[currentIndex - 1]._id || allConcepts[currentIndex - 1].conceptId) : null;

      // Prepare response with proper content structure
      const conceptData = {
        _id: fullConcept._id,
        conceptId: fullConcept.conceptId,
        title: fullConcept.title,
        description: fullConcept.description,
        videoUrl: fullConcept.videoUrl,
        content: {
          intro: fullConcept.content?.intro || '',
          sections: fullConcept.content?.sections || []
        },
        quiz: fullConcept.quiz,
        canTakeQuiz: canTakeQuiz,
        complexity: courseConcept.difficulty === 'Easy' ? 1 : courseConcept.difficulty === 'Medium' ? 3 : 5,
        estLearningTimeHours: this.parseTimeToHours(courseConcept.estimatedTime),
        prerequisites: fullConcept.prerequisites || [],
        tags: fullConcept.tags || []
      };

      console.log('📤 Sending concept data:', {
        hasDescription: !!conceptData.description,
        hasVideoUrl: !!conceptData.videoUrl,
        hasContentIntro: !!conceptData.content.intro,
        sectionsCount: conceptData.content.sections.length,
        hasQuiz: !!conceptData.quiz
      });

      res.json({
        success: true,
        data: {
          concept: conceptData,
          progress: {
            masteryScore: conceptProgress?.masteryScore || 0,
            status: conceptProgress?.status || 'not_started',
            mastered: conceptProgress?.mastered || false,
            timeSpent: conceptProgress?.timeSpent || 0,
            attempts: conceptProgress?.attempts || 0,
            lastUpdated: conceptProgress?.lastUpdated,
            isCompleted,
            canTakeQuiz
          },
          navigation: {
            nextConcept,
            prevConcept,
            currentIndex: currentIndex + 1,
            totalConcepts: allConcepts.length
          }
        }
      });
    } catch (error) {
      console.error('❌ Get concept learning page error:', error);
      res.status(500).json({ success: false, message: 'Failed to get concept learning page' });
    }
  }

  // Update concept progress (video watched, article read, etc.)
  updateConceptProgress = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { conceptId } = req.params;
      const { action, courseId, timeSpent, score } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // Find course by ID or slug to get the actual course ID
      const course = await this.findCourse(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      // Get or create concept progress - use the actual course ID
      let conceptProgress = await UserConceptProgress.findOne({ 
        userId, 
        conceptId, 
        courseId: course._id 
      });

      if (!conceptProgress) {
        conceptProgress = new UserConceptProgress({
          userId,
          conceptId,
          courseId: course._id,
          status: 'not_started',
          masteryScore: 0,
          timeSpent: 0,
          attempts: 0,
          descriptionRead: false,
          videoWatched: false,
          quizPassed: false
        });
      }

      switch (action) {
        case 'mark_description_read':
          conceptProgress.descriptionRead = true;
          if (conceptProgress.status === 'not_started') conceptProgress.status = 'in_progress';
          conceptProgress.lastUpdated = new Date();
          break;
        case 'mark_video_watched':
          conceptProgress.videoWatched = true;
          if (timeSpent) conceptProgress.timeSpent += timeSpent;
          conceptProgress.lastUpdated = new Date();
          break;
        case 'quiz_completed':
          conceptProgress.attempts += 1;
          conceptProgress.lastQuizAttempt = new Date();
          conceptProgress.masteryScore = Math.max(conceptProgress.masteryScore, score);
          if (score >= 75) {
            conceptProgress.quizPassed = true;
            conceptProgress.failedAttempts = 0;
            conceptProgress.mastered = true;
            conceptProgress.masteredAt = new Date();
            conceptProgress.status = 'completed';
          } else {
            conceptProgress.quizPassed = false;
            conceptProgress.failedAttempts = (conceptProgress.failedAttempts || 0) + 1;
            if (conceptProgress.failedAttempts >= 3) {
              conceptProgress.descriptionRead = false;
              conceptProgress.videoWatched = false;
              conceptProgress.quizPassed = false;
              conceptProgress.status = 'in_progress';
            }
          }
          conceptProgress.lastUpdated = new Date();
          break;
        default:
          return res.status(400).json({ success: false, message: 'Invalid action' });
      }

      await conceptProgress.save();

      // Update course progress
      if (!userId || typeof conceptId !== 'string' || !conceptId.trim()) {
        return res.status(400).json({ success: false, message: 'Invalid user or concept ID' });
      }
      await this.updateCourseProgress(String(userId), conceptId);

      res.json({
        success: true,
        message: 'Progress updated successfully',
        data: { conceptProgress }
      });
    } catch (error) {
      console.error('Update concept progress error:', error);
      res.status(500).json({ success: false, message: 'Failed to update progress' });
    }
  }

  // Get concept progress
  getConceptProgress = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { conceptId } = req.params;
      const { courseId } = req.query;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      if (!courseId) {
        return res.status(400).json({ success: false, message: 'Course ID is required' });
      }

      // Find course by ID or slug
      const course = await this.findCourse(courseId as string);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      // Get concept progress
      let conceptProgress = await UserConceptProgress.findOne({ 
        userId, 
        conceptId, 
        courseId: course._id 
      });

      if (!conceptProgress) {
        return res.json({
          success: true,
          data: {
            descriptionRead: false,
            videoWatched: false,
            quizPassed: false,
            attempts: 0,
            status: 'not_started',
            masteryScore: 0,
            timeSpent: 0
          }
        });
      }

      res.json({
        success: true,
        data: conceptProgress
      });
    } catch (error) {
      console.error('Get concept progress error:', error);
      res.status(500).json({ success: false, message: 'Failed to get concept progress' });
    }
  }

  // Submit quiz results
  submitQuizResults = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { conceptId } = req.params;
      const { answers, timeSpent } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // Get concept progress
      let conceptProgress = await UserConceptProgress.findOne({ userId, conceptId });
      if (!conceptProgress) {
        conceptProgress = new UserConceptProgress({
          userId,
          conceptId,
          status: 'not_started',
          masteryScore: 0,
          timeSpent: 0,
          attempts: 0
        });
      }

      // Calculate score based on answers (simplified)
      const totalQuestions = Object.keys(answers).length;
      let correctAnswers = 0;

      // This is a simplified scoring - in real implementation, you'd check against correct answers
      Object.values(answers).forEach((answer: any) => {
        if (answer !== undefined && answer !== null) {
          correctAnswers++;
        }
      });

      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const mastered = score >= 75;

      // Update concept progress
      conceptProgress.masteryScore = Math.max(conceptProgress.masteryScore, score);
      conceptProgress.attempts += 1;
      conceptProgress.timeSpent += timeSpent || 0;
      conceptProgress.quizPassed = mastered;

      if (mastered) {
        conceptProgress.status = 'completed';
      } else if (conceptProgress.status === 'not_started') {
        conceptProgress.status = 'in_progress';
      }

      await conceptProgress.save();

      // Update overall course progress
      if (!userId || typeof conceptId !== 'string' || !conceptId.trim()) {
        return res.status(400).json({ success: false, message: 'Invalid user or concept ID' });
      }
      await this.updateCourseProgress(String(userId), conceptId);

      res.json({
        success: true,
        data: {
          score,
          mastered,
          conceptProgress
        }
      });
    } catch (error) {
      console.error('Submit quiz results error:', error);
      res.status(500).json({ success: false, message: 'Failed to submit quiz results' });
    }
  }

  // Reset concept progress for a user
  resetConceptProgress = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { conceptId } = req.params;
      const { courseId } = req.body;
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }
      if (!courseId) {
        return res.status(400).json({ success: false, message: 'Course ID is required' });
      }
      const progress = await UserConceptProgress.findOne({ userId, conceptId, courseId });
      if (!progress) {
        return res.status(404).json({ success: false, message: 'Progress not found' });
      }
      progress.descriptionRead = false;
      progress.videoWatched = false;
      progress.quizPassed = false;
      progress.status = 'not_started';
      await progress.save();
      return res.json({ success: true });
    } catch (error) {
      console.error('Failed to reset concept progress:', error);
      return res.status(500).json({ success: false, message: 'Failed to reset concept progress' });
    }
  }

  // Get course learning data for sequential learning
  getCourseLearning = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // Find course by ID or slug
      const course = await this.findCourse(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      // Check if user is enrolled - use the actual course ID, not the slug
      let userProgress = await UserProgress.findOne({ userId, courseId: course._id });
      if (!userProgress || userProgress.status === 'not_enrolled') {
        // Auto-enroll and initialize progress
        const allConcepts = this.getAllConceptsFromCourse(course);
        userProgress = new UserProgress({
          userId,
          courseId: course._id,
          totalConcepts: allConcepts.length,
          status: 'enrolled',
          overallProgress: 0,
          conceptsCompleted: 0,
          totalTimeSpent: 0,
          enrolledAt: new Date(),
          lastAccessedAt: new Date()
        });
        await userProgress.save();
      }

      // Get all concepts from course
      const allConcepts = this.getAllConceptsFromCourse(course);
      console.log('Course structure:', {
        hasConcepts: Array.isArray((course as any).concepts),
        conceptsLength: (course as any).concepts?.length || 0,
        hasTopics: Array.isArray((course as any).topics),
        topicsLength: (course as any).topics?.length || 0
      });
      console.log('All concepts from course:', allConcepts.map((c: any) => ({
        conceptId: c.conceptId,
        _id: c._id,
        title: c.title,
        isReferenced: c.isReferenced
      })));

      // Get pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5; // Show 5 concepts per page (1 current + 4 others)
      const skip = (page - 1) * limit;

      // Populate full concept data from Concept collection with pagination
      const Concept = require('../models/conceptModel').default;
      const populatedConcepts = [];
      
      // Get user profile for prioritization
      const User = require('../models/userModel').default;
      const user = await User.findById(userId);
      const userLevel = user?.profile?.level || 'Beginner';
      const userInterests = user?.profile?.interests || [];
      
      // Process concepts with user-based prioritization
      for (let i = 0; i < allConcepts.length; i++) {
        const conceptRef = allConcepts[i];
        const conceptId = conceptRef.conceptId || conceptRef._id;
        console.log(`Looking up concept with ID: ${conceptId}`);
        
        // Try multiple lookup strategies
        let fullConcept = await Concept.findOne({ conceptId: conceptId });
        if (!fullConcept) {
          // Try looking up by _id if conceptId didn't work
          fullConcept = await Concept.findById(conceptId);
        }
        if (!fullConcept) {
          // Try looking up by title as fallback
          fullConcept = await Concept.findOne({ title: conceptRef.title });
        }
        
        console.log(`Found concept:`, fullConcept ? 'Yes' : 'No');
        if (fullConcept) {
          console.log(`Concept data:`, {
            title: fullConcept.title,
            hasContent: !!fullConcept.content,
            contentKeys: fullConcept.content ? Object.keys(fullConcept.content) : [],
            hasQuiz: !!fullConcept.quiz,
            quizQuestions: fullConcept.quiz?.questions?.length || 0
          });
        } else {
          // Debug: Check what concepts exist in the database
          const allConceptsInDB = await Concept.find({}, { conceptId: 1, title: 1 });
          console.log('Available concepts in DB:', allConceptsInDB.map((c: any) => ({ conceptId: c.conceptId, title: c.title })));
        }
        
        if (fullConcept) {
          // Calculate priority score based on user profile
          let priorityScore = 0;
          
          // Level matching
          if (fullConcept.tags?.includes(userLevel.toLowerCase())) {
            priorityScore += 10;
          }
          
          // Interest matching
          if (fullConcept.tags && userInterests.some((interest: string) => 
            fullConcept.tags.includes(interest.toLowerCase())
          )) {
            priorityScore += 5;
          }
          
          // Progress-based priority (completed concepts get lower priority)
          const userProgress = await UserConceptProgress.findOne({
            userId,
            conceptId: conceptId,
            courseId: course._id
          });
          if (userProgress?.status === 'completed') {
            priorityScore -= 3;
          } else if (userProgress?.status === 'in_progress') {
            priorityScore += 2;
          }
          
          // Merge reference data with full concept data
          populatedConcepts.push({
            _id: fullConcept._id,
            conceptId: fullConcept.conceptId,
            title: fullConcept.title,
            description: fullConcept.description,
            videoUrl: fullConcept.videoUrl,
            prerequisites: fullConcept.prerequisites || [],
            difficulty: 'Medium', // Default difficulty
            estimatedTime: '2h 30m', // Default time
            content: fullConcept.content,
            quiz: fullConcept.quiz,
            tags: fullConcept.tags,
            priorityScore,
            index: i // Keep original order for reference
          });
        } else {
          // Fallback to reference data if full concept not found
          populatedConcepts.push({
            _id: conceptRef._id || conceptRef.conceptId,
            conceptId: conceptRef.conceptId,
            title: conceptRef.title,
            description: conceptRef.description || 'No description available',
            videoUrl: conceptRef.videoUrl || '',
            prerequisites: conceptRef.prerequisites || [],
            difficulty: 'Medium',
            estimatedTime: '2h 30m',
            content: {
              intro: `Learn about ${conceptRef.title}`,
              sections: []
            },
            quiz: {
              questions: []
            },
            tags: [],
            priorityScore: 0,
            index: i
          });
        }
      }

      console.log('Populated concepts:', populatedConcepts.length);

      // Get user's concept progress - use the actual course ID
      const userConceptProgress = await UserConceptProgress.find({
        userId,
        courseId: course._id
      });

      // Create a map of concept progress
      const progressMap = new Map();
      userConceptProgress.forEach(progress => {
        progressMap.set(progress.conceptId.toString(), progress);
      });

      // Build sequential concepts list with prerequisites
      const sequentialConcepts = this.buildSequentialConcepts(populatedConcepts, progressMap);

      console.log('Sequential concepts built:', sequentialConcepts.length);

      // Sort concepts by priority score (highest first)
      sequentialConcepts.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

      // Get current concept (first in-progress or not started)
      const currentConcept = sequentialConcepts.find(c => 
        c.status === 'in_progress' || c.status === 'not_started'
      ) || sequentialConcepts[0];

      // Create concept list with only current and next concept
      let paginatedConcepts = [];
      if (currentConcept) {
        // Add current concept first
        paginatedConcepts.push(currentConcept);
        
        // Add only the next concept (second in the list)
        const otherConcepts = sequentialConcepts.filter(c => c._id !== currentConcept._id);
        if (otherConcepts.length > 0) {
          paginatedConcepts.push(otherConcepts[0]); // Only add the next one
        }
      } else {
        // If no current concept, just add first two
        paginatedConcepts = sequentialConcepts.slice(0, 2);
      }

      // Calculate pagination info (simplified for 2 concepts)
      const totalConcepts = sequentialConcepts.length;
      const currentIndex = sequentialConcepts.findIndex(c => c._id === currentConcept._id);
      const hasNextPage = currentIndex < totalConcepts - 1;
      const hasPrevPage = currentIndex > 0;

      // Check if all concepts are completed by the user
      const allCompleted = sequentialConcepts.length > 0 && sequentialConcepts.every(c => c.status === 'completed');

      res.json({
        success: true,
        data: {
          course: {
            _id: course._id,
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail,
            level: course.level,
            estimatedDuration: course.stats?.totalDuration || 0
          },
          userProgress: {
            status: userProgress.status,
            overallProgress: userProgress.overallProgress,
            conceptsCompleted: userProgress.conceptsCompleted,
            totalConcepts: totalConcepts,
            totalTimeSpent: userProgress.totalTimeSpent,
            enrolledAt: userProgress.enrolledAt,
            lastAccessedAt: userProgress.lastAccessedAt
          },
          sequentialConcepts: paginatedConcepts,
          currentConcept: currentConcept?._id,
          pagination: {
            currentPage: currentIndex + 1,
            totalPages: totalConcepts,
            totalConcepts,
            hasNextPage,
            hasPrevPage,
            limit: 2
          },
          allCompleted
        }
      });
    } catch (error) {
      console.error('Get course learning error:', error);
      res.status(500).json({ success: false, message: 'Failed to get learning data' });
    }
  }

  // Helper method to build sequential concepts with prerequisites
  private buildSequentialConcepts = (allConcepts: any[], progressMap: Map<string, any>) => {
    // Sort concepts by prerequisites (topological sort)
    const sortedConcepts: any[] = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (concept: any) => {
      if (!concept || !concept._id) return; // Defensive: skip if no _id
      const conceptIdStr = concept._id.toString();
      if (visiting.has(conceptIdStr)) {
        // Circular dependency detected
        return;
      }
      if (visited.has(conceptIdStr)) {
        return;
      }
      visiting.add(conceptIdStr);
      // Visit prerequisites first
      if (concept.prerequisites && Array.isArray(concept.prerequisites)) {
        for (const prereqId of concept.prerequisites) {
          if (!prereqId) continue; // Defensive: skip if undefined
          const prereq = allConcepts.find((c: any) => c && c._id && c._id.toString() === prereqId.toString());
          if (prereq) {
            visit(prereq);
          }
        }
      }
      visiting.delete(conceptIdStr);
      visited.add(conceptIdStr);
      // Get user progress for this concept
      const userProgress = progressMap.get(conceptIdStr);
      // Determine if concept is unlocked
      let isUnlocked = true;
      if (concept.prerequisites && Array.isArray(concept.prerequisites)) {
        for (const prereqId of concept.prerequisites) {
          if (!prereqId) { isUnlocked = false; break; }
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
        complexity: concept.difficulty === 'Easy' ? 1 : concept.difficulty === 'Medium' ? 3 : 5,
        estLearningTimeHours: this.parseTimeToHours(concept.estimatedTime),
        masteryScore: userProgress?.masteryScore || 0,
        status: userProgress?.status || 'not_started',
        mastered: userProgress?.mastered || false,
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
      if (concept && concept._id && !visited.has(concept._id.toString())) {
        visit(concept);
      }
    }
    return sortedConcepts;
  }

  // Helper method to parse time string to hours
  private parseTimeToHours = (timeString: string | undefined): number => {
    if (!timeString) return 1; // Default to 1 hour if no time string
    
    const match = timeString.match(/(\d+)h\s*(\d+)?m?/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      return hours + (minutes / 60);
    }
    return 1; // Default to 1 hour
  }

  // Helper method to check if concept is unlocked
  private isConceptUnlocked = (concept: any, conceptProgresses: any[], allConcepts: any[]): boolean => {
    // First concept is always unlocked
    if (!concept.prerequisites || concept.prerequisites.length === 0) {
      return true;
    }

    // Check if all prerequisites are completed
    return concept.prerequisites.every((prereqId: any) => {
      const prereqProgress = conceptProgresses.find((cp: any) => 
        cp.conceptId.toString() === prereqId.toString()
      );
      return prereqProgress && prereqProgress.status === 'completed';
    });
  }

  // Helper method to update course progress
  private updateCourseProgress = async (userId: string, conceptId: string) => {
    try {
      // Find course that contains this concept (new schema)
      const course = await Course.findOne({
        'concepts.conceptId': conceptId
      });
      if (!course) return;

      // Get all concept progress for this course
      const conceptProgresses = await UserConceptProgress.find({ 
        userId, 
        courseId: course._id 
      });

      // Count completed concepts in this course
      const completedConcepts = conceptProgresses.filter(cp => cp.status === 'completed').length;

      // Update course progress
      await UserProgress.findOneAndUpdate(
        { userId, courseId: course._id },
        {
          conceptsCompleted: completedConcepts,
          lastAccessedAt: new Date()
        },
        { new: true }
      );
    } catch (error) {
      console.error('Update course progress error:', error);
    }
  }
}

export default new CourseLearningController(); 