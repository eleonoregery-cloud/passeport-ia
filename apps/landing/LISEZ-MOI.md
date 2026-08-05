# Landing Passeport IA, à intégrer

Version du 5 août 2026. Tout est en HTML et CSS purs, aucune dépendance, aucune installation, aucun build. Tu ouvres `index.html` dans un navigateur et tu vois le site.

---

## 1. Ce qu'il y a dans le dossier

| Fichier | Rôle |
|---|---|
| `index.html` | La page d'accueil. C'est la page principale. |
| `style.css` | La feuille de style partagée. **Une modification ici change toutes les pages du site.** |
| `articles.html` | L'index des articles de référencement |
| 8 fichiers d'articles | `ai-act-entreprise-concernee.html`, `fournisseur-ou-deployeur-ia.html`, `sanctions-ai-act-pme.html`, `mentions-ia-site-web.html`, `signaler-contenus-ia-reseaux-sociaux.html`, `article-4-formation-ia-salaries.html`, `calendrier-ai-act-dates.html`, `registre-usages-ia-modele.html` |
| `mentions-legales.html`, `confidentialite.html`, `cgv.html` | Les pages légales. Il reste des champs entre crochets à compléter. |
| `logo.png` | Le logo en bannière, utilisé pour l'aperçu lors des partages sur les réseaux |
| `sitemap.xml`, `robots.txt` | Pour le référencement. À soumettre dans la Search Console une fois en ligne. |

Tous les liens internes sont **relatifs**, donc le site fonctionne aussi bien en local qu'en ligne, sans rien reconfigurer.

---

## 2. La seule contrainte technique

**La landing doit être à la racine `passeport-ia.fr`.** C'est là que les visiteurs arrivent et c'est là que le référencement se joue. Les huit articles n'ont d'intérêt que si le domaine principal les porte.

**Le simulateur doit répondre sur `/diagnostic`.** L'iframe de la section Diagnostic pointe vers `src="/diagnostic"`, en chemin relatif.

Si tu regroupes tout sur le même domaine, **l'iframe fonctionne telle quelle, sans aucune configuration**. Même origine, donc aucun problème d'en-tête, rien à changer dans `index.html`.

### Si tu pars sur un sous-domaine plutôt qu'un chemin

Deux choses à faire dans ce cas, et seulement dans ce cas.

Dans `index.html`, ligne **269** :

```html
src="/diagnostic"
```

devient

```html
src="https://diagnostic.passeport-ia.fr"
```

Et le simulateur doit autoriser explicitement la landing à l'afficher, sinon le cadre reste blanc. Le bloc à mettre dans son `vercel.json` est dans le fichier `EXEMPLE - vercel.json si sous-domaine.json` du dossier. Attention si tu as déjà une clé `headers`, il faut fusionner et pas écraser. Et si `X-Frame-Options` figure quelque part, il faut le retirer, les deux en-têtes se contredisent et c'est le plus restrictif qui l'emporte.

---

## 3. Le test qui prouve que ça marche

Ouvre la landing en ligne, descends jusqu'à la section « Diagnostic ».

- Le simulateur s'affiche dans le cadre : c'est bon.
- Le cadre reste blanc : ouvre la console du navigateur avec F12. Un message mentionnant `frame-ancestors` ou `X-Frame-Options` te dit quoi corriger.

Un bloc de secours s'affiche automatiquement si l'iframe ne charge pas, avec un lien direct vers le simulateur. La page reste donc utilisable dans tous les cas, rien ne casse pendant que tu cherches.

---

## 4. Vérifie ces quatre points avant de considérer que c'est fini

1. Le menu du haut contient **Articles**, et le lien ouvre `articles.html`.
2. Les boutons « diagnostic », il y en a plusieurs sur la page, descendent tous vers la section du simulateur.
3. Le pied de page ouvre correctement les trois pages légales.
4. Sur mobile, le simulateur reste utilisable dans son cadre.

---

## 5. Ce qui reste ouvert, et sur quoi j'ai besoin de vous

Trois points que je n'ai pas pu trancher seule :

1. **L'adresse mail professionnelle.** `contact@passeport-ia.fr` apparaît 6 fois dans le site et n'existe pas encore. Il faut la créer, ou me dire par quoi la remplacer. Tous les boutons des packs ouvrent un mail vers cette adresse, donc tant qu'elle n'existe pas, on perd les demandes.
2. **Le favicon.** Il n'y en a pas. Le `logo.png` est une bannière horizontale, il faut une version carrée en 512 par 512, nommée `favicon.png`, à poser à côté des autres fichiers.
3. **Les champs entre crochets** dans les trois pages légales : raison sociale, SIRET, adresse, hébergeur, directeur de publication. Je ne connais pas ces informations.

Et un point de vigilance juridique sur les CGV, à arbitrer avant de vendre : l'article L221-3 du Code de la consommation ouvre un droit de rétractation de 14 jours aux entreprises de 5 salariés ou moins quand la prestation sort de leur activité principale. Notre cible commence justement à 5 salariés.

---

## 6. Ce dont j'ai besoin quand tu auras fini

- **L'URL en ligne**, pour que je vérifie et que je lance le référencement.
- **Un accès Vercel**, pour pouvoir corriger un texte ou un chiffre sans te déranger à chaque fois. Le tarif de la formation a déjà bougé deux fois cette semaine, ça va continuer.
- **Soumettre `sitemap.xml`** dans la Search Console de Google, ou me donner l'accès pour que je le fasse.

---

## 7. Si tu veux modifier le design

Tout est centralisé dans `style.css`. Les couleurs sont en haut du fichier, dans le bloc `:root`, prélevées sur le logo :

```css
--bleu:      #0044A8;   /* le bleu du mot PASSEPORT */
--rouge:     #E30613;   /* le rouge du mot IA */
--bordeaux:  #741424;   /* la couverture du passeport */
--or:        #C9962B;   /* le robot du logo */
```

Deux règles que j'ai suivies et qu'il faut garder :

- **Jamais de texte clair sur fond clair, jamais de texte foncé sur fond foncé.** Tous les contrastes ont été vérifiés un par un.
- **Aucun tiret cadratin dans le site.** Pas un seul, nulle part. Virgule, parenthèse ou nouvelle phrase à la place.

---

Dis-moi si tu préfères qu'on le fasse ensemble en visio, ça se règle en un quart d'heure.

Lamia
