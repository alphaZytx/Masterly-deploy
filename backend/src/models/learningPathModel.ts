import mongoose, { Schema, Document, Types } from 'mongoose';

// Learning Path Schema for user-specific learning journeys
const LearningPathSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  courseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  
  // Path Configuration
  customPath: [{
    type: Schema.Types.ObjectId, // References to concepts within the course
    required: true
  }],
  startNode: { 
    type: Schema.Types.ObjectId, // If user wants to start from specific concept
  },
  skipPrerequisites: { 
    type: Boolean, 
    default: false 
  },
  
  // Assessment Results
  initialAssessment: {
    score: { type: Number, min: 0, max: 100 },
    recommendedStartNode: { type: Schema.Types.ObjectId },
    masteryLevel: { 
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    completedAt: { type: Date }
  },
  
  // Progress Tracking
  currentNode: { 
    type: Schema.Types.ObjectId, 
    required: true 
  },
  completedNodes: [{
    type: Schema.Types.ObjectId
  }],
  overallProgress: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 100 
  },
  
  // Prerequisites Status
  prerequisitesMet: {
    type: Map,
    of: {
      conceptId: Schema.Types.ObjectId,
      met: { type: Boolean, default: false },
      testPassed: { type: Boolean, default: false },
      testScore: { type: Number, min: 0, max: 100 },
      contentCompleted: { type: Boolean, default: false },
      completedAt: { type: Date }
    }
  },
  
  // Learning Statistics
    stats: {
    totalTimeSpent: { type: Number, default: 0 }, // in minutes
    totalSessions: { type: Number, default: 0 },
    averageSessionTime: { type: Number, default: 0 },
    lastSessionAt: { type: Date },
    streakDays: { type: Number, default: 0 },
    lastStudyDate: { type: Date }
  },
  
  // Path Metadata
  status: { 
    type: String, 
    enum: ['active', 'paused', 'completed', 'abandoned'], 
    default: 'active' 
  },
  estimatedCompletion: { type: Date },
  actualCompletion: { type: Date },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastAccessedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for performance
LearningPathSchema.index({ userId: 1, courseId: 1 }, { unique: true });
LearningPathSchema.index({ userId: 1, status: 1 });
LearningPathSchema.index({ courseId: 1, status: 1 });

// Virtual for completion percentage
LearningPathSchema.virtual('completionPercentage').get(function() {
  return this.overallProgress;
});

// Method to update progress
LearningPathSchema.methods.updateProgress = function() {
  if (this.completedNodes.length === 0) {
    this.overallProgress = 0;
  } else {
    this.overallProgress = Math.round((this.completedNodes.length / this.customPath.length) * 100);
  }
  
  // Update status if completed
  if (this.overallProgress >= 100) {
    this.status = 'completed';
    this.actualCompletion = new Date();
  }
};

// Method to mark node as completed
LearningPathSchema.methods.completeNode = function(nodeId: Types.ObjectId) {
  if (!this.completedNodes.includes(nodeId)) {
    this.completedNodes.push(nodeId);
  }
  this.updateProgress();
};

// Method to check if prerequisites are met
LearningPathSchema.methods.checkPrerequisites = function(nodeId: Types.ObjectId) {
  const prerequisiteInfo = this.prerequisitesMet.get(nodeId.toString());
  return prerequisiteInfo ? prerequisiteInfo.met : false;
};

// Pre-save middleware
LearningPathSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastAccessedAt = new Date();
  next();
});

export interface ILearningPath extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  customPath: Types.ObjectId[];
  startNode?: Types.ObjectId;
  skipPrerequisites: boolean;
  initialAssessment?: {
    score: number;
    recommendedStartNode: Types.ObjectId;
    masteryLevel: 'beginner' | 'intermediate' | 'advanced';
    completedAt: Date;
  };
  currentNode: Types.ObjectId;
  completedNodes: Types.ObjectId[];
  overallProgress: number;
  prerequisitesMet: Map<string, {
    conceptId: Types.ObjectId;
    met: boolean;
    testPassed: boolean;
    testScore: number;
    contentCompleted: boolean;
    completedAt?: Date;
  }>;
  stats: {
    totalTimeSpent: number;
    totalSessions: number;
    averageSessionTime: number;
    lastSessionAt?: Date;
    streakDays: number;
    lastStudyDate?: Date;
  };
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  updateProgress(): void;
  completeNode(nodeId: Types.ObjectId): void;
  checkPrerequisites(nodeId: Types.ObjectId): boolean;
}

const LearningPath = mongoose.model<ILearningPath>('LearningPath', LearningPathSchema);

export default LearningPath; 