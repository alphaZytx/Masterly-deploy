import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISystemLog extends Document {
  userId?: Types.ObjectId;
  userEmail?: string;
  action: string;
  category: 'auth' | 'course' | 'user' | 'system' | 'admin' | 'quiz' | 'recommendation';
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, any>;
  sessionId?: string;
  requestId?: string;
}

const systemLogSchema = new Schema<ISystemLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userEmail: {
    type: String,
    required: false,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['auth', 'course', 'user', 'system', 'admin', 'quiz', 'recommendation'],
    required: true,
    index: true
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info',
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false
  },
  sessionId: {
    type: String,
    required: false,
    index: true
  },
  requestId: {
    type: String,
    required: false,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
systemLogSchema.index({ timestamp: -1 });
systemLogSchema.index({ category: 1, timestamp: -1 });
systemLogSchema.index({ severity: 1, timestamp: -1 });
systemLogSchema.index({ userId: 1, timestamp: -1 });

// TTL index to automatically delete old logs (keep for 90 days)
systemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model<ISystemLog>('SystemLog', systemLogSchema); 