import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Community from '../models/Community.js';

dotenv.config();

const updateCommunityPoints = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Finding communities with old points settings...\n');

    const communities = await Community.find({});
    let totalUpdated = 0;

    for (const community of communities) {
      const currentPoints = community.settings?.rewardPointsPerSprint || 2000;
      
      console.log(`📋 Community: ${community.name} (${community._id})`);
      console.log(`   Current rewardPointsPerSprint: ${currentPoints}`);

      if (currentPoints === 2000) {
        // Update to 500
        if (!community.settings) {
          community.settings = {};
        }
        community.settings.rewardPointsPerSprint = 500;
        await community.save();
        
        totalUpdated++;
        console.log(`   ✅ Updated to 500 points\n`);
      } else {
        console.log(`   ℹ️  Already set to ${currentPoints} points (no change needed)\n`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total communities checked: ${communities.length}`);
    console.log(`   Total communities updated: ${totalUpdated}`);
    console.log('\n✅ Update completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during update:', error);
    process.exit(1);
  }
};

updateCommunityPoints();

