import mongoose from 'mongoose';
import { CourseStatsCalculator } from '../src/utils/courseStatsCalculator';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function initializeCourseStats() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-platform';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Starting course stats initialization...');

    // Update stats for all courses
    await CourseStatsCalculator.updateAllCourseStats();

    console.log('✅ Course stats initialization completed successfully!');
    
    // Get a summary of updated courses
    const { Course } = await import('../src/models/courseModel');
    const courses = await Course.find({ isActive: true });
    
    console.log(`📊 Updated stats for ${courses.length} courses:`);
    courses.forEach(course => {
      console.log(`  - ${course.title}: ${course.stats.totalStudents} students, ${course.stats.completionRate}% completion`);
    });

  } catch (error) {
    console.error('❌ Error initializing course stats:', error);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  initializeCourseStats()
    .then(() => {
      console.log('🎉 Course stats initialization script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export default initializeCourseStats; 