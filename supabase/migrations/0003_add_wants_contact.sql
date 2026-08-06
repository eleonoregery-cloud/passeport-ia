-- RGPD : recueille le souhait explicite de la personne d'être recontactée
-- par notre équipe, distinct du consentement au traitement des données
-- (déjà couvert par la case à cocher existante, nécessaire pour recevoir
-- le résultat). Rempli à la dernière étape du simulateur, visible dans le
-- back-office.
alter table public.submissions
  add column if not exists wants_contact boolean;
