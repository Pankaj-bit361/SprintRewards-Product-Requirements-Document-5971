import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const migrateExistingSprints = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const sprintsCollection = db.collection('sprints');
    const communitiesCollection = db.collection('communities');

    // Get all existing sprints
    const existingSprints = await sprintsCollection.find({}).toArray();
    console.log(`\n📊 Found ${existingSprints.length} existing sprints`);

    if (existingSprints.length === 0) {
      console.log('✅ No sprints to migrate');
      process.exit(0);
    }

    // Get all communities
    const communities = await communitiesCollection.find({}).toArray();
    console.log(`📊 Found ${communities.length} communities`);

    if (communities.length === 0) {
      console.log('❌ No communities found. Cannot migrate sprints.');
      process.exit(1);
    }

    // Option 1: Delete all existing sprints and let the system recreate them
    console.log('\n🗑️  Deleting all existing sprints...');
    const deleteResult = await sprintsCollection.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} sprints`);

    console.log('\n✅ Sprint migration complete!');
    console.log('ℹ️  New sprints will be automatically created when:');
    console.log('   - Users log in');
    console.log('   - Communities are accessed');
    console.log('   - Cron jobs run');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error migrating sprints:', error);
    process.exit(1);
  }
};

migrateExistingSprints();

