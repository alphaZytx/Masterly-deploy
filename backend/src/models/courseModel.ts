import mongoose, { Schema, Document } from 'mongoose';

const ConceptRefSchema = new Schema({
  conceptId: { type: String, required: true }, // Store ObjectId as string
  title: { type: String, required: true }
}, { _id: false });

const CourseSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, required: true },
  shortDescription: { type: String, required: true },
  thumbnail: { type: String, required: true },
  instructor: {
    id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    bio: { type: String, required: true },
    avatar: String,
    socialLinks: [{
      platform: String,
      url: String
    }]
  },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Beginner to Advanced'],
    required: true
  },
  tags: [{ type: String }],
  concepts: [ConceptRefSchema],
  pricing: {
    type: { type: String, enum: ['free', 'paid'], required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    discountPrice: Number,
    originalPrice: String
  },
  stats: {
    totalStudents: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0, min: 0, max: 100 },
    totalDuration: { type: Number, default: 0 },
    totalConcepts: { type: Number, default: 0 },
    totalVideos: { type: Number, default: 0 },
    totalArticles: { type: Number, default: 0 },
    totalProblems: { type: Number, default: 0 },
    totalQuizzes: { type: Number, default: 0 }
  },
  requirements: [{ type: String }],
  learningOutcomes: [{ type: String }],
  targetAudience: [{ type: String }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  seo: {
    keywords: [{ type: String }]
  },
  isPublic: { type: Boolean, default: true },
  comingSoon: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Course', CourseSchema); 