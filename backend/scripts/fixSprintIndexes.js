import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixSprintIndexes = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const sprintsCollection = db.collection('sprints');

    console.log('\n📋 Current indexes:');
    const indexes = await sprintsCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key);
    });

    // Drop the old sprintNumber_1 index if it exists
    try {
      console.log('\n🗑️  Dropping old sprintNumber_1 index...');
      await sprintsCollection.dropIndex('sprintNumber_1');
      console.log('✅ Old index dropped');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Index sprintNumber_1 does not exist (already dropped)');
      } else {
        console.error('❌ Error dropping index:', error.message);
      }
    }

    // Ensure the correct compound index exists
    console.log('\n🔨 Creating compound index (communityId, sprintNumber)...');
    await sprintsCollection.createIndex(
      { communityId: 1, sprintNumber: 1 },
      { unique: true, name: 'communityId_1_sprintNumber_1' }
    );
    console.log('✅ Compound index created');

    // Ensure the query index exists
    console.log('\n🔨 Creating query index (communityId, status, startDate)...');
    await sprintsCollection.createIndex(
      { communityId: 1, status: 1, startDate: -1 },
      { name: 'communityId_1_status_1_startDate_-1' }
    );
    console.log('✅ Query index created');

    console.log('\n📋 Updated indexes:');
    const updatedIndexes = await sprintsCollection.indexes();
    updatedIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key);
    });

    console.log('\n✅ Sprint indexes fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing sprint indexes:', error);
    process.exit(1);
  }
};

fixSprintIndexes();

