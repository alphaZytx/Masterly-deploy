import { Types } from 'mongoose';
import Course from '../models/courseModel';
import LearningPath from '../models/learningPathModel';
import UserNodeProgress from '../models/userNodeProgress';
import Concept from '../models/conceptModel';
import User from '../models/userModel';

export interface CourseStats {
  totalStudents: number;
  totalRatings: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
  totalDuration: number;
  totalConcepts: number;
  totalVideos: number;
  totalArticles: number;
  totalProblems: number;
  totalQuizzes: number;
}

export class CourseStatsCalculator {
  
  /**
   * Calculate comprehensive stats for a specific course
   */
  static async calculateCourseStats(courseId: Types.ObjectId): Promise<CourseStats> {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Get all concept IDs referenced in this course
      const conceptIds = this.extractConceptIds(course);
      
      // Calculate stats from actual data
      const [
        totalStudents,
        totalConcepts,
        contentStats,
        completionStats
      ] = await Promise.all([
        this.getTotalStudents(courseId),
        this.getTotalConcepts(conceptIds),
        this.getContentStats(conceptIds),
        this.getCompletionStats(courseId)
      ]);

      return {
        totalStudents,
        totalRatings: 0, // TODO: Implement when rating system is added
        averageRating: 0, // TODO: Implement when rating system is added
        totalReviews: 0, // TODO: Implement when review system is added
        completionRate: completionStats.completionRate,
        totalDuration: contentStats.totalDuration,
        totalConcepts,
        totalVideos: contentStats.totalVideos,
        totalArticles: contentStats.totalArticles,
        totalProblems: contentStats.totalProblems,
        totalQuizzes: contentStats.totalQuizzes
      };
    } catch (error) {
      console.error('Error calculating course stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Calculate stats for all courses
   */
  static async calculateAllCourseStats(): Promise<Map<string, CourseStats>> {
    try {
      const courses = await Course.find({ isActive: true });
      const statsMap = new Map<string, CourseStats>();

      await Promise.all(
        courses.map(async (course) => {
          const stats = await this.calculateCourseStats(course._id);
          statsMap.set(course._id.toString(), stats);
        })
      );

      return statsMap;
    } catch (error) {
      console.error('Error calculating all course stats:', error);
      return new Map();
    }
  }

  /**
   * Extract all concept IDs from a course (both embedded and referenced)
   */
  private static extractConceptIds(course: any): Types.ObjectId[] {
    const conceptIds: Types.ObjectId[] = [];

    course.topics.forEach((topic: any) => {
      if (topic.useReferencedConcepts && topic.conceptReferences) {
        // Add referenced concept IDs
        topic.conceptReferences.forEach((ref: any) => {
          if (ref.conceptId) {
            conceptIds.push(ref.conceptId);
          }
        });
      } else if (topic.concepts) {
        // Add embedded concept IDs
        topic.concepts.forEach((concept: any) => {
          if (concept._id) {
            conceptIds.push(concept._id);
          }
        });
      }
    });

    return conceptIds;
  }

  /**
   * Get total number of students enrolled in the course
   */
  private static async getTotalStudents(courseId: Types.ObjectId): Promise<number> {
    try {
      const learningPaths = await LearningPath.find({ courseId });
      const uniqueStudents = new Set(learningPaths.map(path => path.userId.toString()));
      return uniqueStudents.size;
    } catch (error) {
      console.error('Error getting total students:', error);
      return 0;
    }
  }

  /**
   * Get total number of concepts in the course
   */
  private static async getTotalConcepts(conceptIds: Types.ObjectId[]): Promise<number> {
    try {
      if (conceptIds.length === 0) return 0;
      
      const uniqueConceptIds = [...new Set(conceptIds.map(id => id.toString()))];
      return uniqueConceptIds.length;
    } catch (error) {
      console.error('Error getting total concepts:', error);
      return 0;
    }
  }

  /**
   * Get content statistics (videos, articles, problems, quizzes)
   */
  private static async getContentStats(conceptIds: Types.ObjectId[]): Promise<{
    totalVideos: number;
    totalArticles: number;
    totalProblems: number;
    totalQuizzes: number;
    totalDuration: number;
  }> {
    try {
      if (conceptIds.length === 0) {
        return {
          totalVideos: 0,
          totalArticles: 0,
          totalProblems: 0,
          totalQuizzes: 0,
          totalDuration: 0
        };
      }

      const concepts = await Concept.find({ _id: { $in: conceptIds } });
      
      let totalVideos = 0;
      let totalArticles = 0;
      let totalProblems = 0;
      let totalQuizzes = 0;
      let totalDuration = 0;

      concepts.forEach(concept => {
        // Count videos (no contentBlocks in schema, so fallback to 0)
        // totalVideos += 0;

        // Count articles (no articleContent in schema, so fallback to 0)
        // totalArticles += 0;

        // Count problems (no Test_Questions in schema, so fallback to 0)
        // totalProblems += 0;

        // Count quizzes (if concept has quiz.questions array)
        if (concept.quiz && Array.isArray(concept.quiz.questions) && concept.quiz.questions.length > 0) {
          totalQuizzes += 1;
        }

        // Calculate total duration from estimated learning time (not in schema, fallback to 0)
        // totalDuration += 0;
      });

      return {
        totalVideos,
        totalArticles,
        totalProblems,
        totalQuizzes,
        totalDuration: Math.round(totalDuration)
      };
    } catch (error) {
      console.error('Error getting content stats:', error);
      return {
        totalVideos: 0,
        totalArticles: 0,
        totalProblems: 0,
        totalQuizzes: 0,
        totalDuration: 0
      };
    }
  }

  /**
   * Get completion statistics for the course
   */
  private static async getCompletionStats(courseId: Types.ObjectId): Promise<{
    completionRate: number;
  }> {
    try {
      const learningPaths = await LearningPath.find({ courseId });
      
      if (learningPaths.length === 0) {
        return { completionRate: 0 };
      }

      const completedPaths = learningPaths.filter(path => 
        path.status === 'completed' || path.overallProgress >= 100
      );

      const completionRate = Math.round((completedPaths.length / learningPaths.length) * 100);
      
      return { completionRate };
    } catch (error) {
      console.error('Error getting completion stats:', error);
      return { completionRate: 0 };
    }
  }

  /**
   * Get default stats when calculation fails
   */
  private static getDefaultStats(): CourseStats {
    return {
      totalStudents: 0,
      totalRatings: 0,
      averageRating: 0,
      totalReviews: 0,
      completionRate: 0,
      totalDuration: 0,
      totalConcepts: 0,
      totalVideos: 0,
      totalArticles: 0,
      totalProblems: 0,
      totalQuizzes: 0
    };
  }

  /**
   * Update course stats in the database
   */
  static async updateCourseStats(courseId: Types.ObjectId): Promise<void> {
    try {
      const stats = await this.calculateCourseStats(courseId);
      
      await Course.findByIdAndUpdate(courseId, {
        $set: { stats }
      });

      console.log(`Updated stats for course ${courseId}:`, stats);
    } catch (error) {
      console.error('Error updating course stats:', error);
    }
  }

  /**
   * Update stats for all courses
   */
  static async updateAllCourseStats(): Promise<void> {
    try {
      const courses = await Course.find({ isActive: true });
      
      await Promise.all(
        courses.map(course => this.updateCourseStats(course._id))
      );

      console.log(`Updated stats for ${courses.length} courses`);
    } catch (error) {
      console.error('Error updating all course stats:', error);
    }
  }

  /**
   * Get real-time stats for a course (without updating database)
   */
  static async getRealTimeStats(courseId: Types.ObjectId): Promise<CourseStats> {
    return await this.calculateCourseStats(courseId);
  }
} 