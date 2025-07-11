import mongoose, { Schema, Document } from 'mongoose';

export interface IAssessment extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  testType: 'course_test' | 'mock_test' | 'concept_quiz';
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in seconds
  passed: boolean;
  masteryGained: number;
  answers?: { [key: string]: number };
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assessmentSchema = new Schema<IAssessment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  testType: {
    type: String,
    enum: ['course_test', 'mock_test', 'concept_quiz'],
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  correctAnswers: {
    type: Number,
    required: true,
    min: 0
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0
  },
  passed: {
    type: Boolean,
    required: true,
    default: false
  },
  masteryGained: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  answers: {
    type: Schema.Types.Mixed,
    default: {}
  },
  completedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
assessmentSchema.index({ userId: 1, courseId: 1, testType: 1 });
assessmentSchema.index({ userId: 1, completedAt: -1 });
assessmentSchema.index({ courseId: 1, testType: 1, completedAt: -1 });

// Virtual for percentage score
assessmentSchema.virtual('percentageScore').get(function() {
  return this.totalQuestions > 0 ? Math.round((this.correctAnswers / this.totalQuestions) * 100) : 0;
});

// Method to get formatted time
assessmentSchema.methods.getFormattedTime = function() {
  const hours = Math.floor(this.timeSpent / 3600);
  const minutes = Math.floor((this.timeSpent % 3600) / 60);
  const seconds = this.timeSpent % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

// Static method to get user's test history
assessmentSchema.statics.getUserTestHistory = function(userId: string, courseId?: string) {
  const query: any = { userId };
  if (courseId) query.courseId = courseId;
  
  return this.find(query)
    .sort({ completedAt: -1 })
    .populate('courseId', 'title slug')
    .lean();
};

// Static method to get course statistics
assessmentSchema.statics.getCourseStats = function(courseId: string) {
  return this.aggregate([
    { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: '$testType',
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$score' },
        passRate: {
          $avg: { $cond: ['$passed', 1, 0] }
        },
        averageTimeSpent: { $avg: '$timeSpent' },
        totalMasteryGained: { $sum: '$masteryGained' }
      }
    }
  ]);
};

const Assessment = mongoose.model<IAssessment>('Assessment', assessmentSchema);

export default Assessment; 