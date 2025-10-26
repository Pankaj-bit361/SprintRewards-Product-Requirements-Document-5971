import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Community from '../models/Community.js';
import Sprint from '../models/Sprint.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Helper: Get start of week (Monday 00:00:00)
const getStartOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Helper: Get end of week (Sunday 23:59:59)
const getEndOfWeek = (date = new Date()) => {
  const startOfWeek = getStartOfWeek(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
};

const manualSprintTest = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 STEP 1: Get All Communities');
    console.log('═══════════════════════════════════════════════════════\n');

    const communities = await Community.find({});
    console.log(`Found ${communities.length} communities:\n`);
    
    communities.forEach((community, index) => {
      console.log(`${index + 1}. ${community.name}`);
      console.log(`   ID: ${community._id}`);
      console.log(`   Owner: ${community.owner}`);
      console.log(`   Members: ${community.members.length}`);
      console.log(`   Settings:`);
      console.log(`     - Points per sprint: ${community.settings.pointsPerSprint}`);
      console.log(`     - Eligibility threshold: ${community.settings.eligibilityThreshold}`);
      console.log('');
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 STEP 2: Check Existing Sprints');
    console.log('═══════════════════════════════════════════════════════\n');

    const existingSprints = await Sprint.find({});
    console.log(`Found ${existingSprints.length} existing sprints:\n`);
    
    existingSprints.forEach((sprint, index) => {
      console.log(`${index + 1}. Sprint #${sprint.sprintNumber}`);
      console.log(`   Community ID: ${sprint.communityId}`);
      console.log(`   Status: ${sprint.status}`);
      console.log(`   Start: ${sprint.startDate.toISOString()}`);
      console.log(`   End: ${sprint.endDate.toISOString()}`);
      console.log('');
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔨 STEP 3: Create Sprints for Each Community');
    console.log('═══════════════════════════════════════════════════════\n');

    const now = new Date();
    const startDate = getStartOfWeek(now);
    const endDate = getEndOfWeek(now);

    console.log(`Current week: ${startDate.toISOString()} to ${endDate.toISOString()}\n`);

    for (const community of communities) {
      console.log(`\n📌 Processing: ${community.name}`);
      console.log(`   Community ID: ${community._id}`);

      // Check if sprint already exists for this community
      const existingSprint = await Sprint.findOne({
        communityId: community._id,
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now }
      });

      if (existingSprint) {
        console.log(`   ℹ️  Active sprint already exists: Sprint #${existingSprint.sprintNumber}`);
        console.log(`   Start: ${existingSprint.startDate.toISOString()}`);
        console.log(`   End: ${existingSprint.endDate.toISOString()}`);
        continue;
      }

      // Get sprint count for this community
      const sprintCount = await Sprint.countDocuments({ communityId: community._id });
      console.log(`   Current sprint count: ${sprintCount}`);

      // Create new sprint
      try {
        const newSprint = new Sprint({
          sprintNumber: sprintCount + 1,
          communityId: community._id,
          startDate,
          endDate,
          status: 'active'
        });

        await newSprint.save();
        console.log(`   ✅ Created Sprint #${newSprint.sprintNumber}`);
        console.log(`   Start: ${newSprint.startDate.toISOString()}`);
        console.log(`   End: ${newSprint.endDate.toISOString()}`);
      } catch (error) {
        console.log(`   ❌ Error creating sprint: ${error.message}`);
        if (error.code === 11000) {
          console.log(`   ℹ️  This is the duplicate key error we've been seeing`);
        }
      }
    }

    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📋 STEP 4: Final Sprint Count');
    console.log('═══════════════════════════════════════════════════════\n');

    const finalSprints = await Sprint.find({});
    console.log(`Total sprints in database: ${finalSprints.length}\n`);

    finalSprints.forEach((sprint, index) => {
      console.log(`${index + 1}. Sprint #${sprint.sprintNumber} (Community: ${sprint.communityId})`);
      console.log(`   Status: ${sprint.status}`);
      console.log(`   Period: ${sprint.startDate.toISOString()} to ${sprint.endDate.toISOString()}`);
      console.log('');
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ MANUAL SPRINT TEST COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

manualSprintTest();

