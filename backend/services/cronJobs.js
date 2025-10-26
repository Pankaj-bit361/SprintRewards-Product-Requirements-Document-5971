import cron from 'node-cron';
import { checkAndCreateSprints, rolloverSprints } from './sprintService.js';

// Initialize all cron jobs
export const initializeCronJobs = () => {
  console.log('🕐 Initializing cron jobs...');

  // Check and create sprints every hour
  // This ensures new communities get their first sprint
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running hourly sprint check...');
    try {
      const result = await checkAndCreateSprints();
      console.log(`✅ Sprint check complete: ${result.checked} communities checked`);
    } catch (error) {
      console.error('❌ Error in hourly sprint check:', error);
    }
  });

  // Rollover sprints every Monday at 00:01 (start of new week)
  cron.schedule('1 0 * * 1', async () => {
    console.log('⏰ Running weekly sprint rollover...');
    try {
      const result = await rolloverSprints();
      console.log(`✅ Sprint rollover complete: ${result.rolledOver} sprints rolled over`);
    } catch (error) {
      console.error('❌ Error in sprint rollover:', error);
    }
  });

  // Also check for expired sprints daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running daily sprint expiration check...');
    try {
      const result = await rolloverSprints();
      if (result.rolledOver > 0) {
        console.log(`✅ Expired sprints handled: ${result.rolledOver} sprints`);
      } else {
        console.log('✅ No expired sprints found');
      }
    } catch (error) {
      console.error('❌ Error in daily expiration check:', error);
    }
  });

  console.log('✅ Cron jobs initialized:');
  console.log('   - Hourly sprint check (every hour)');
  console.log('   - Weekly sprint rollover (Mondays at 00:01)');
  console.log('   - Daily expiration check (midnight)');
};

// Manual trigger functions for testing
export const manualSprintCheck = async () => {
  console.log('🔧 Manual sprint check triggered...');
  try {
    const result = await checkAndCreateSprints();
    console.log('✅ Manual sprint check complete:', result);
    return result;
  } catch (error) {
    console.error('❌ Error in manual sprint check:', error);
    throw error;
  }
};

export const manualSprintRollover = async () => {
  console.log('🔧 Manual sprint rollover triggered...');
  try {
    const result = await rolloverSprints();
    console.log('✅ Manual sprint rollover complete:', result);
    return result;
  } catch (error) {
    console.error('❌ Error in manual sprint rollover:', error);
    throw error;
  }
};

