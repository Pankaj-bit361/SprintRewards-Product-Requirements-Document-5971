import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Sprint from '../models/Sprint.js';
import { createWeeklySprint } from '../services/sprintService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const testPointsAllocation = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 STEP 1: Check Current User Points');
    console.log('═══════════════════════════════════════════════════════\n');

    const users = await User.find({});
    console.log(`Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Reward Points: ${user.rewardPoints}`);
      console.log(`   Sprint Points: ${user.sprintPoints}`);
      console.log('');
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🗑️  STEP 2: Delete Existing Sprint');
    console.log('═══════════════════════════════════════════════════════\n');

    const deleteResult = await Sprint.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} sprints\n`);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎁 STEP 3: Create New Sprint (Should Allocate Points)');
    console.log('═══════════════════════════════════════════════════════\n');

    const communities = await Community.find({});
    
    for (const community of communities) {
      console.log(`\n📌 Creating sprint for: ${community.name}`);
      console.log(`   Community ID: ${community._id}`);
      console.log(`   Members: ${community.members.length}`);
      console.log(`   Settings:`);
      console.log(`     - Reward Points Per Sprint: ${community.settings?.rewardPointsPerSprint || 500}`);
      
      try {
        const sprint = await createWeeklySprint(community._id);
        console.log(`   ✅ Sprint #${sprint.sprintNumber} created successfully`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📊 STEP 4: Check Updated User Points');
    console.log('═══════════════════════════════════════════════════════\n');

    const updatedUsers = await User.find({});
    console.log(`Checking ${updatedUsers.length} users:\n`);
    
    updatedUsers.forEach((user, index) => {
      const originalUser = users.find(u => u._id.toString() === user._id.toString());
      const pointsAdded = user.rewardPoints - (originalUser?.rewardPoints || 0);
      
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Reward Points: ${originalUser?.rewardPoints || 0} → ${user.rewardPoints} (+${pointsAdded})`);
      console.log(`   Sprint Points: ${user.sprintPoints}`);
      console.log('');
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ POINTS ALLOCATION TEST COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

testPointsAllocation();

