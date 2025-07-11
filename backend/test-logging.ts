import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './src/utils/logger';
import SystemLog from './src/models/systemLogModel';

dotenv.config();

async function testLogging() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Clear existing test logs
    await SystemLog.deleteMany({});
    console.log('Cleared existing test logs');

    // Generate sample logs
    const sampleLogs = [
      {
        action: 'User Login',
        category: 'auth' as const,
        details: 'User successfully logged in via email/password',
        severity: 'success' as const,
        userEmail: 'john@example.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        action: 'Course Enrollment',
        category: 'course' as const,
        details: 'User enrolled in "Advanced JavaScript" course',
        severity: 'info' as const,
        userEmail: 'jane@example.com',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        action: 'User Registration',
        category: 'user' as const,
        details: 'New user registered with email: newuser@example.com',
        severity: 'info' as const,
        userEmail: 'admin@masterly.com',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        action: 'System Maintenance',
        category: 'system' as const,
        details: 'Database backup completed successfully',
        severity: 'success' as const,
        ipAddress: '127.0.0.1',
        userAgent: 'System/1.0'
      },
      {
        action: 'Failed Login Attempt',
        category: 'auth' as const,
        details: 'Multiple failed login attempts detected',
        severity: 'warning' as const,
        userEmail: 'user@example.com',
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        action: 'User Suspended',
        category: 'admin' as const,
        details: 'User account suspended for violation of terms',
        severity: 'warning' as const,
        userEmail: 'admin@masterly.com',
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        action: 'Database Error',
        category: 'system' as const,
        details: 'Connection timeout to MongoDB cluster',
        severity: 'error' as const,
        ipAddress: '127.0.0.1',
        userAgent: 'System/1.0'
      },
      {
        action: 'Course Completion',
        category: 'course' as const,
        details: 'User completed "Introduction to React" course with 95% score',
        severity: 'success' as const,
        userEmail: 'student@example.com',
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        action: 'Quiz Submission',
        category: 'quiz' as const,
        details: 'User submitted quiz for "Arrays and Strings" concept with 85% score',
        severity: 'info' as const,
        userEmail: 'learner@example.com',
        ipAddress: '192.168.1.106',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        action: 'Recommendation Generated',
        category: 'recommendation' as const,
        details: 'AI recommendation generated for user based on learning patterns',
        severity: 'info' as const,
        userEmail: 'aiuser@example.com',
        ipAddress: '192.168.1.107',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    ];

    // Create logs with different timestamps (last 7 days)
    for (let i = 0; i < sampleLogs.length; i++) {
      const log = sampleLogs[i];
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 7));
      timestamp.setHours(Math.floor(Math.random() * 24));
      timestamp.setMinutes(Math.floor(Math.random() * 60));

      await SystemLog.create({
        ...log,
        timestamp
      });
    }

    console.log('✅ Sample logs created successfully!');
    console.log(`Created ${sampleLogs.length} sample logs`);

    // Test the logger
    console.log('\nTesting logger...');
    await logger.info('Test Log', 'This is a test log entry', 'system');
    await logger.success('Test Success', 'This is a success log entry', 'system');
    await logger.warning('Test Warning', 'This is a warning log entry', 'system');
    await logger.error('Test Error', 'This is an error log entry', 'system');

    console.log('✅ Logger test completed!');

  } catch (error) {
    console.error('Error testing logging system:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testLogging(); 