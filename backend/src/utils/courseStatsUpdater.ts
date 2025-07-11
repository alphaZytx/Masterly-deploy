import { Types } from 'mongoose';
import { CourseStatsCalculator } from './courseStatsCalculator';

export class CourseStatsUpdater {
  
  /**
   * Update stats when a user enrolls in a course
   */
  static async onUserEnrollment(courseId: Types.ObjectId): Promise<void> {
    try {
      await CourseStatsCalculator.updateCourseStats(courseId);
      console.log(`Updated stats for course ${courseId} after user enrollment`);
    } catch (error) {
      console.error('Error updating course stats after enrollment:', error);
    }
  }

  /**
   * Update stats when a user completes a concept
   */
  static async onConceptCompletion(courseId: Types.ObjectId): Promise<void> {
    try {
      await CourseStatsCalculator.updateCourseStats(courseId);
      console.log(`Updated stats for course ${courseId} after concept completion`);
    } catch (error) {
      console.error('Error updating course stats after concept completion:', error);
    }
  }

  /**
   * Update stats when a user completes a course
   */
  static async onCourseCompletion(courseId: Types.ObjectId): Promise<void> {
    try {
      await CourseStatsCalculator.updateCourseStats(courseId);
      console.log(`Updated stats for course ${courseId} after course completion`);
    } catch (error) {
      console.error('Error updating course stats after course completion:', error);
    }
  }

  /**
   * Update stats when learning path progress changes
   */
  static async onLearningPathUpdate(courseId: Types.ObjectId): Promise<void> {
    try {
      await CourseStatsCalculator.updateCourseStats(courseId);
      console.log(`Updated stats for course ${courseId} after learning path update`);
    } catch (error) {
      console.error('Error updating course stats after learning path update:', error);
    }
  }

  /**
   * Batch update stats for multiple courses
   */
  static async batchUpdateStats(courseIds: Types.ObjectId[]): Promise<void> {
    try {
      await Promise.all(
        courseIds.map(courseId => CourseStatsCalculator.updateCourseStats(courseId))
      );
      console.log(`Batch updated stats for ${courseIds.length} courses`);
    } catch (error) {
      console.error('Error batch updating course stats:', error);
    }
  }

  /**
   * Schedule periodic stats updates (can be called by a cron job)
   */
  static async schedulePeriodicUpdate(): Promise<void> {
    try {
      await CourseStatsCalculator.updateAllCourseStats();
      console.log('Completed periodic course stats update');
    } catch (error) {
      console.error('Error in periodic course stats update:', error);
    }
  }
} 