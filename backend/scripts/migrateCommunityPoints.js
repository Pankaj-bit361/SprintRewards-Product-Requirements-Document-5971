import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const migrateCommunityPoints = async () => {
  try {
    console.log('🔄 Starting community points migration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to migrate\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.name} (${user.email})`);
      console.log(`   Global points: ${user.rewardPoints || 0}`);
      console.log(`   Communities: ${user.communities.length}`);

      let updated = false;

      for (let i = 0; i < user.communities.length; i++) {
        const community = user.communities[i];
        
        // Check if community already has points
        if (community.rewardPoints > 0) {
          console.log(`   ✓ Community ${i + 1} already has ${community.rewardPoints} points - skipping`);
          continue;
        }

        // Migrate global points to community-specific points
        // Each community gets the user's current global points
        user.communities[i].rewardPoints = user.rewardPoints || 0;
        user.communities[i].totalGiven = user.totalGiven || 0;
        user.communities[i].totalReceived = user.totalReceived || 0;

        console.log(`   ✅ Migrated ${user.rewardPoints || 0} points to community ${i + 1}`);
        updated = true;
      }

      if (updated) {
        await user.save();
        migratedCount++;
        console.log(`   💾 Saved user data`);
      } else {
        skippedCount++;
        console.log(`   ⏭️  No migration needed`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration Complete!');
    console.log('='.repeat(60));
    console.log(`📊 Total users: ${users.length}`);
    console.log(`✅ Migrated: ${migratedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateCommunityPoints();

