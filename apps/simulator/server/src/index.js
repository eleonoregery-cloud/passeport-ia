import express from 'express';
import cors from 'cors';
import { computeResult } from '../../shared/rules.js';
import { saveSubmission } from '../../shared/supabaseClient.js';
import { pushLeadToHubspot } from '../../shared/hubspot.js';

const app = express(); app.use(cors()); app.use(express.json());

app.post('/api/results', async (req, res) => {
  const answers = req.body.answers || {};
  const result = computeResult(answers);
  try {
    await saveSubmission({ answers, result });
  } catch (err) {
    console.error('Supabase insert failed:', err.message);
  }
  await pushLeadToHubspot({ answers, result });
  res.json(result);
});

app.listen(process.env.PORT || 3001, () => console.log('API available on port 3001'));
