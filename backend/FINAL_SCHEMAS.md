# 🎯 Final Database Schemas - Unified Learning Platform

## 📊 Overview

This document outlines all the final database schemas for our unified learning platform. The system supports multiple courses (DSA, Python, etc.) with flexible learning paths and comprehensive user tracking.

---

## 🗄️ Database Collections

### 1. **`concepts` Collection** - Master Learning Units

**Purpose**: Central repository for all learning concepts across all courses.

```javascript
{
  "_id": ObjectId,
  "title": String,                    // Concept title
  "Concept": String,                  // Concept name (legacy)
  "Level": String,                    // "Basic", "Intermediate", "Advanced"
  "Category": String,                 // "Basics", "Data Structures", etc.
  "Concept_Type": String,             // "Fundamental Programming", etc.
  "course": String,                   // "DSA", "Python", "JavaScript" - NEW FIELD
  "Est_Learning_Time_Hours": Number,  // Estimated learning time
  "Is_Fundamental": Boolean,          // Is this a fundamental concept?
  "Learning_Resources": String,       // Link to resources
  "Related_Concepts": [ObjectId],     // References to related concepts
  "prerequisites": [ObjectId],        // Prerequisite concepts
  "Test_Questions": [                 // Quiz questions
    {
      "id": Number,
      "topic": String,
      "difficulty": "Easy" | "Medium" | "Hard",
      "question": String,
      "options": [String],
      "correct": Number,
      "explanation": String,
      "tags": [String]
    }
  ],
  "articleContent": {                 // Learning content
    "intro": String,
    "levels": [
      {
        "level": String,
        "sections": [
          {
            "heading": String,
            "content": String,
            "codeExamples": [String],
            "complexityAnalysis": {
              "time": String,
              "space": String
            },
            "notes": [String]
          }
        ]
      }
    ]
  },
  "masteryThreshold": Number          // Required score to pass (e.g., 0.75)
}
```

**Key Features**:
- ✅ **Multi-course support**: `course` field identifies DSA, Python, etc.
- ✅ **Flexible content**: Rich article content with code examples
- ✅ **Comprehensive quizzes**: Multiple difficulty levels
- ✅ **Prerequisites**: Knowledge graph relationships
- ✅ **Learning paths**: Ordered progression support

---

### 2. **`courses` Collection** - Course Organization

**Purpose**: Defines course structure and references concepts.

```javascript
{
  "_id": ObjectId,
  "title": String,                    // Course title
  "slug": String,                     // URL-friendly identifier
  "description": String,              // Course description
  "shortDescription": String,         // Brief description
  "thumbnail": String,                // Course image
  "instructor": {                     // Instructor information
    "id": ObjectId,
    "name": String,
    "bio": String,
    "avatar": String,
    "socialLinks": [
      {
        "platform": String,
        "url": String
      }
    ]
  },
  "category": String,                 // "Programming", "Data Science"
  "subcategory": String,              // "Data Structures", "Web Development"
  "level": String,                    // "Beginner", "Intermediate", "Advanced"
  "tags": [String],                   // Search tags
  "topics": [                         // Course topics
    {
      "_id": ObjectId,
      "title": String,
      "description": String,
      "order": Number,
      "icon": String,
      "estimatedHours": Number,
      "useReferencedConcepts": Boolean,  // Use existing concepts or embedded
      "concepts": [                      // Embedded concepts (for new content)
        {
          "_id": ObjectId,
          "title": String,
          "description": String,
          "order": Number,
          "estimatedTime": String,
          "difficulty": "Easy" | "Medium" | "Hard",
          "videos": [VideoSchema],
          "articles": [ArticleSchema],
          "codingProblems": [CodingProblemSchema],
          "quiz": QuizSchema,
          "prerequisites": [ObjectId]
        }
      ],
      "conceptReferences": [             // References to existing concepts
        {
          "_id": ObjectId,
          "conceptId": ObjectId,         // Reference to concepts collection
          "order": Number,
          "isRequired": Boolean,
          "estimatedTime": String,
          "difficulty": "Easy" | "Medium" | "Hard",
          "customTitle": String,         // Optional override
          "customDescription": String,   // Optional override
          "customPrerequisites": [ObjectId]
        }
      ]
    }
  ],
  "pricing": {                         // Course pricing
    "type": "free" | "paid",
    "price": Number,
    "currency": String,
    "discountPrice": Number,
    "originalPrice": String
  },
  "stats": {                           // Course statistics
    "totalStudents": Number,
    "totalRatings": Number,
    "averageRating": Number,
    "totalReviews": Number,
    "completionRate": Number,
    "totalDuration": Number,
    "totalConcepts": Number,
    "totalVideos": Number,
    "totalArticles": Number,
    "totalProblems": Number,
    "totalQuizzes": Number
  },
  "requirements": [String],            // Course requirements
  "learningOutcomes": [String],        // What students will learn
  "targetAudience": [String],          // Who this course is for
  "status": "draft" | "published" | "archived",
  "publishedAt": Date,
  "seo": {                             // SEO information
    "keywords": [String]
  },
  "isPublic": Boolean,
  "comingSoon": Boolean,
  "isActive": Boolean,
  "createdAt": Date,
  "updatedAt": Date
}
```

**Key Features**:
- ✅ **Hybrid concept support**: Both embedded and referenced concepts
- ✅ **Flexible structure**: Topics can use existing concepts or new content
- ✅ **Rich metadata**: Instructor info, pricing, statistics
- ✅ **SEO optimized**: Keywords and metadata
- ✅ **Status management**: Draft, published, archived states

---

### 3. **`learningPaths` Collection** - User Learning Journeys

**Purpose**: Tracks individual user learning paths through courses.

```javascript
{
  "_id": ObjectId,
  "userId": ObjectId,                 // Reference to user
  "courseId": ObjectId,               // Reference to course
  "customPath": [ObjectId],           // Ordered concept IDs
  "startNode": ObjectId,              // Starting concept (optional)
  "skipPrerequisites": Boolean,       // Skip prerequisite assessment
  "currentNode": ObjectId,            // Current concept being learned
  "completedNodes": [ObjectId],       // Completed concept IDs
  "overallProgress": Number,          // 0-100 progress percentage
  "prerequisitesMet": Map,            // Prerequisite status
  "initialAssessment": {              // Initial placement test
    "score": Number,
    "completedAt": Date,
    "questionsAnswered": Number,
    "timeSpent": Number
  },
  "stats": {                          // Learning statistics
    "totalTimeSpent": Number,         // Total minutes
    "totalSessions": Number,          // Number of learning sessions
    "averageSessionTime": Number,     // Average minutes per session
    "streakDays": Number              // Consecutive days
  },
  "status": "active" | "paused" | "completed" | "abandoned",
  "createdAt": Date,
  "updatedAt": Date,
  "lastAccessedAt": Date
}
```

**Key Features**:
- ✅ **Personalized paths**: Custom learning sequences
- ✅ **Progress tracking**: Detailed completion status
- ✅ **Prerequisite management**: Flexible prerequisite handling
- ✅ **Learning analytics**: Time tracking and statistics
- ✅ **Status management**: Active, paused, completed states

---

### 4. **`userNodeProgress` Collection** - Individual Concept Progress

**Purpose**: Tracks user progress at the individual concept level.

```javascript
{
  "_id": ObjectId,
  "userId": ObjectId,                 // Reference to user
  "courseId": ObjectId,               // Reference to course
  "conceptId": ObjectId,              // Reference to concept
  "status": "not_started" | "in_progress" | "completed" | "skipped",
  "progress": Number,                 // 0-100 progress percentage
  "contentProgress": {                // Content completion tracking
    "videosWatched": [
      {
        "videoId": ObjectId,
        "watchedAt": Date,
        "durationWatched": Number,
        "totalDuration": Number
      }
    ],
    "articlesRead": [
      {
        "articleId": ObjectId,
        "readAt": Date,
        "timeSpent": Number
      }
    ],
    "codingProblemsSolved": [
      {
        "problemId": ObjectId,
        "solvedAt": Date,
        "attempts": Number,
        "timeSpent": Number,
        "score": Number
      }
    ]
  },
  "quizAttempts": [                   // Quiz attempt history
    {
      "attemptId": ObjectId,
      "attemptedAt": Date,
      "score": Number,                // 0-100 percentage
      "timeSpent": Number,            // Minutes
      "questionsAnswered": Number,
      "correctAnswers": Number,
      "answers": [                    // Individual question answers
        {
          "questionId": Number,
          "selectedAnswer": Number,
          "isCorrect": Boolean,
          "timeSpent": Number
        }
      ]
    }
  ],
  "prerequisitesCompleted": [ObjectId], // Completed prerequisite concepts
  "masteryScore": Number,             // Calculated mastery (0-10)
  "timeSpent": Number,                // Total time spent (minutes)
  "lastAccessedAt": Date,
  "completedAt": Date,
  "createdAt": Date,
  "updatedAt": Date
}
```

**Key Features**:
- ✅ **Detailed tracking**: Every interaction recorded
- ✅ **Content progress**: Videos, articles, coding problems
- ✅ **Quiz history**: Complete attempt tracking
- ✅ **Mastery scoring**: Calculated proficiency level
- ✅ **Time analytics**: Comprehensive time tracking

---

### 5. **`users` Collection** - User Management

**Purpose**: User accounts and profiles.

```javascript
{
  "_id": ObjectId,
  "name": String,
  "email": String,
  "password": String,                 // Hashed
  "role": "student" | "instructor" | "admin",
  "profile": {
    "avatar": String,
    "bio": String,
    "location": String,
    "website": String,
    "socialLinks": {
      "github": String,
      "linkedin": String,
      "twitter": String
    }
  },
  "preferences": {
    "learningStyle": "visual" | "auditory" | "kinesthetic",
    "difficultyPreference": "easy" | "medium" | "hard",
    "notificationSettings": {
      "email": Boolean,
      "push": Boolean,
      "reminders": Boolean
    }
  },
  "enrolledCourses": [ObjectId],      // Course IDs
  "completedCourses": [ObjectId],     // Completed course IDs
  "achievements": [ObjectId],         // Achievement IDs
  "isActive": Boolean,
  "emailVerified": Boolean,
  "lastLoginAt": Date,
  "createdAt": Date,
  "updatedAt": Date
}
```

---

### 6. **`achievements` Collection** - Gamification

**Purpose**: Achievement system for user engagement.

```javascript
{
  "_id": ObjectId,
  "title": String,
  "description": String,
  "icon": String,
  "category": "learning" | "streak" | "mastery" | "social",
  "criteria": {
    "type": "concepts_completed" | "streak_days" | "mastery_score" | "courses_completed",
    "threshold": Number,
    "timeframe": Number               // Days (optional)
  },
  "rewards": {
    "points": Number,
    "badge": String,
    "unlockContent": [ObjectId]
  },
  "isActive": Boolean,
  "createdAt": Date
}
```

---

### 7. **`assessments` Collection** - Tests and Quizzes

**Purpose**: Comprehensive assessments and tests.

```javascript
{
  "_id": ObjectId,
  "title": String,
  "description": String,
  "type": "placement" | "progress" | "final" | "mock_test",
  "courseId": ObjectId,               // Associated course
  "conceptIds": [ObjectId],           // Concepts covered
  "questions": [
    {
      "_id": ObjectId,
      "type": "mcq" | "true_false" | "fill_blank" | "coding",
      "question": String,
      "options": [String],            // For MCQ
      "correctAnswers": [Number] | String, // For MCQ/True-False or text
      "explanation": String,
      "points": Number,
      "difficulty": "Easy" | "Medium" | "Hard",
      "tags": [String]
    }
  ],
  "settings": {
    "timeLimit": Number,              // Minutes
    "passingScore": Number,           // Percentage
    "maxAttempts": Number,
    "shuffleQuestions": Boolean,
    "showResults": Boolean,
    "allowReview": Boolean
  },
  "isActive": Boolean,
  "createdAt": Date,
  "updatedAt": Date
}
```

---

## 🔗 Relationships Between Collections

### **Concept References**:
- `courses.topics.conceptReferences.conceptId` → `concepts._id`
- `learningPaths.customPath` → `concepts._id`
- `userNodeProgress.conceptId` → `concepts._id`

### **Course References**:
- `learningPaths.courseId` → `courses._id`
- `userNodeProgress.courseId` → `courses._id`
- `assessments.courseId` → `courses._id`

### **User References**:
- `learningPaths.userId` → `users._id`
- `userNodeProgress.userId` → `users._id`
- `userProgress.userId` → `users._id`

---

## 📈 Key Benefits of This Schema Design

### **✅ Scalability**:
- Support for unlimited courses (DSA, Python, JavaScript, etc.)
- Flexible concept organization
- Efficient querying and indexing

### **✅ Flexibility**:
- Hybrid concept approach (embedded + referenced)
- Custom learning paths
- Adaptive prerequisite handling

### **✅ Performance**:
- Denormalized course structure for fast access
- Efficient progress tracking
- Optimized for MongoDB queries

### **✅ User Experience**:
- Personalized learning journeys
- Comprehensive progress tracking
- Gamification with achievements

### **✅ Admin Management**:
- Easy course creation and modification
- Flexible content management
- Rich analytics and reporting

---

## 🚀 Next Steps

1. **Import DSA concepts** with `course: "DSA"` field
2. **Create DSA course** using concept references
3. **Implement learning path system**
4. **Build frontend integration**
5. **Add Python course** with same structure

**This schema design supports all the features we discussed and provides a solid foundation for the unified learning platform!** 