import { Request, Response } from 'express';
import { Types } from 'mongoose';
import LearningPath from '../models/learningPathModel';
import UserNodeProgress from '../models/userNodeProgress';
import Course from '../models/courseModel';
import Concept from '../models/conceptModel';
import User, { IUser } from '../models/userModel';
import { authenticateToken } from '../middlewares/authMiddleware';
import { CourseStatsUpdater } from '../utils/courseStatsUpdater';

export class LearningPathController {

  /**
   * Create a new learning path for a user
   */
  static async createLearningPath(req: Request, res: Response) {
    try {
      const { courseId, startNode, skipPrerequisites } = req.body;
      const userId = (req.user as IUser)._id;

      // Check if user already has a learning path for this course
      const existingPath = await LearningPath.findOne({ userId, courseId });
      if (existingPath) {
        return res.status(400).json({
          success: false,
          message: "Learning path already exists for this course"
        });
      }

      // Get course details
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      // Generate custom path based on course structure
      const customPath = await this.generateCustomPath(course, startNode);

      // Create learning path
      const learningPath = new LearningPath({
        userId,
        courseId,
        customPath,
        startNode: startNode || customPath[0],
        skipPrerequisites: skipPrerequisites || false,
        currentNode: startNode || customPath[0],
        completedNodes: [],
        overallProgress: 0,
        prerequisitesMet: new Map(),
        stats: {
          totalTimeSpent: 0,
          totalSessions: 0,
          averageSessionTime: 0,
          streakDays: 0
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessedAt: new Date()
      });

      await learningPath.save();

      // Update course stats after user enrollment
      await CourseStatsUpdater.onUserEnrollment(courseId);

      res.status(201).json({
        success: true,
        data: learningPath,
        message: "Learning path created successfully"
      });

    } catch (error) {
      console.error("Create learning path error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create learning path"
      });
    }
  }

  /**
   * Get user's learning path for a course
   */
  static async getLearningPath(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = (req.user as IUser)._id;

      const learningPath = await LearningPath.findOne({ userId, courseId })
        .populate('courseId', 'title description thumbnail')
        .populate('currentNode', 'title description')
        .populate('customPath', 'title description difficulty estimatedTime');

      if (!learningPath) {
        return res.status(404).json({
          success: false,
          message: "Learning path not found"
        });
      }

      // Get progress for each node
      const nodeProgress = await UserNodeProgress.find({
        userId,
        courseId,
        conceptId: { $in: learningPath.customPath }
      });

      // Enhance learning path with progress data
      const enhancedPath = {
        ...learningPath.toObject(),
        nodeProgress: nodeProgress.reduce((acc, progress) => {
          acc[progress.conceptId.toString()] = progress;
          return acc;
        }, {} as any)
      };

      res.json({
        success: true,
        data: enhancedPath
      });

    } catch (error) {
      console.error("Get learning path error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch learning path"
      });
    }
  }

  /**
   * Update learning path progress
   */
  static async updateLearningPath(req: Request, res: Response) {
    try {
      const { pathId } = req.params;
      const { currentNode, completedNodes, overallProgress } = req.body;
      const userId = (req.user as IUser)._id;

      const learningPath = await LearningPath.findOne({ _id: pathId, userId });
      if (!learningPath) {
        return res.status(404).json({
          success: false,
          message: "Learning path not found"
        });
      }

      // Update fields
      if (currentNode) learningPath.currentNode = currentNode;
      if (completedNodes) learningPath.completedNodes = completedNodes;
      if (overallProgress !== undefined) learningPath.overallProgress = overallProgress;

      learningPath.lastAccessedAt = new Date();
      await learningPath.save();

      // Update course stats after learning path update
      await CourseStatsUpdater.onLearningPathUpdate(learningPath.courseId);

      res.json({
        success: true,
        data: learningPath,
        message: "Learning path updated successfully"
      });

    } catch (error) {
      console.error("Update learning path error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update learning path"
      });
    }
  }

  /**
   * Complete a node in the learning path
   */
  static async completeNode(req: Request, res: Response) {
    try {
      const { pathId, nodeId } = req.params;
      const userId = (req.user as IUser)._id;

      const learningPath = await LearningPath.findOne({ _id: pathId, userId });
      if (!learningPath) {
        return res.status(404).json({
          success: false,
          message: "Learning path not found"
        });
      }

      // Mark node as completed
      learningPath.completeNode(new Types.ObjectId(nodeId));
      await learningPath.save();

      // Update course stats after concept completion
      await CourseStatsUpdater.onConceptCompletion(learningPath.courseId);

      res.json({
        success: true,
        data: learningPath,
        message: "Node completed successfully"
      });

    } catch (error) {
      console.error("Complete node error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to complete node"
      });
    }
  }

  /**
   * Assess prerequisites for a node
   */
  static async assessPrerequisites(req: Request, res: Response) {
    try {
      const { pathId, nodeId } = req.params;
      const { answers, timeSpent } = req.body;
      const userId = (req.user as IUser)._id;

      const learningPath = await LearningPath.findOne({ _id: pathId, userId });
      if (!learningPath) {
        return res.status(404).json({
          success: false,
          message: "Learning path not found"
        });
      }

      // Calculate score (simplified - you can implement your own scoring logic)
      const score = this.calculatePrerequisiteScore(answers);
      const passed = score >= 75;

      // Update prerequisites status
      learningPath.prerequisitesMet.set(nodeId, {
        conceptId: new Types.ObjectId(nodeId),
        met: passed,
        testPassed: passed,
        testScore: score,
        contentCompleted: false,
        completedAt: passed ? new Date() : undefined
      });

      await learningPath.save();

      res.json({
        success: true,
        data: {
          score,
          passed,
          canProceed: passed || learningPath.skipPrerequisites
        },
        message: passed ? "Prerequisites met" : "Prerequisites not met"
      });

    } catch (error) {
      console.error("Assess prerequisites error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to assess prerequisites"
      });
    }
  }

  /**
   * Generate custom learning path based on course structure
   */
  private static async generateCustomPath(course: any, startNode?: Types.ObjectId): Promise<Types.ObjectId[]> {
    const path: Types.ObjectId[] = [];

    for (const topic of course.topics) {
      if (topic.useReferencedConcepts) {
        // Use referenced concepts
        for (const ref of topic.conceptReferences) {
          path.push(ref.conceptId);
        }
      } else {
        // Use embedded concepts
        for (const concept of topic.concepts) {
          path.push(concept._id);
        }
      }
    }

    // If startNode is specified, reorder path to start from that node
    if (startNode) {
      const startIndex = path.findIndex(id => id.toString() === startNode.toString());
      if (startIndex > 0) {
        const beforeStart = path.slice(0, startIndex);
        const afterStart = path.slice(startIndex);
        return [...afterStart, ...beforeStart];
      }
    }

    return path;
  }

  /**
   * Calculate prerequisite assessment score
   */
  private static calculatePrerequisiteScore(answers: any[]): number {
    if (!answers || answers.length === 0) return 0;
    
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    return Math.round((correctAnswers / answers.length) * 100);
  }
}

export default LearningPathController; 