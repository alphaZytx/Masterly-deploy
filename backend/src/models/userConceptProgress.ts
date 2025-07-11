import mongoose, { Schema } from 'mongoose';

// Individual concept progress schema for sequential learning
const ConceptProgressSchema = new Schema({
  conceptId: {
    type: String, // Now a string, not ObjectId
    required: true
  },
  courseId: {
    type: String, // Now a string, not ObjectId
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  masteryScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  mastered: {
    type: Boolean,
    default: false
  },
  masteredAt: {
    type: Date
  },
  timeSpent: {
    type: Number,
    default: 0 // in seconds
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  // Learning step tracking
  descriptionRead: {
    type: Boolean,
    default: false
  },
  videoWatched: {
    type: Boolean,
    default: false
  },
  quizPassed: {
    type: Boolean,
    default: false
  },
  // Anti-cheating tracking
  failedAttempts: {
    type: Number,
    default: 0
  },
  lastQuizAttempt: {
    type: Date
  }
}, { timestamps: true });

ConceptProgressSchema.index({ userId: 1, conceptId: 1, courseId: 1 }, { unique: true });
ConceptProgressSchema.index({ userId: 1, courseId: 1 });
ConceptProgressSchema.index({ conceptId: 1 });

// Method to mark description as read
ConceptProgressSchema.methods.markDescriptionRead = function() {
  this.descriptionRead = true;
  if (this.status === 'not_started') {
    this.status = 'in_progress';
  }
  this.lastUpdated = new Date();
};

// Method to mark video as watched
ConceptProgressSchema.methods.markVideoWatched = function(watchTime?: number) {
  this.videoWatched = true;
  if (watchTime) {
    this.timeSpent += watchTime;
  }
  this.lastUpdated = new Date();
};

// Method to handle quiz completion
ConceptProgressSchema.methods.handleQuizCompletion = function(score: number, passed: boolean) {
  this.attempts += 1;
  this.lastQuizAttempt = new Date();
  this.masteryScore = Math.max(this.masteryScore, score);
  
  if (passed) {
    this.quizPassed = true;
    this.failedAttempts = 0; // Reset failed attempts on success
    if (score >= 75) {
      this.mastered = true;
      this.masteredAt = new Date();
      this.status = 'completed';
    }
  } else {
    this.failedAttempts += 1;
    // Anti-cheating: reset progress if too many failed attempts
    if (this.failedAttempts >= 3) {
      this.descriptionRead = false;
      this.videoWatched = false;
      this.quizPassed = false;
      this.status = 'in_progress';
    }
  }
  
  this.lastUpdated = new Date();
};

// Method to check if concept is unlocked (prerequisites completed)
ConceptProgressSchema.methods.isUnlocked = function(prerequisites: string[]) {
  if (!prerequisites || prerequisites.length === 0) {
    return true;
  }
  
  // This would need to be checked against other concept progress records
  // For now, return true - this will be handled in the route logic
  return true;
};

export default mongoose.model('UserConceptProgress', ConceptProgressSchema); 