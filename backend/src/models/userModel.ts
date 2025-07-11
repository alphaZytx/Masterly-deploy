import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interfaces for the comprehensive User model
export interface IUserProfile {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  language?: string;
  dateOfBirth?: Date;
  phone?: string;
  website?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
    address: string;
  };
}

export interface IUserSubscription {
  plan: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  paymentMethod?: string;
  billingCycle?: 'monthly' | 'yearly';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface IUserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    courseReminders: boolean;
    achievements: boolean;
    weeklyReports: boolean;
  };
  learning: {
    difficultyPreference: 'beginner' | 'intermediate' | 'advanced' | 'adaptive';
    dailyGoal: number;
    preferredLanguages: string[];
    studyReminders: {
      enabled: boolean;
      time: string;
      days: string[];
    };
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showProgress: boolean;
    showAchievements: boolean;
  };
}

export interface IUserStats {
  totalStudyTime: number;
  coursesCompleted: number;
  coursesEnrolled: number;
  conceptsMastered: number;
  problemsSolved: number;
  quizzesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: Date;
  joinDate: Date;
  level: number;
  experiencePoints: number;
}

export interface IUserAchievement {
  achievementId: Types.ObjectId;
  unlockedAt?: Date;
  progress: number;
}

export interface IUserLearningPath {
  pathId: Types.ObjectId;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  customPath: boolean;
  aiGenerated: boolean;
}

export interface IUserEnrollment {
  courseId: Types.ObjectId;
  enrolledAt: Date;
  progress: number;
  lastAccessedAt?: Date;
  completedAt?: Date;
  certificateIssued: boolean;
  rating?: number;
  review?: string;
}

export interface IQuizAttempt {
  score: number;
  submittedAnswers: number[];
  attemptedAt: Date;
}

// Main User interface
export interface IUser extends Document {
  email: string;
  password?: string;
  googleId?: string;
  profile: IUserProfile & {
    fullName?: string;
  };
  subscription: IUserSubscription;
  preferences: IUserPreferences;
  stats: IUserStats;
  achievements: IUserAchievement[];
  learningPaths: IUserLearningPath[];
  enrollments: IUserEnrollment[];
  isActive: boolean;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  role: 'student' | 'instructor' | 'admin';
  authProvider: 'local' | 'google';
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastLogin(): Promise<IUser>;
  hasPremiumAccess(): boolean;
  calculateLevel(): number;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId; // Password not required if using Google OAuth
      },
      minlength: 6,
    },
    googleId: {
      type: String,
      sparse: true, // Allows multiple null values
    },
    profile: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      displayName: { type: String, trim: true },
      avatar: { type: String },
      bio: { type: String, maxlength: 500 },
      location: { type: String },
      timezone: { type: String, default: "UTC" },
      language: { type: String, default: "en" },
      dateOfBirth: { type: Date },
      phone: { type: String },
      website: { type: String },
      socialLinks: {
        github: { type: String },
        linkedin: { type: String },
        twitter: { type: String },
      },
      emergencyContact: {
        name: { type: String, trim: true },
        relationship: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true },
        address: { type: String, trim: true },
      },
    },
    subscription: {
      plan: { type: String, enum: ["free", "premium", "enterprise"], default: "free" },
      status: { type: String, enum: ["active", "cancelled", "expired", "trial"], default: "active" },
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date },
      autoRenew: { type: Boolean, default: false },
      paymentMethod: { type: String },
      billingCycle: { type: String, enum: ["monthly", "yearly"] },
      stripeCustomerId: { type: String },
      stripeSubscriptionId: { type: String },
    },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        courseReminders: { type: Boolean, default: true },
        achievements: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: true },
      },
      learning: {
        difficultyPreference: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", "adaptive"],
          default: "adaptive",
        },
        dailyGoal: { type: Number, default: 30 }, // minutes
        preferredLanguages: [{ type: String }],
        studyReminders: {
          enabled: { type: Boolean, default: false },
          time: { type: String, default: "09:00" },
          days: [{ type: String }],
        },
      },
      privacy: {
        profileVisibility: { type: String, enum: ["public", "private"], default: "public" },
        showProgress: { type: Boolean, default: true },
        showAchievements: { type: Boolean, default: true },
      },
    },
    stats: {
      totalStudyTime: { type: Number, default: 0 }, // minutes
      coursesCompleted: { type: Number, default: 0 },
      coursesEnrolled: { type: Number, default: 0 },
      conceptsMastered: { type: Number, default: 0 },
      problemsSolved: { type: Number, default: 0 },
      quizzesCompleted: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastActiveDate: { type: Date },
      joinDate: { type: Date, default: Date.now },
      level: { type: Number, default: 1 },
      experiencePoints: { type: Number, default: 0 },
    },
    achievements: [
      {
        achievementId: { type: Schema.Types.ObjectId, ref: "Achievement" },
        unlockedAt: { type: Date },
        progress: { type: Number, default: 0 },
      },
    ],
    learningPaths: [
      {
        pathId: { type: Schema.Types.ObjectId, ref: "LearningPath" },
        status: { type: String, enum: ["active", "completed", "paused"], default: "active" },
        progress: { type: Number, default: 0 },
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
        customPath: { type: Boolean, default: false },
        aiGenerated: { type: Boolean, default: false },
      },
    ],
    enrollments: [
      {
        courseId: { type: Schema.Types.ObjectId, ref: "Course" },
        enrolledAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 },
        lastAccessedAt: { type: Date },
        completedAt: { type: Date },
        certificateIssued: { type: Boolean, default: false },
        rating: { type: Number, min: 1, max: 5 },
        review: { type: String },
      },
    ],
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    lastLoginAt: { type: Date },
    role: { type: String, enum: ["student", "instructor", "admin"], default: "student" },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
userSchema.index({ "profile.displayName": "text" });
userSchema.index({ "subscription.status": 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });

// Virtual for full name
userSchema.virtual("profile.fullName").get(function (this: IUser) {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.displayName || this.email;
});

// Hash password before saving (only if password is modified and not using Google auth)
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (this: IUser, candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function (this: IUser): Promise<IUser> {
  this.lastLoginAt = new Date();
  return this.save();
};

// Check if user has access to premium features
userSchema.methods.hasPremiumAccess = function (this: IUser): boolean {
  return (
    this.subscription.plan !== "free" &&
    this.subscription.status === "active" &&
    (!this.subscription.endDate || this.subscription.endDate > new Date())
  );
};

// Get user's current level based on experience points
userSchema.methods.calculateLevel = function (this: IUser): number {
  const xp = this.stats.experiencePoints;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

// Method to create user from Google profile
userSchema.statics.createFromGoogleProfile = async function (profile: any): Promise<IUser> {
  const user = new this({
    email: profile.emails[0].value,
    googleId: profile.id,
    profile: {
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      displayName: profile.displayName,
      avatar: profile.photos[0]?.value,
    },
    emailVerified: true, // Google accounts are pre-verified
    authProvider: "google",
  });

  return user.save();
};

export default model<IUser>("User", userSchema);