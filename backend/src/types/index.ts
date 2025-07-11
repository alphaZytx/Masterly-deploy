import { Document, Types } from 'mongoose';

export interface ITestQuestion {
    id: number;
    topic: string;
    difficulty: "Easy" | "Medium" | "Hard";
    question: string;
    options: string[];
    correct: number;
    explanation: string;
    tags: string[];
}

export interface IQuizQuestion {
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    explanation?: string;
}

export interface IQuizAttempt {
    score: number;
    submittedAnswers: number[];
    attemptedAt: Date;
}

export interface IArticleContent {
    intro: string;
    levels: Array<{
        level: string;
        sections: Array<{
            heading: string;
            content: string;
            codeExamples?: Array<{
                language: string;
                code: string;
                explanation: string;
            }>;
            complexityAnalysis?: {
                timeComplexity: string;
                spaceComplexity: string;
                explanation: string;
            };
            notes?: string[];
            imageUrl?: string;
        }>;
    }>;
}

export interface IConcept extends Document {
    title: string;
    Concept?: string;
    Level?: string;
    Category?: string;
    Concept_Type?: string;
    Est_Learning_Time_Hours?: number;
    Is_Fundamental?: boolean;
    Learning_Resources?: string;
    Related_Concepts?: Types.ObjectId[];
    Test_Questions?: ITestQuestion[];
    articleContent?: IArticleContent;
    prerequisites?: Types.ObjectId[];
    
    relatedConcepts?: string[];
    description: string;
    level?: string;
    category?: string;
    complexity?: number;
    conceptType?: string;
    estLearningTimeHours?: number;
    isFundamental?: boolean;
    learningResources?: string;
    contentBlocks: { type: string; data: string }[];
    quiz: IQuizQuestion[];
}

// Course interface for the new course model
export interface ICourse extends Document {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    description: string;
    shortDescription?: string;
    thumbnail: string;
    bannerImage?: string;
    category: 'Programming' | 'Data Science' | 'Web Dev' | 'Mobile' | 'DevOps' | 'Cybersecurity' | 'AI/ML' | 'Blockchain' | 'Game Development' | 'Design';
    subcategory?: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Beginner to Advanced';
    tags: string[];
    concepts: any[];
    syllabus: string[];
    prerequisites: string[];
    instructor: {
        name: string;
        bio?: string;
        avatar?: string;
        credentials?: string[];
        socialLinks?: {
            linkedin?: string;
            twitter?: string;
            github?: string;
            website?: string;
        };
    };
    duration: string;
    totalConcepts: number;
    totalTopics: number;
    language: string;
    subtitles: string[];
    pricing: {
        type: 'free' | 'premium' | 'one-time';
        amount: number;
        currency: string;
        discountPercentage: number;
        originalPrice: number;
    };
    status: 'draft' | 'published' | 'coming_soon' | 'archived';
    isPublic: boolean;
    isFeatured: boolean;
    isActive: boolean;
    comingSoon: boolean;
    stats: {
        enrollments: number;
        completions: number;
        averageRating: number;
        totalRatings: number;
        totalReviews: number;
        views: number;
    };
    reviews: any[];
    requirements: string[];
    learningOutcomes: string[];
    targetAudience: string[];
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string[];
    };
    certificate: {
        enabled: boolean;
        template?: string;
        criteria: {
            completionPercentage: number;
            minimumScore: number;
        };
    };
    
    // Virtuals
    completionRate?: number;
    
    // Methods
    calculateAverageRating(): number;
    addReview(userId: Types.ObjectId, rating: number, comment?: string): Promise<ICourse>;
}

// Updated IUser interface
export interface IUser extends Document {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    googleId?: string;
    githubId?: string;
    role: 'user' | 'admin';
    learningProfile: {
        concept: Types.ObjectId;
        masteryLevel: number;
        quizAttempts: IQuizAttempt[];
    }[];
    learningPath?: {
        pathType: 'course' | 'topic';
        selectedGoal?: string;
        selectedConcept?: string;
        generatedPath: any[];
        alternativeRoutes: any[][];
        selectedRoute: number;
        savedAt: Date;
    };
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    isModified: (field: string) => boolean;
    getResetPasswordToken: () => string;
    studySessions?: {
        date: Date;
        durationMinutes: number;
    }[];
}