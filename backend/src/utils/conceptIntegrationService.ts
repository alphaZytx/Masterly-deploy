import { Types } from 'mongoose';
import Concept from '../models/conceptModel';
import Course from '../models/courseModel';

export interface ConceptReference {
  conceptId: Types.ObjectId;
  order: number;
  isRequired: boolean;
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  customTitle?: string;
  customDescription?: string;
  customPrerequisites?: Types.ObjectId[];
}

export interface TopicWithReferences {
  title: string;
  description: string;
  order: number;
  icon: string;
  estimatedHours: number;
  useReferencedConcepts: boolean;
  conceptReferences: ConceptReference[];
}

export class ConceptIntegrationService {
  
  /**
   * Create a DSA course using existing concepts
   */
  static async createDSACourse(): Promise<any> {
    try {
      // Get all existing DSA concepts
      const dsaConcepts = await Concept.find({
        category: { $regex: /dsa|data.*structure|algorithm/i }
      }).sort({ order: 1 });

      // Group concepts by topics
      const topics: TopicWithReferences[] = [
        {
          title: "Arrays & Strings",
          description: "Master array operations and string manipulation",
          order: 1,
          icon: "target",
          estimatedHours: 8,
          useReferencedConcepts: true,
          conceptReferences: []
        },
        {
          title: "Linked Lists",
          description: "Understand linked list operations and implementations",
          order: 2,
          icon: "layers",
          estimatedHours: 6,
          useReferencedConcepts: true,
          conceptReferences: []
        },
        {
          title: "Stacks & Queues",
          description: "Learn stack and queue data structures",
          order: 3,
          icon: "database",
          estimatedHours: 5,
          useReferencedConcepts: true,
          conceptReferences: []
        },
        {
          title: "Trees",
          description: "Master tree data structures and algorithms",
          order: 4,
          icon: "tree-pine",
          estimatedHours: 10,
          useReferencedConcepts: true,
          conceptReferences: []
        },
        {
          title: "Graphs",
          description: "Learn graph algorithms and traversal",
          order: 5,
          icon: "network",
          estimatedHours: 12,
          useReferencedConcepts: true,
          conceptReferences: []
        },
        {
          title: "Dynamic Programming",
          description: "Master dynamic programming techniques",
          order: 6,
          icon: "zap",
          estimatedHours: 15,
          useReferencedConcepts: true,
          conceptReferences: []
        }
      ];

      // Map concepts to topics based on their content
      dsaConcepts.forEach((concept, index) => {
        const topicIndex = this.mapConceptToTopic(concept.title, concept.description);
        if (topicIndex >= 0 && topicIndex < topics.length) {
          topics[topicIndex].conceptReferences.push({
            conceptId: concept._id,
            order: index + 1,
            isRequired: true,
            estimatedTime: `${Math.ceil(concept.estLearningTimeHours || 1)}h`,
            difficulty: this.mapComplexityToDifficulty(concept.complexity || 3)
          });
        }
      });

      // Create the course
      const courseData = {
        title: "Complete Data Structures & Algorithms",
        slug: "complete-data-structures-algorithms",
        description: "Master the fundamentals of data structures and algorithms with hands-on practice and real-world examples",
        shortDescription: "Master DSA with comprehensive coverage of all essential topics",
        thumbnail: "https://i.ytimg.com/vi/Qmt0QwzEmh0/maxresdefault.jpg",
        instructor: {
          id: new Types.ObjectId(), // You'll need to set this to an actual instructor ID
          name: "Rohit Negi",
          bio: "IIT Guwahati graduate with highest placement in India (2021). AIR 202 in GATE CSE 2020.",
          avatar: "https://example.com/instructors/rohit.jpg",
          socialLinks: [
            {
              platform: "linkedin",
              url: "https://linkedin.com/in/rohitnegi"
            }
          ]
        },
        category: "Programming",
        subcategory: "Data Structures",
        level: "Beginner to Advanced",
        tags: ["algorithms", "data-structures", "coding-interview", "c++", "java", "python"],
        topics: topics,
        pricing: {
          type: "paid",
          price: 99,
          currency: "USD",
          discountPrice: 79,
          originalPrice: "100"
        },
        stats: {
          totalStudents: 0,
          totalRatings: 0,
          averageRating: 0,
          totalReviews: 0,
          completionRate: 0,
          totalDuration: topics.reduce((sum, topic) => sum + topic.estimatedHours, 0),
          totalConcepts: dsaConcepts.length,
          totalVideos: 0,
          totalArticles: 0,
          totalProblems: 0,
          totalQuizzes: 0
        },
        requirements: [
          "Basic programming knowledge in any language",
          "Understanding of basic mathematics",
          "Willingness to practice coding problems"
        ],
        learningOutcomes: [
          "Master fundamental data structures",
          "Solve complex algorithmic problems",
          "Ace coding interviews",
          "Understand algorithm analysis",
          "Implement efficient solutions"
        ],
        targetAudience: [
          "Software engineering students",
          "Junior developers preparing for interviews",
          "Self-taught programmers",
          "Computer science students"
        ],
        status: "published",
        publishedAt: new Date(),
        seo: {
          keywords: ["data structures", "algorithms", "coding interview", "DSA", "programming"]
        },
        isPublic: true,
        comingSoon: false,
        isActive: true
      };

      const course = new Course(courseData);
      await course.save();

      return {
        success: true,
        course,
        message: "DSA course created successfully with existing concepts"
      };

    } catch (error) {
      console.error("Error creating DSA course:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Map concept to appropriate topic based on title and description
   */
  private static mapConceptToTopic(title: string, description: string): number {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('array') || text.includes('string')) return 0;
    if (text.includes('linked list') || text.includes('list')) return 1;
    if (text.includes('stack') || text.includes('queue')) return 2;
    if (text.includes('tree') || text.includes('binary') || text.includes('bst')) return 3;
    if (text.includes('graph') || text.includes('traversal')) return 4;
    if (text.includes('dynamic programming') || text.includes('dp')) return 5;
    
    return 0; // Default to arrays
  }

  /**
   * Map complexity score to difficulty level
   */
  private static mapComplexityToDifficulty(complexity: number): 'Easy' | 'Medium' | 'Hard' {
    if (complexity <= 2) return 'Easy';
    if (complexity <= 4) return 'Medium';
    return 'Hard';
  }

  /**
   * Get concepts for a specific topic
   */
  static async getConceptsForTopic(topicId: string): Promise<any[]> {
    try {
      const course = await Course.findById(topicId);
      if (!course) return [];

      const topic = course.topics.find(t => t._id.toString() === topicId);
      if (!topic || !topic.useReferencedConcepts) return [];

      const conceptIds = topic.conceptReferences.map(ref => ref.conceptId);
      const concepts = await Concept.find({ _id: { $in: conceptIds } });

      // Merge concept data with reference data
      return topic.conceptReferences.map(ref => {
        const concept = concepts.find(c => c._id.toString() === ref.conceptId.toString());
        return {
          ...concept?.toObject(),
          order: ref.order,
          isRequired: ref.isRequired,
          estimatedTime: ref.estimatedTime,
          difficulty: ref.difficulty,
          title: ref.customTitle || concept?.title,
          description: ref.customDescription || concept?.description
        };
      }).sort((a, b) => a.order - b.order);

    } catch (error) {
      console.error("Error getting concepts for topic:", error);
      return [];
    }
  }

  /**
   * Get all available concepts for course creation
   */
  static async getAvailableConcepts(): Promise<any[]> {
    try {
      const concepts = await Concept.find({})
        .select('title description complexity estLearningTimeHours level category')
        .sort({ category: 1, title: 1 });

      return concepts;
    } catch (error) {
      console.error("Error getting available concepts:", error);
      return [];
    }
  }
}

export default ConceptIntegrationService; 