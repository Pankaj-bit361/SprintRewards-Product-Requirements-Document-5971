import { resetSprint } from '../../services/aiService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Resetting sprint...');
    await resetSprint();
    res.status(200).json({ message: 'Sprint reset completed successfully' });
  } catch (error) {
    console.error('Sprint reset error:', error);
    res.status(500).json({ error: 'Sprint reset failed' });
  }
}