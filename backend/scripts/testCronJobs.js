import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { checkAndCreateSprints, rolloverSprints } from '../services/sprintService.js';

dotenv.config();

const testCronJobs = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TESTING CRON JOB: Sprint Check');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('⏰ Running checkAndCreateSprints()...\n');
    const checkResult = await checkAndCreateSprints();
    
    console.log('\n📊 Results:');
    console.log(`   Communities checked: ${checkResult.checked}`);
    console.log(`   Results:`);
    checkResult.results.forEach((result, index) => {
      console.log(`\n   ${index + 1}. Community: ${result.communityName}`);
      console.log(`      ID: ${result.communityId}`);
      if (result.error) {
        console.log(`      ❌ Error: ${result.error}`);
      } else {
        console.log(`      ✅ Sprint #${result.sprintNumber} - ${result.status}`);
      }
    });

    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('🧪 TESTING CRON JOB: Sprint Rollover');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('⏰ Running rolloverSprints()...\n');
    const rolloverResult = await rolloverSprints();
    
    console.log('\n📊 Results:');
    console.log(`   Sprints rolled over: ${rolloverResult.rolledOver}`);
    if (rolloverResult.rolledOver > 0) {
      console.log(`   Details:`);
      rolloverResult.results.forEach((result, index) => {
        console.log(`\n   ${index + 1}. Community: ${result.communityId}`);
        if (result.error) {
          console.log(`      ❌ Error: ${result.error}`);
        } else {
          console.log(`      ✅ Completed Sprint #${result.completedSprint}`);
          console.log(`      ✅ Created Sprint #${result.newSprint}`);
        }
      });
    } else {
      console.log('   ℹ️  No expired sprints found (this is normal)');
    }

    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('✅ CRON JOB TEST COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error testing cron jobs:', error);
    process.exit(1);
  }
};

testCronJobs();

