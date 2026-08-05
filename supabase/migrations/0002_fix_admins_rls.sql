-- La policy "admins can read submissions" (0001) vérifie l'appartenance à
-- public.admins via un EXISTS. Mais admins a RLS activé sans aucune policy,
-- donc ce EXISTS est lui-même bloqué par le RLS de admins et ne renvoie
-- jamais rien, même pour un vrai admin. On ajoute une policy permettant à
-- chaque utilisateur authentifié de lire SA PROPRE ligne (et seulement la
-- sienne) dans admins, ce qui suffit à débloquer le EXISTS sans exposer la
-- liste complète des admins à qui que ce soit.
create policy "user can read own admin row"
  on public.admins
  for select
  to authenticated
  using (user_id = auth.uid());
