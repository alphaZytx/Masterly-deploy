import { Request, Response } from 'express';
import { Types } from 'mongoose';
import User from '../models/userModel';
import LearningPath from '../models/learningPathModel';
import UserNodeProgress from '../models/userNodeProgress';
import Course from '../models/courseModel';
import Concept from '../models/conceptModel';

export class DashboardController {

  /**
   * Get comprehensive dashboard data for a user
   */
  static async getDashboardData(req: Request, res: Response) {
    try {
      const userId = (req.user as any)._id;

      // Get user with populated data
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Get user's learning paths
      const learningPaths = await LearningPath.find({ userId })
        .populate('courseId', 'title description thumbnail')
        .populate('currentNode', 'title description')
        .sort({ lastAccessedAt: -1 });

      // Get user's progress across all concepts
      const userProgress = await UserNodeProgress.find({ userId })
        .populate('conceptId', 'title Level Category course')
        .populate('courseId', 'title');

      // Calculate comprehensive statistics
      const stats = await DashboardController.calculateUserStats(userId, userProgress, learningPaths);

      // Get recent learning activity
      const recentActivity = await DashboardController.getRecentActivity(userId, userProgress);

      // Get recommended courses
      const recommendedCourses = await DashboardController.getRecommendedCourses(userId, userProgress);

      // Get achievements and milestones
      const achievements = await DashboardController.getUserAchievements(userId, stats);

      // Get upcoming deadlines and reminders
      const upcomingDeadlines = await DashboardController.getUpcomingDeadlines(userId, learningPaths);

      const dashboardData = {
        user: {
          id: user._id,
          name: user.profile?.fullName || user.profile?.displayName || user.email?.split('@')[0],
          email: user.email,
          avatar: user.profile?.avatar,
          level: user.stats?.level || 'Beginner',
          plan: user.subscription?.plan || 'free',
          joinDate: typeof user.get === 'function' ? user.get('createdAt') : (user as any).createdAt,
          lastActive: user.lastLoginAt || (typeof user.get === 'function' ? user.get('updatedAt') : (user as any).updatedAt)
        },
        stats,
        learningPaths: learningPaths.map(path => ({
          id: path._id,
          courseTitle: (path.courseId as any)?.title || 'Unknown Course',
          courseThumbnail: (path.courseId as any)?.thumbnail,
          progress: path.overallProgress,
          currentNode: (path.currentNode as any)?.title || 'Not started',
          status: path.status,
          lastAccessed: path.lastAccessedAt,
          totalTimeSpent: path.stats.totalTimeSpent,
          streakDays: path.stats.streakDays
        })),
        recentActivity,
        recommendedCourses,
        achievements,
        upcomingDeadlines
      };

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error("Dashboard data error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard data"
      });
    }
  }

  /**
   * Calculate comprehensive user statistics
   */
  private static async calculateUserStats(userId: Types.ObjectId, userProgress: any[], learningPaths: any[]) {
    const totalConcepts = userProgress.length;
    const completedConcepts = userProgress.filter(p => p.status === 'completed').length;
    const inProgressConcepts = userProgress.filter(p => p.status === 'in_progress').length;

    const totalTimeSpent = userProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const totalQuizAttempts = userProgress.reduce((sum, p) => sum + ((p.quizAttempts || []).length || 0), 0);
    const averageMasteryScore = userProgress.length > 0
      ? userProgress.reduce((sum, p) => sum + (p.masteryScore || 0), 0) / userProgress.length
      : 0;

    // Calculate current streak
    const currentStreak = learningPaths.length > 0
      ? Math.max(...learningPaths.map(p => p.stats.streakDays || 0))
      : 0;

    // Get course-specific stats
    const courseStats = await DashboardController.getCourseStats(userId, userProgress);

    return {
      totalConcepts,
      completedConcepts,
      inProgressConcepts,
      totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to hours
      totalQuizAttempts,
      averageMasteryScore: Math.round(averageMasteryScore * 10) / 10,
      currentStreak,
      completionRate: totalConcepts > 0 ? Math.round((completedConcepts / totalConcepts) * 100) : 0,
      coursesEnrolled: learningPaths.length,
      coursesCompleted: learningPaths.filter(p => p.status === 'completed').length,
      ...courseStats
    };
  }

  /**
   * Get course-specific statistics
   */
  private static async getCourseStats(userId: Types.ObjectId, userProgress: any[]) {
    const courseProgress = userProgress.reduce((acc, progress) => {
      const courseId = progress.courseId?._id?.toString();
      if (courseId) {
        if (!acc[courseId]) {
          acc[courseId] = {
            courseTitle: progress.courseId?.title || 'Unknown Course',
            totalConcepts: 0,
            completedConcepts: 0,
            totalTimeSpent: 0,
            averageMastery: 0
          };
        }
        acc[courseId].totalConcepts++;
        if (progress.status === 'completed') {
          acc[courseId].completedConcepts++;
        }
        acc[courseId].totalTimeSpent += progress.timeSpent || 0;
        acc[courseId].averageMastery += progress.masteryScore || 0;
      }
      return acc;
    }, {} as any);

    // Calculate averages
    Object.keys(courseProgress).forEach(courseId => {
      const course = courseProgress[courseId];
      course.averageMastery = course.totalConcepts > 0
        ? Math.round((course.averageMastery / course.totalConcepts) * 10) / 10
        : 0;
      course.progressPercentage = course.totalConcepts > 0
        ? Math.round((course.completedConcepts / course.totalConcepts) * 100)
        : 0;
    });

    return { courseProgress };
  }

  /**
   * Get recent learning activity
   */
  private static async getRecentActivity(userId: Types.ObjectId, userProgress: any[]) {
    const recentProgress = userProgress
      .filter(p => p.lastAccessedAt)
      .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
      .slice(0, 5);

    return recentProgress.map(progress => ({
      id: progress._id,
      conceptTitle: (progress.conceptId as any)?.title || 'Unknown Concept',
      courseTitle: (progress.courseId as any)?.title || 'Unknown Course',
      action: progress.status === 'completed' ? 'completed' : 'studied',
      timestamp: progress.lastAccessedAt,
      masteryScore: (progress as any).masteryScore,
      timeSpent: progress.timeSpent
    }));
  }

  /**
   * Get recommended courses based on user progress
   */
  private static async getRecommendedCourses(userId: Types.ObjectId, userProgress: any[]) {
    // Get user's completed concepts
    const completedConcepts = userProgress
      .filter(p => p.status === 'completed')
      .map(p => (p.conceptId as any)?.course)
      .filter(Boolean);

    // Get unique courses user has studied
    const userCourses = [...new Set(completedConcepts)];

    // Find courses user hasn't enrolled in yet
    const allCourses = await Course.find({
      status: 'published',
      isActive: true
    }).select('title description thumbnail category level stats');

    const recommendedCourses = allCourses
      .filter(course => !userCourses.includes(course.title))
      .sort((a, b) => (b.stats?.totalStudents || 0) - (a.stats?.totalStudents || 0))
      .slice(0, 3);

    return recommendedCourses.map(course => ({
      id: course._id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      category: course.category,
      level: course.level,
      totalStudents: course.stats?.totalStudents || 0,
      averageRating: course.stats?.averageRating || 0
    }));
  }

  /**
   * Get user achievements based on their progress
   */
  private static async getUserAchievements(userId: Types.ObjectId, stats: any) {
    const achievements = [];

    // Course completion achievements
    if (stats.coursesCompleted >= 1) {
      achievements.push({
        id: 'first_course',
        title: 'First Course Complete',
        description: 'Completed your first course',
        icon: '🎓',
        unlockedAt: new Date(),
        type: 'course'
      });
    }

    if (stats.coursesCompleted >= 5) {
      achievements.push({
        id: 'course_master',
        title: 'Course Master',
        description: 'Completed 5 courses',
        icon: '🏆',
        unlockedAt: new Date(),
        type: 'course'
      });
    }

    // Streak achievements
    if (stats.currentStreak >= 7) {
      achievements.push({
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Maintained a 7-day learning streak',
        icon: '🔥',
        unlockedAt: new Date(),
        type: 'streak'
      });
    }

    if (stats.currentStreak >= 30) {
      achievements.push({
        id: 'month_master',
        title: 'Month Master',
        description: 'Maintained a 30-day learning streak',
        icon: '⭐',
        unlockedAt: new Date(),
        type: 'streak'
      });
    }

    // Concept mastery achievements
    if (stats.completedConcepts >= 10) {
      achievements.push({
        id: 'concept_explorer',
        title: 'Concept Explorer',
        description: 'Mastered 10 concepts',
        icon: '🧠',
        unlockedAt: new Date(),
        type: 'mastery'
      });
    }

    if (stats.completedConcepts >= 50) {
      achievements.push({
        id: 'knowledge_seeker',
        title: 'Knowledge Seeker',
        description: 'Mastered 50 concepts',
        icon: '📚',
        unlockedAt: new Date(),
        type: 'mastery'
      });
    }

    return achievements;
  }

  /**
   * Get upcoming deadlines and reminders
   */
  private static async getUpcomingDeadlines(userId: Types.ObjectId, learningPaths: any[]) {
    const deadlines: any[] = [];

    // Add reminders for inactive learning paths
    const inactivePaths = learningPaths.filter(path => {
      const daysSinceLastAccess = Math.floor(
        (Date.now() - new Date(path.lastAccessedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceLastAccess > 7 && path.status === 'active';
    });

    inactivePaths.forEach(path => {
      deadlines.push({
        id: `reminder_${path._id}`,
        title: 'Continue Learning',
        description: `Don't forget to continue your ${(path.courseId as any)?.title} course`,
        type: 'reminder',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        priority: 'medium'
      });
    });

    return deadlines;
  }

  /**
   * Get user's learning summary
   */
  static async getLearningSummary(req: Request, res: Response) {
    try {
      const userId = (req.user as any)._id;

      const userProgress = await UserNodeProgress.find({ userId })
        .populate('conceptId', 'title Level Category course')
        .populate('courseId', 'title');

      const summary = {
        totalStudyTime: userProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0),
        conceptsMastered: userProgress.filter(p => p.status === 'completed').length,
        averageMasteryScore: userProgress.length > 0
          ? userProgress.reduce((sum, p) => sum + ((p as any).masteryScore || 0), 0) / userProgress.length
          : 0,
        coursesStudied: [...new Set(userProgress.map(p =>
          typeof p.courseId === 'string'
            ? p.courseId
            : (p.courseId as any)?._id?.toString()
        ).filter(Boolean))].length, recentActivity: userProgress
          .filter(p => p.lastAccessedAt)
          .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
          .slice(0, 3)
          .map(p => ({
            concept: (p.conceptId as any)?.title,
            course: (p.courseId as any)?.title,
            action: p.status === 'completed' ? 'completed' : 'studied',
            date: p.lastAccessedAt
          }))
      };

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error("Learning summary error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch learning summary"
      });
    }
  }
}

export default DashboardController; 