import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

// Clé publique (anon) volontairement utilisée ici : la table submissions
// n'autorise que l'INSERT pour ce rôle via RLS, jamais la lecture.
// Voir supabase/migrations/0001_init.sql.
export const supabase = url && key ? createClient(url, key) : null;

// Le client (main.jsx) stocke les coordonnées (prénom, nom, entreprise...)
// directement dans l'objet answers, au même titre que les réponses au
// questionnaire (voir la section "Vos coordonnées" du formulaire).
export async function saveSubmission({ answers, result }) {
  if (!supabase) return { skipped: true };
  const { error } = await supabase.from('submissions').insert({
    first_name: answers.firstName || null,
    last_name: answers.lastName || null,
    company: answers.company || null,
    email: answers.email || null,
    phone: answers.phone || null,
    consent: !!answers.consent,
    sector: answers.sector || null,
    size: answers.size || null,
    answers,
    result,
    risk_score: result.riskScore,
    conforme: result.conforme,
  });
  if (error) throw error;
  return { skipped: false };
}
