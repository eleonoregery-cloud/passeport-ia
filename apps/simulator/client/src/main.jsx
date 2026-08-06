import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import logoUrl from './assets/logo-passeport-ia-fond-blanc.png';
import { downloadReportPdf } from './report.js';
import './styles.css';

const STEPS = [
  { title: 'Profil de votre entreprise', intro: 'Ces informations adaptent vos recommandations, sans modifier votre score.', screens: [[
    ['size', 'Combien de personnes travaillent dans votre organisation ?', ['1 à 5', '6 à 20', '21 à 50', '51 à 250', 'Plus de 250']],
    ['sector', 'Quel est votre secteur d’activité ?', ['Commerce ou e-commerce', 'Marketing, communication ou médias', 'Ressources humaines ou recrutement', 'Banque, crédit ou assurance', 'Santé ou médico-social', 'Éducation ou formation', 'Industrie, énergie ou transport', 'Services aux entreprises', 'Administration ou service public', 'Autre']],
    ['role', 'Comment votre entreprise utilise-t-elle principalement l’IA ?', ['Utilise des outils créés par d’autres entreprises', 'Crée ou vend ses propres outils IA', 'Ajoute des outils IA à ses produits ou services', 'Plusieurs de ces activités', 'Je ne sais pas']],
    ['article4Awareness', 'Connaissez-vous les exigences de maîtrise de l’IA de l’article 4 ?', ['Oui, je connais', 'J’en ai entendu parler', 'Non, c’est nouveau pour moi']],
    ['article50Awareness', 'Connaissez-vous les règles de transparence de l’article 50 ?', ['Oui, je connais', 'J’en ai entendu parler', 'Non, c’est nouveau pour moi']]
  ]]},
  { title: 'Cartographie des usages', intro: 'Identifions vos outils, vos usages et leur encadrement.', screens: [[
    ['aiUse', 'Votre entreprise utilise-t-elle actuellement des outils ou fonctionnalités d’IA ?', ['Oui, dans un cadre organisé', 'Oui, mais sans cadre formalisé', 'Certains collaborateurs en utilisent probablement', 'Non', 'Je ne sais pas']],
    ['uses', 'Pour quels usages utilisez-vous l’IA ?', ['Rédaction, résumé ou traduction', 'Création d’images', 'Création ou modification de vidéos', 'Génération ou clonage de voix', 'Analyse de données ou de documents', 'Développement informatique', 'Marketing ou communication', 'Chatbot ou service client', 'Ressources humaines ou recrutement', 'Évaluation, scoring ou aide à la décision', 'Biométrie ou reconnaissance des émotions', 'Autre', 'Je ne sais pas'], true]
  ], [
    ['users', 'Qui utilise ces outils ?', ['Le dirigeant uniquement', 'Quelques collaborateurs', 'Plusieurs équipes', 'La majorité de l’entreprise', 'Des prestataires agissant pour notre compte', 'Je ne sais pas']],
    ['registry', 'Avez-vous un registre recensant, pour chaque outil d’IA : sa finalité, qui l’utilise et quelles données il traite ?', ['Oui, complet et régulièrement mis à jour', 'Oui, mais incomplet', 'En cours de création', 'Non', 'Je ne sais pas']],
    ['owner', 'Une personne valide-t-elle et suit-elle les usages de l’IA ?', ['Oui, responsabilité formalisée', 'Oui, de manière informelle', 'Non', 'Je ne sais pas']]
  ]]},
  { title: 'Usages sensibles', intro: 'Ces réponses peuvent nécessiter une qualification par un expert.', screens: [[
    ['sensitive', 'Utilisez-vous l’IA dans l’une des situations suivantes ?', ['Recrutement, sélection ou évaluation de salariés', 'Admission, orientation ou évaluation d’étudiants', 'Crédit, assurance ou accès à un service essentiel', 'Diagnostic ou décision de santé', 'Biométrie, reconnaissance faciale ou analyse des émotions', 'Infrastructures critiques', 'Justice, sécurité, migration ou contrôle aux frontières', 'Aucun de ces usages', 'Je ne sais pas'], true]
  ]]},
  { title: 'Maîtrise de l’IA - article 4', intro: 'Évaluez la formation des personnes qui utilisent ou supervisent l’IA.', screens: [[
    ['training', 'Les personnes concernées ont-elles reçu une sensibilisation ou une formation ?', ['Oui, toutes les personnes concernées', 'Oui, certaines personnes', 'Une formation est planifiée', 'Non', 'Je ne sais pas']],
    ['risks', 'Quels risques cette sensibilisation aborde-t-elle ?', ['Erreurs et hallucinations', 'Vérification humaine', 'Données personnelles et confidentialité', 'Secrets d’affaires et cybersécurité', 'Biais et discrimination', 'Propriété intellectuelle', 'Transparence des contenus', 'Usages interdits', 'Aucun de ces sujets', 'Je ne sais pas'], true],
    ['adaptedTraining', 'Le contenu est-il adapté aux métiers, outils et responsabilités ?', ['Oui, parcours adaptés', 'Partiellement', 'Non, uniquement général', 'Aucune formation', 'Je ne sais pas']],
    ['evidence', 'Disposez-vous de preuves des mesures mises en place ?', ['Oui, programme, dates, participants et attestations', 'Oui, preuves incomplètes', 'Non', 'Je ne sais pas']]
  ]]},
  { title: 'Transparence - article 50', intro: 'Examinez vos interactions et contenus destinés au public.', screens: [[
    ['chatbot', 'Des personnes interagissent-elles avec un chatbot, assistant vocal ou agent IA ?', ['Oui', 'Non', 'Je ne sais pas']],
    ['chatbotNotice', 'Les personnes sont-elles clairement informées dès la première interaction ?', ['Oui, claire et visible', 'Mention peu visible', 'Non', 'Je ne sais pas', 'Non concerné']],
    ['assistantGuide', 'Une notice présente-t-elle son rôle, ses limites et un contact humain ?', ['Oui', 'Partiellement', 'Non', 'Je ne sais pas', 'Non concerné']]
  ], [
    ['syntheticMedia', 'Publiez-vous des images, vidéos ou sons IA pouvant sembler authentiques ?', ['Oui, régulièrement', 'Oui, occasionnellement', 'Non', 'Je ne sais pas']],
    ['deepfakeLabel', 'Ces contenus sont-ils clairement signalés comme créés ou modifiés par IA ?', ['Oui, systématiquement', 'Dans certains cas', 'Non', 'Je ne sais pas', 'Non concerné']],
    ['publicText', 'Publiez-vous des textes IA sur des sujets d’intérêt public ?', ['Oui', 'Non', 'Je ne sais pas']],
    ['editorialProcess', 'Disposez-vous d’une procédure de divulgation de l’origine IA ?', ['Oui, validation éditoriale', 'Mention sans procédure précise', 'Non', 'Je ne sais pas', 'Non concerné']]
  ]]},
  { title: 'Gouvernance et contrôle', intro: 'Mesurez votre capacité à encadrer et à démontrer vos pratiques.', screens: [[
    ['policy', 'Disposez-vous d’une charte IA ?', ['Oui, diffusée et appliquée', 'Oui, mais incomplète', 'En préparation', 'Non', 'Je ne sais pas']],
    ['humanReview', 'Une vérification humaine est-elle prévue avant une décision importante ou une publication ?', ['Oui, systématiquement selon le risque', 'Oui, pour certains usages', 'Rarement', 'Jamais', 'Je ne sais pas']]
  ]]},
  { title: 'Vos coordonnées', intro: 'Recevez votre synthèse et votre plan d’action personnalisé.', screens: [[]]}
];

const RULES = [
  { key: 'sensitive', label: 'Usages sensibles',
    classify: a => (a.sensitive || []).some(x => !['Aucun de ces usages','Je ne sais pas'].includes(x)) ? 'bad' : 'good',
    bad: { message: 'Usages sensibles déclarés (RH, crédit, santé, biométrie...) nécessitant une vigilance renforcée.', solution: 'Mettre en place une revue humaine systématique et documenter les garanties pour ces usages.' },
    good: { message: 'Aucun usage à haut risque nécessitant une revue humaine renforcée.' } },
  { key: 'humanReview', label: 'Revue humaine',
    classify: a => a.humanReview === 'Oui, systématiquement selon le risque' ? 'good' : a.humanReview === 'Jamais' ? 'bad' : 'partial',
    bad: { message: 'Absence de vérification humaine avant une décision importante.', solution: 'Instaurer une vérification humaine avant toute décision importante ou publication à risque.' },
    partial: { message: 'Vérification humaine seulement partielle ou occasionnelle.', solution: 'Étendre la vérification humaine à l’ensemble des usages à risque, pas seulement à certains cas.' },
    good: { message: 'Une vérification humaine systématique est prévue selon le risque.' } },
  { key: 'deepfakeLabel', label: 'Contenus IA',
    classify: a => ['Oui, systématiquement','Non concerné'].includes(a.deepfakeLabel) ? 'good' : a.deepfakeLabel === 'Non' ? 'bad' : 'partial',
    bad: { message: 'Contenus synthétiques non signalés comme créés ou modifiés par IA.', solution: 'Ajouter un signalement systématique sur tout contenu IA pouvant sembler authentique.' },
    partial: { message: 'Contenus synthétiques signalés seulement dans certains cas.', solution: 'Généraliser le signalement à l’ensemble des contenus IA concernés.' },
    good: { message: 'Les contenus synthétiques sont signalés comme créés ou modifiés par IA.' } },
  { key: 'registry', label: 'Registre',
    classify: a => a.registry === 'Oui, complet et régulièrement mis à jour' ? 'good' : a.registry === 'Non' ? 'bad' : 'partial',
    bad: { message: 'Aucun registre des outils, finalités, utilisateurs et données.', solution: 'Créer un registre recensant les outils IA, leurs finalités, utilisateurs et données traitées.' },
    partial: { message: 'Registre existant mais incomplet ou en cours de création.', solution: 'Compléter le registre et le mettre à jour régulièrement.' },
    good: { message: 'Un registre des outils, finalités, utilisateurs et données est tenu à jour.' } },
  { key: 'training', label: 'Formation',
    classify: a => a.training === 'Oui, toutes les personnes concernées' ? 'good' : a.training === 'Non' ? 'bad' : 'partial',
    bad: { message: 'Les personnes qui utilisent ou supervisent l’IA ne sont pas formées.', solution: 'Mettre en place une sensibilisation ou une formation pour toutes les personnes concernées.' },
    partial: { message: 'Formation partielle : seules certaines personnes sont formées, ou une formation est seulement planifiée.', solution: 'Étendre la formation à l’ensemble des personnes concernées et fixer un calendrier de déploiement.' },
    good: { message: 'Les personnes qui utilisent ou supervisent l’IA sont formées.' } },
  { key: 'policy', label: 'Charte IA',
    classify: a => a.policy === 'Oui, diffusée et appliquée' ? 'good' : a.policy === 'Non' ? 'bad' : 'partial',
    bad: { message: 'Aucune charte IA formalisée ni diffusée.', solution: 'Rédiger une charte IA et la diffuser à l’ensemble des collaborateurs.' },
    partial: { message: 'Charte IA incomplète ou encore en préparation.', solution: 'Finaliser la charte IA et organiser sa diffusion effective.' },
    good: { message: 'Une charte IA est formalisée et diffusée.' } },
  { key: 'chatbotNotice', label: 'Chatbot',
    classify: a => ['Oui, claire et visible','Non concerné'].includes(a.chatbotNotice) ? 'good' : a.chatbotNotice === 'Non' ? 'bad' : 'partial',
    bad: { message: 'Les personnes ne sont pas informées qu’elles interagissent avec une IA.', solution: 'Ajouter une mention claire et visible dès la première interaction avec le chatbot.' },
    partial: { message: 'La mention informant d’une interaction avec une IA est peu visible.', solution: 'Rendre la mention plus visible dès le début de l’échange.' },
    good: { message: 'Les personnes sont informées qu’elles interagissent avec une IA.' } },
  { key: 'evidence', label: 'Preuves',
    classify: a => a.evidence === 'Oui, programme, dates, participants et attestations' ? 'good' : a.evidence === 'Non' ? 'bad' : 'partial',
    bad: { message: 'Aucune preuve des mesures de formation et de gouvernance.', solution: 'Conserver les preuves des actions menées : programme, dates, participants, attestations.' },
    partial: { message: 'Preuves des mesures de formation ou de gouvernance incomplètes.', solution: 'Compléter la documentation existante avec les éléments manquants (dates, participants, attestations).' },
    good: { message: 'Les preuves des mesures de formation et de gouvernance sont conservées.' } },
];

const PACKS = {
  starter: { tag: 'Pack 1', name: 'Starter', price: '99 € HT', desc: 'Un rapport personnalisé de 4 pages pour poser noir sur blanc votre situation.', mailto: "mailto:contact@passeport-ia.fr?subject=Pack%20Starter%20-%20demande%20d'information" },
  conformite: { tag: 'Pack 2 · Le plus demandé', name: 'Conformité Article 50', price: '490 € HT', desc: 'Mentions IA, registre des usages, notice chatbot et charte : votre conformité réglée en 48h.', mailto: "mailto:contact@passeport-ia.fr?subject=Pack%20Conformite%20Article%2050%20-%20demande%20d'information" },
  passeport: { tag: 'Pack 3', name: 'Passeport complet', price: '780 € HT la 1ʳᵉ année', desc: 'Le label « IA Transparente » et une page de vérification publique pour le prouver.', mailto: "mailto:contact@passeport-ia.fr?subject=Passeport%20complet%20-%20demande%20d'information" },
  formation: { tag: 'Offre complémentaire', name: 'Formation Article 4', price: '510 € HT / participant', desc: 'Une journée pour former vos équipes et documenter leur sensibilisation à l’IA.', mailto: "mailto:contact@passeport-ia.fr?subject=Formation%20Article%204%20-%20demande%20d'information" }
};
function recommendPack(negative) {
  const keys = negative.map(i => i.key);
  if (keys.length === 0) return 'passeport';
  if (keys.every(k => ['training', 'evidence'].includes(k))) return 'formation';
  return 'conformite';
}

function Logo() {
  return <img src={logoUrl} alt="Passeport IA" className="logo-img" />;
}

function Stepper({ current, steps }) {
  return <ol className="stepper">{steps.map((s, i) => <li key={s.title} className={i < current ? 'done' : i === current ? 'active' : ''}><span className="dot">{i < current ? '✓' : i + 1}</span></li>)}</ol>;
}

function Choice({ id, label, options, multiple, value, setAnswer }) {
  const selected = multiple ? (value || []) : value;
  const choose = option => multiple ? setAnswer(id, (selected.includes(option) ? selected.filter(x => x !== option) : [...selected, option])) : setAnswer(id, option);
  return <fieldset><legend>{label}</legend><div className="choices">{options.map(option => { const checked = multiple ? selected.includes(option) : selected === option; return <label className={(multiple ? 'check' : 'radio') + (checked ? ' checked' : '')} key={option}><input type={multiple ? 'checkbox' : 'radio'} name={id} checked={checked} onChange={() => choose(option)} className="sr-only" /><span className="box" aria-hidden="true" /><span>{option}</span></label>; })}</div></fieldset>;
}

function App() {
  const [step, setStep] = useState(0); const [screen, setScreen] = useState(0); const [answers, setAnswers] = useState({}); const [result, setResult] = useState(null); const [openIssue, setOpenIssue] = useState(null);
  const setAnswer = (id, value) => setAnswers(prev => ({...prev, [id]: value}));
  const current = STEPS[step]; const lastStep = STEPS.length - 1; const lastScreen = current.screens.length - 1; const questions = current.screens[screen];
  const complete = useMemo(() => questions.every(([id]) => answers[id]), [questions, answers]);
  const goNext = () => { if (screen < lastScreen) setScreen(screen + 1); else { setStep(step + 1); setScreen(0); } };
  const goPrev = () => { if (screen > 0) setScreen(screen - 1); else { setStep(step - 1); setScreen(STEPS[step - 1].screens.length - 1); } };
  const isFirst = step === 0 && screen === 0; const isLast = step === lastStep && screen === lastScreen;
  const finish = async () => { const fallback = () => { const bad = [], partial = [], good = []; RULES.forEach(rule => { const state = rule.classify(answers); const item = { key: rule.key, label: rule.label, ...rule[state] }; (state === 'bad' ? bad : state === 'partial' ? partial : good).push(item); }); return {bad, partial, good, total: RULES.length}; }; try { const r=await fetch(`${import.meta.env.BASE_URL}api/results`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers})}); setResult(r.ok ? await r.json() : fallback()); } catch { setResult(fallback()); }};
  if (result) {
    const negative = [...result.bad.map(i=>({...i,tone:'bad'})), ...result.partial.map(i=>({...i,tone:'partial'}))];
    const positive = result.good.map(i=>({...i,tone:'ok'}));
    const risk = Math.round(((result.bad.length + result.partial.length * 0.5) / result.total) * 100);
    const conforme = negative.length === 0;
    const tone = conforme ? 'ok' : 'bad';
    const pack = PACKS[recommendPack(negative)];
    const downloadReport = () => downloadReportPdf({ contact: { company: answers.company, firstName: answers.firstName, lastName: answers.lastName, email: answers.email, sector: answers.sector, date: Date.now() }, result });
    const renderGroup = items => <div className="issues">{items.length === 0 ? <p className="issues-empty">Aucun point.</p> : items.map(item => <div key={item.key} className="issue"><button className={'issue-btn ' + item.tone + (openIssue === item.key ? ' open' : '')} aria-expanded={openIssue === item.key} onClick={() => setOpenIssue(openIssue === item.key ? null : item.key)}><span>{item.label}</span><svg className="chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>{openIssue === item.key && <div className={'issue-explain ' + item.tone}><p>{item.message}</p>{item.solution && <p className="issue-solution"><strong>Solution : </strong>{item.solution}</p>}</div>}</div>)}</div>;
    return <main><header className="results-top"><span className={'status-badge ' + tone}>{conforme ? 'CONFORME' : 'NON CONFORME'}</span><Logo /></header><section className="card results"><div className="risk"><strong className={tone}>{risk}<small>%</small></strong><span>Taux de non-conformité</span></div><div className="result-bar"><span className={tone} style={{width: `${risk}%`}} /></div><div className="results-columns"><div className="col"><h2 className="group-title bad">À corriger</h2>{renderGroup(negative)}</div><div className="col"><h2 className="group-title ok">Conforme</h2>{renderGroup(positive)}</div></div><div className="pack-reco"><p className="pack-reco-label">Pour passer à l’étape suivante</p><div className="pack-reco-card"><div><p className="pack-reco-tag">{pack.tag}</p><h3>{pack.name}</h3><p className="pack-reco-desc">{pack.desc}</p></div><div className="pack-reco-cta"><p className="pack-reco-price">{pack.price}</p><a className="btn-pack" href={pack.mailto}>Choisir ce pack →</a><a className="pack-reco-all" href="/#offres">Voir toutes les offres</a></div></div></div><p className="notice">Ce résultat est indicatif : il ne constitue pas une certification de conformité ni un avis juridique.</p><div className="results-actions"><button className="secondary" onClick={downloadReport}>Télécharger mon rapport (PDF)</button><button onClick={()=>{setStep(0);setScreen(0);setResult(null);setAnswers({});setOpenIssue(null)}}>Recommencer l’audit</button></div></section></main>;
  }
  return <main><div className="banner"><div className="banner-inner"><header><Logo /><span>Audit AI Act</span></header><Stepper current={step} steps={STEPS} /></div></div><section className="card"><h1>{current.title}</h1><p className="intro">{current.intro}</p>{questions.map(([id,label,options,multiple])=><Choice key={id} id={id} label={label} options={options} multiple={multiple} value={answers[id]} setAnswer={setAnswer}/>) }{step===lastStep && <section className="contact"><label>Prénom<input required onChange={e=>setAnswer('firstName',e.target.value)} /></label><label>Nom<input required onChange={e=>setAnswer('lastName',e.target.value)} /></label><label>Entreprise<input required onChange={e=>setAnswer('company',e.target.value)} /></label><label>E-mail<input type="email" required onChange={e=>setAnswer('email',e.target.value)} /></label><label>Téléphone (facultatif)<input onChange={e=>setAnswer('phone',e.target.value)} /></label><label className={"check contact-consent" + (answers.consent ? " checked" : "")}><input type="checkbox" checked={answers.consent || false} onChange={e=>setAnswer('consent',e.target.checked)} className="sr-only" /><span className="box" aria-hidden="true" /><span>J’accepte le traitement de mes données pour recevoir mon résultat.</span></label><p className="notice" style={{gridColumn:'1/-1'}}>Vos données restent entièrement confidentielles : elles ne sont utilisées que pour établir votre diagnostic et ne sont jamais partagées avec des tiers.</p></section>}</section><nav>{!isFirst ? <button className="secondary" onClick={goPrev}>← Précédent</button> : <span />}{!isLast ? <button disabled={!complete} onClick={goNext}>Continuer →</button> : <button disabled={!answers.firstName || !answers.lastName || !answers.company || !answers.email || !answers.consent} onClick={finish}>Voir mes résultats →</button>}</nav></main>
}
createRoot(document.getElementById('root')).render(<App/>);
