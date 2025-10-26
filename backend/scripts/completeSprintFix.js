import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const completeSprintFix = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const sprintsCollection = db.collection('sprints');

    console.log('\n📋 Step 1: List all current indexes');
    const indexes = await sprintsCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key);
    });

    console.log('\n🗑️  Step 2: Drop ALL indexes except _id');
    for (const index of indexes) {
      if (index.name !== '_id_') {
        try {
          await sprintsCollection.dropIndex(index.name);
          console.log(`  ✅ Dropped: ${index.name}`);
        } catch (error) {
          console.log(`  ❌ Failed to drop ${index.name}:`, error.message);
        }
      }
    }

    console.log('\n🗑️  Step 3: Delete all existing sprints');
    const deleteResult = await sprintsCollection.deleteMany({});
    console.log(`  ✅ Deleted ${deleteResult.deletedCount} sprints`);

    console.log('\n🔨 Step 4: Create correct indexes');
    
    // Create compound unique index
    await sprintsCollection.createIndex(
      { communityId: 1, sprintNumber: 1 },
      { unique: true, name: 'communityId_1_sprintNumber_1' }
    );
    console.log('  ✅ Created: communityId_1_sprintNumber_1 (unique)');

    // Create query index
    await sprintsCollection.createIndex(
      { communityId: 1, status: 1, startDate: -1 },
      { name: 'communityId_1_status_1_startDate_-1' }
    );
    console.log('  ✅ Created: communityId_1_status_1_startDate_-1');

    console.log('\n📋 Step 5: Verify final indexes');
    const finalIndexes = await sprintsCollection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key, index.unique ? '(unique)' : '');
    });

    console.log('\n✅ Complete sprint fix successful!');
    console.log('\nℹ️  Next steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. New sprints will be created automatically');
    console.log('   3. No more duplicate key errors!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
};

completeSprintFix();

