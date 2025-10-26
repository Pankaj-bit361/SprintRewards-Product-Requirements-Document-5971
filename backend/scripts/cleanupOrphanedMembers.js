import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Community from '../models/Community.js';
import User from '../models/User.js';

dotenv.config();

const cleanupOrphanedMembers = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Finding communities with orphaned member references...\n');

    const communities = await Community.find({});
    let totalOrphaned = 0;
    let totalCleaned = 0;

    for (const community of communities) {
      console.log(`📋 Checking community: ${community.name} (${community._id})`);
      console.log(`   Total members: ${community.members.length}`);

      const orphanedMembers = [];
      const validMembers = [];

      // Check each member
      for (const member of community.members) {
        const userExists = await User.findById(member.userId);
        
        if (!userExists) {
          orphanedMembers.push(member);
          console.log(`   ❌ Orphaned member found: ${member.userId} (user deleted)`);
        } else {
          validMembers.push(member);
        }
      }

      if (orphanedMembers.length > 0) {
        totalOrphaned += orphanedMembers.length;
        
        // Update community with only valid members
        community.members = validMembers;
        community.stats.totalMembers = validMembers.length;
        await community.save();
        
        totalCleaned += orphanedMembers.length;
        console.log(`   ✅ Cleaned ${orphanedMembers.length} orphaned member(s)`);
      } else {
        console.log(`   ✅ No orphaned members found`);
      }
      
      console.log('');
    }

    console.log('\n📊 Summary:');
    console.log(`   Total communities checked: ${communities.length}`);
    console.log(`   Total orphaned members found: ${totalOrphaned}`);
    console.log(`   Total orphaned members cleaned: ${totalCleaned}`);
    console.log('\n✅ Cleanup completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
};

cleanupOrphanedMembers();

