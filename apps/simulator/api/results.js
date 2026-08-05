import { computeResult } from '../shared/rules.js';
import { saveSubmission } from '../shared/supabaseClient.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const answers = (req.body && req.body.answers) || {};
  const result = computeResult(answers);
  try {
    await saveSubmission({ answers, result });
  } catch (err) {
    console.error('Supabase insert failed:', err.message);
  }
  res.status(200).json(result);
}
