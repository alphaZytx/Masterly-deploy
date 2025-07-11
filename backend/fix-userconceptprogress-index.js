const mongoose = require('mongoose');
require('dotenv').config();

async function fixUserConceptProgressIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('userconceptprogresses');

    // Drop all existing indexes except _id
    console.log('Dropping existing indexes...');
    const indexes = await collection.indexes();
    for (const index of indexes) {
      if (index.name !== '_id_') {
        console.log(`Dropping index: ${index.name}`);
        await collection.dropIndex(index.name);
      }
    }

    // Create the correct indexes
    console.log('Creating correct indexes...');
    
    // Compound unique index for userId, conceptId, courseId
    await collection.createIndex(
      { userId: 1, conceptId: 1, courseId: 1 }, 
      { unique: true, name: 'userId_conceptId_courseId_unique' }
    );
    console.log('Created compound unique index: userId_conceptId_courseId_unique');

    // Index for userId and courseId queries
    await collection.createIndex(
      { userId: 1, courseId: 1 }, 
      { name: 'userId_courseId' }
    );
    console.log('Created index: userId_courseId');

    // Index for conceptId queries
    await collection.createIndex(
      { conceptId: 1 }, 
      { name: 'conceptId' }
    );
    console.log('Created index: conceptId');

    console.log('✅ All indexes fixed successfully!');
    
    // List final indexes
    const finalIndexes = await collection.indexes();
    console.log('\nFinal indexes:');
    finalIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixUserConceptProgressIndexes(); 