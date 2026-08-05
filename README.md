# Passeport IA

Trois applications indépendantes, un seul repo :

| App | Rôle | Dossier |
|---|---|---|
| **Landing** | Site vitrine statique (HTML/CSS pur, sans build) | [apps/landing](apps/landing) |
| **Simulateur** | Questionnaire d'audit AI Act (React + API) | [apps/simulator](apps/simulator) |
| **Back-office** | Consultation des leads collectés par le simulateur | [apps/backoffice](apps/backoffice) |

Chaque app est déployée comme un **projet Vercel séparé**, tous les trois pointant vers ce même repo avec un `Root Directory` différent.

## Contrainte d'architecture (imposée par la landing)

La landing doit être servie à la racine `passeport-ia.fr`, et le simulateur doit répondre sur `/diagnostic` **du même domaine** (la landing l'affiche en iframe same-origin, sans quoi il faut jongler avec des en-têtes CSP). Concrètement :

- Le projet Vercel **landing** porte le domaine `passeport-ia.fr` et fait un *rewrite* (proxy transparent) de `/diagnostic` et `/diagnostic/*` vers le projet Vercel **simulateur**, chemin préservé à l'identique. Voir [apps/landing/vercel.json](apps/landing/vercel.json).
- Le client du simulateur est buildé avec `base: '/diagnostic/'` (voir [apps/simulator/client/vite.config.js](apps/simulator/client/vite.config.js)) pour que ses assets soient référencés au bon chemin. Comme le build est un dossier statique servi tel quel (`client/dist`, sans le sous-dossier `diagnostic/`), le simulateur a besoin de ses **propres rewrites** ([apps/simulator/vercel.json](apps/simulator/vercel.json)) pour faire correspondre les URL `/diagnostic`, `/diagnostic/assets/*` et `/diagnostic/api/*` à ses fichiers réels. Testé en local (proxy Express reproduisant le même schéma de rewrite) : sans ça, l'iframe de la landing reste en boucle de redirection infinie — c'est le genre de détail à revérifier une fois déployé, via le test décrit dans le `LISEZ-MOI.md` de la landing (section 3).
- Le back-office n'a pas cette contrainte : il peut vivre sur son propre sous-domaine (ex. `admin.passeport-ia.fr`).

## Stockage des données (Supabase)

Chaque soumission du simulateur (réponses + résultat calculé + coordonnées) est enregistrée dans la table `submissions` d'un projet Supabase. Le schéma est versionné dans [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql).

- Le simulateur écrit avec la clé publique (`anon`) : la policy RLS n'autorise que l'`INSERT`, jamais la lecture.
- Le back-office lit avec un compte Supabase Auth, mais seulement s'il figure dans la table `admins` (allow-list). Sans ça, n'importe qui créant un compte Supabase Auth pourrait lire les leads — c'est pour ça que la policy ne se contente pas d'un `authenticated` générique.

### Appliquer la migration

Impossible à faire depuis cet environnement (la connexion directe à la base Supabase est IPv6-only, pas de sortie IPv6 ici). À faire une fois, à la main :

1. Ouvrir le [SQL Editor](https://supabase.com/dashboard/project/rzfmnvklbmiqaaqsqlbh/sql/new) du projet Supabase.
2. Coller le contenu de `supabase/migrations/0001_init.sql` et lancer.
3. Dans **Authentication > Users**, créer le(s) compte(s) admin du back-office (email + mot de passe), et vérifier que les inscriptions publiques sont désactivées (**Authentication > Providers > Email > Allow new users to sign up** doit être décoché — sinon n'importe qui peut créer un compte, même s'il ne verra rien tant qu'il n'est pas dans `admins`).
4. Toujours dans le SQL Editor, ajouter chaque admin à l'allow-list :
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'ton-email@exemple.fr';
   ```

## Développement local

```bash
npm run install:all      # installe les 3 apps
npm run dev:simulator     # client Vite (proxy /diagnostic/api -> :3001) + API Express
npm run dev:backoffice    # back-office sur son port Vite par défaut
```

La landing n'a pas de build : ouvrir directement `apps/landing/index.html` dans un navigateur, ou servir le dossier avec n'importe quel serveur statique.

Chaque app lit ses identifiants Supabase depuis un `.env` local (déjà rempli, jamais commité — voir `.env.example` dans `apps/simulator/server` et `apps/backoffice` pour le format).

## Déploiement (à faire dans le dashboard Vercel — accès requis)

Le projet Vercel existant (`passeport-ia`, déjà lié via `.vercel/`) buildait l'ancien `client/dist` à la racine du repo. Avec la nouvelle structure, il faut le réassigner et créer deux nouveaux projets :

1. **Projet existant `passeport-ia`** → devient le projet **landing**. Dans Project Settings :
   - Root Directory : `apps/landing`
   - Build Command / Output Directory : aucun (site statique)
   - Domaine `passeport-ia.fr` déjà attaché (à vérifier)
2. **Nouveau projet `passeport-ia-simulator`** :
   - Root Directory : `apps/simulator`
   - Variables d'env : `SUPABASE_URL`, `SUPABASE_ANON_KEY` (valeurs dans `apps/simulator/server/.env`)
   - Une fois déployé, noter son URL `*.vercel.app`
3. **Remplacer le placeholder** dans [apps/landing/vercel.json](apps/landing/vercel.json) (`REMPLACER-PAR-URL-SIMULATEUR`) par cette URL, puis redéployer la landing.
4. **Nouveau projet `passeport-ia-backoffice`** :
   - Root Directory : `apps/backoffice`
   - Variables d'env : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Domaine libre, ex. `admin.passeport-ia.fr`

## Ce qui reste bloqué sur des décisions humaines

Repris du `LISEZ-MOI.md` livré avec la landing, plus les miens :

- **`contact@passeport-ia.fr`** : utilisée 6 fois dans la landing (boutons de pack), n'existe pas encore. Tant qu'elle n'existe pas, les demandes se perdent.
- **Favicon** : absent du zip. Il faut une version carrée 512×512 de `logo.png`, nommée `favicon.png`, à côté des autres fichiers d'`apps/landing`.
- **Pages légales** (`mentions-legales.html`, `cgv.html`) : champs entre crochets à compléter (raison sociale, SIRET, adresse, hébergeur, directeur de publication).
- **Point de vigilance juridique** (signalé par Lamia) : l'article L221-3 du Code de la consommation ouvre un droit de rétractation de 14 jours aux entreprises de 5 salariés ou moins quand la prestation sort de leur activité principale — à trancher avant de vendre, la cible commence justement à 5 salariés.
- **Accès Vercel** pour Lamia (mentionné dans son message), et soumission de `sitemap.xml` à la Search Console une fois en ligne.

Le résultat du simulateur est indicatif : il ne constitue pas une certification de conformité ni un avis juridique.
