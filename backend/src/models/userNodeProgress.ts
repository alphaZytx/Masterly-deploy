import mongoose, { Schema } from 'mongoose';

// User Node Progress Schema for tracking individual concept progress
const UserNodeProgressSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  courseId: { 
    type: String, // Now a string, not ObjectId
    required: true 
  },
  conceptId: { 
    type: String, // Now a string, not ObjectId
    required: true 
  },
  // Progress Status
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed', 'skipped'], 
    default: 'not_started' 
  },
  progress: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 100 
  },
  // Content Progress
  contentProgress: {
    videosWatched: [{
      videoId: String, // Now a string, not ObjectId
      watchedAt: { type: Date, default: Date.now },
      watchTime: { type: Number, default: 0 }, // in seconds
      completed: { type: Boolean, default: false }
    }],
    articlesRead: [{
      articleId: String, // Now a string, not ObjectId
      readAt: { type: Date, default: Date.now },
      readTime: { type: Number, default: 0 }, // in seconds
      completed: { type: Boolean, default: false }
    }],
    problemsAttempted: [{
      problemId: String, // Now a string, not ObjectId
      attemptedAt: { type: Date, default: Date.now },
      submittedCode: String,
      language: String,
      testCasesPassed: { type: Number, default: 0 },
      totalTestCases: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      completed: { type: Boolean, default: false }
    }]
  },
  // Quiz Progress
  quizProgress: {
    attempts: [{
      attemptNumber: { type: Number, required: true },
      answers: [{
        questionId: String, // Now a string, not ObjectId
        selectedAnswers: [Schema.Types.Mixed], // Can be numbers or strings
        isCorrect: Boolean,
        points: Number
      }],
      score: { type: Number, min: 0, max: 100 },
      timeSpent: { type: Number, default: 0 }, // in seconds
      completedAt: { type: Date, default: Date.now },
      passed: { type: Boolean, default: false }
    }],
    bestScore: { type: Number, min: 0, max: 100 },
    totalAttempts: { type: Number, default: 0 },
    passed: { type: Boolean, default: false }
  },
  // Prerequisites
  prerequisites: {
    required: [String], // List of required concept IDs (as strings)
    met: { type: Boolean, default: false },
    testPassed: { type: Boolean, default: false },
    testScore: { type: Number, min: 0, max: 100 },
    contentCompleted: { type: Boolean, default: false },
    bypassed: { type: Boolean, default: false }
  },
  // Time Tracking
  timeSpent: { 
    type: Number, 
    default: 0 
  }, // Total time spent in minutes
  startedAt: { type: Date },
  completedAt: { type: Date },
  lastAccessedAt: { type: Date, default: Date.now },
  // Notes and Bookmarks
  notes: [{
    content: String,
    timestamp: { type: Date, default: Date.now },
    position: String // e.g., "video:1:30", "article:paragraph:3"
  }],
  bookmarks: [{
    type: String, // "video", "article", "problem"
    itemId: String, // Now a string, not ObjectId
    position: String,
    createdAt: { type: Date, default: Date.now }
  }],
  // Completion Criteria
  completionCriteria: {
    videosRequired: { type: Boolean, default: true },
    articlesRequired: { type: Boolean, default: true },
    problemsRequired: { type: Boolean, default: false },
    quizRequired: { type: Boolean, default: true },
    minQuizScore: { type: Number, default: 75 }
  },
  // Metadata
  difficulty: { 
    type: String, 
    enum: ['Easy', 'Medium', 'Hard'], 
    required: true 
  },
  estimatedTime: { type: String, required: true }, // e.g., "1h 30m"
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

UserNodeProgressSchema.index({ userId: 1, courseId: 1, conceptId: 1 }, { unique: true });
UserNodeProgressSchema.index({ userId: 1, status: 1 });
UserNodeProgressSchema.index({ courseId: 1, status: 1 });
UserNodeProgressSchema.index({ userId: 1, lastAccessedAt: -1 });

UserNodeProgressSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

export default mongoose.model('UserNodeProgress', UserNodeProgressSchema); 