const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const LIST_NAME = process.env.HUBSPOT_LIST_NAME || 'Soumission Simulateur';
const CONTACTS_OBJECT_TYPE_ID = '0-1';

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
  const data = await res.json();
  return data.results?.[0]?.id;
}

// La liste doit être de type "manuelle" (statique) dans HubSpot : seules
// celles-ci acceptent un ajout de membres via l'API. L'id est mis en cache
// après le premier lookup réussi pour éviter un appel API par soumission.
let cachedListId;
async function getListId() {
  if (cachedListId) return cachedListId;
  const res = await fetch(
    `https://api.hubapi.com/crm/v3/lists/object-type-id/${CONTACTS_OBJECT_TYPE_ID}/name/${encodeURIComponent(LIST_NAME)}`,
    { headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}` } }
  );
  if (!res.ok) throw new Error(`HubSpot list lookup ${res.status}: ${await res.text()}`);
  const data = await res.json();
  cachedListId = data.list?.listId;
  return cachedListId;
}

async function addContactToList(contactId, listId) {
  const res = await fetch(`https://api.hubapi.com/crm/v3/lists/${listId}/memberships/add`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([String(contactId)]),
  });
  if (!res.ok) throw new Error(`HubSpot list membership ${res.status}: ${await res.text()}`);
}

// Pousse (crée ou met à jour, par e-mail) le lead comme contact HubSpot et
// l'ajoute à la liste dédiée aux soumissions du simulateur.
// N'échoue jamais bruyamment : une soumission ne doit jamais être bloquée
// par une panne ou une mauvaise config côté HubSpot.
export async function pushLeadToHubspot({ answers, result }) {
  if (!HUBSPOT_TOKEN || !answers?.email) return { skipped: true };

  let contactId;
  try {
    contactId = await upsertContact(answers.email, { ...baseProperties(answers), ...customProperties(answers, result) });
  } catch (err) {
    console.error('HubSpot push (propriétés custom) a échoué, on retente avec les champs standard seuls:', err.message);
    try {
      contactId = await upsertContact(answers.email, baseProperties(answers));
    } catch (err2) {
      console.error('HubSpot push a échoué:', err2.message);
      return { skipped: false };
    }
  }

  try {
    const listId = await getListId();
    if (listId) await addContactToList(contactId, listId);
  } catch (err) {
    console.error(`HubSpot: échec de l'ajout à la liste "${LIST_NAME}":`, err.message);
  }

  return { skipped: false };
}
