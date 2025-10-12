import { runWeeklyAICheck } from '../../services/aiService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Running weekly AI eligibility check...');
    await runWeeklyAICheck();
    res.status(200).json({ message: 'Weekly AI check completed successfully' });
  } catch (error) {
    console.error('Weekly AI check error:', error);
    res.status(500).json({ error: 'Weekly AI check failed' });
  }
}
