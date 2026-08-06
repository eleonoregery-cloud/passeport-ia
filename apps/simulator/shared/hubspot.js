const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// Propriétés standard HubSpot (existent par défaut sur tout compte).
function baseProperties(answers) {
  return {
    email: answers.email,
    firstname: answers.firstName || undefined,
    lastname: answers.lastName || undefined,
    company: answers.company || undefined,
    phone: answers.phone || undefined,
  };
}

// Propriétés custom : à créer côté HubSpot (Paramètres > Propriétés > Contact)
// avec ces noms internes avant qu'elles remontent. Si elles n'existent pas
// encore, l'appel échoue et on retombe sur les propriétés standard seules.
function customProperties(answers, result) {
  return {
    risk_score: result?.riskScore != null ? String(result.riskScore) : undefined,
    conformite: result?.conforme != null ? (result.conforme ? 'Conforme' : 'Non conforme') : undefined,
    secteur: answers.sector || undefined,
    taille_entreprise: answers.size || undefined,
  };
}

function clean(properties) {
  return Object.fromEntries(Object.entries(properties).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

async function upsertContact(email, properties) {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert', {
    method: 'POST',
    headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: [{ idProperty: 'email', id: email, properties: clean(properties) }] }),
  });
  if (!res.ok) throw new Error(`HubSpot ${res.status}: ${await res.text()}`);
}

// Pousse (crée ou met à jour, par e-mail) le lead comme contact HubSpot.
// N'échoue jamais bruyamment : une soumission ne doit jamais être bloquée
// par une panne ou une mauvaise config côté HubSpot.
export async function pushLeadToHubspot({ answers, result }) {
  if (!HUBSPOT_TOKEN || !answers?.email) return { skipped: true };
  try {
    await upsertContact(answers.email, { ...baseProperties(answers), ...customProperties(answers, result) });
  } catch (err) {
    console.error('HubSpot push (propriétés custom) a échoué, on retente avec les champs standard seuls:', err.message);
    try {
      await upsertContact(answers.email, baseProperties(answers));
    } catch (err2) {
      console.error('HubSpot push a échoué:', err2.message);
    }
  }
  return { skipped: false };
}
