const mongoose = require('mongoose');
const Course = require('./src/models/courseModel.ts');

// Connect to MongoDB
mongoose.connect('mongodb+srv://ayush:ayush123@cluster0.xfvgvpo.mongodb.net/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addSampleConcepts() {
  try {
    // Find the course by ID
    const courseId = '685fc69504baeb1d731511c7'; // The course ID from the error
    const course = await Course.findById(courseId);
    
    if (!course) {
      console.log('Course not found');
      return;
    }

    console.log('Found course:', course.title);

    // Sample concepts for Data Structures & Algorithms
    const sampleConcepts = [
      {
        conceptId: 'concept_arrays_001',
        title: 'Introduction to Arrays',
        description: 'Learn the fundamentals of array data structure',
        estimatedTime: '2h 30m',
        difficulty: 'Beginner',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        prerequisites: []
      },
      {
        conceptId: 'concept_linked_lists_001',
        title: 'Linked Lists Fundamentals',
        description: 'Understanding singly and doubly linked lists',
        estimatedTime: '3h 15m',
        difficulty: 'Intermediate',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        prerequisites: ['concept_arrays_001']
      },
      {
        conceptId: 'concept_stacks_001',
        title: 'Stacks and Queues',
        description: 'Stack and queue data structures implementation',
        estimatedTime: '2h 45m',
        difficulty: 'Intermediate',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        prerequisites: ['concept_linked_lists_001']
      },
      {
        conceptId: 'concept_trees_001',
        title: 'Binary Trees',
        description: 'Tree data structure fundamentals and traversal',
        estimatedTime: '4h 20m',
        difficulty: 'Advanced',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        prerequisites: ['concept_stacks_001']
      },
      {
        conceptId: 'concept_graphs_001',
        title: 'Graph Algorithms',
        description: 'Graph representation and basic algorithms',
        estimatedTime: '5h 10m',
        difficulty: 'Advanced',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        prerequisites: ['concept_trees_001']
      }
    ];

    // Update the course with concepts
    course.concepts = sampleConcepts.map(concept => ({
      conceptId: concept.conceptId,
      title: concept.title
    }));

    // Update stats
    course.stats.totalConcepts = sampleConcepts.length;
    course.stats.totalDuration = sampleConcepts.reduce((total, concept) => {
      const timeStr = concept.estimatedTime;
      const hours = parseInt(timeStr.split('h')[0]);
      const minutes = parseInt(timeStr.split('h')[1]?.split('m')[0]) || 0;
      return total + (hours * 60 + minutes);
    }, 0);

    await course.save();
    console.log('✅ Sample concepts added successfully!');
    console.log('Concepts added:', sampleConcepts.length);
    console.log('Total duration:', course.stats.totalDuration, 'minutes');

    // Also create the actual concept documents in the Concept collection
    const Concept = require('./src/models/conceptModel.ts');
    
    for (const conceptData of sampleConcepts) {
      const concept = new Concept({
        conceptId: conceptData.conceptId,
        title: conceptData.title,
        description: conceptData.description,
        videoUrl: conceptData.videoUrl,
        prerequisites: conceptData.prerequisites,
        content: {
          intro: `Welcome to ${conceptData.title}! This concept will teach you the fundamentals and practical applications.`,
          sections: [
            {
              heading: 'Overview',
              content: `In this section, you'll learn the basic principles and importance of ${conceptData.title.toLowerCase()}.`,
              codeExamples: []
            },
            {
              heading: 'Implementation',
              content: `Here we'll explore how to implement ${conceptData.title.toLowerCase()} in practice.`,
              codeExamples: ['// Sample code will be added here']
            }
          ]
        },
        quiz: {
          questions: [
            {
              questionId: 'q1',
              text: `What is the primary purpose of ${conceptData.title.toLowerCase()}?`,
              options: ['Data storage', 'Algorithm optimization', 'Memory management', 'All of the above'],
              answer: 3,
              explanation: 'This concept serves multiple purposes in computer science.'
            }
          ]
        },
        tags: ['data-structures', 'algorithms', conceptData.difficulty.toLowerCase()]
      });
      
      await concept.save();
      console.log(`✅ Created concept: ${conceptData.title}`);
    }

  } catch (error) {
    console.error('Error adding sample concepts:', error);
  } finally {
    mongoose.connection.close();
  }
}

addSampleConcepts(); 