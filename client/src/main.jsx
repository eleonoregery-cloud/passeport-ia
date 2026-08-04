import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
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
    ['registry', 'Disposez-vous d’un registre des outils, finalités, utilisateurs et données ?', ['Oui, complet et régulièrement mis à jour', 'Oui, mais incomplet', 'En cours de création', 'Non', 'Je ne sais pas']],
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

function Stepper({ current, steps }) {
  return <ol className="stepper">{steps.map((s, i) => <li key={s.title} className={i < current ? 'done' : i === current ? 'active' : ''}><span className="dot">{i < current ? '✓' : i + 1}</span></li>)}</ol>;
}

function Choice({ id, label, options, multiple, value, setAnswer }) {
  const selected = multiple ? (value || []) : value;
  const choose = option => multiple ? setAnswer(id, (selected.includes(option) ? selected.filter(x => x !== option) : [...selected, option])) : setAnswer(id, option);
  return <fieldset><legend>{label}</legend><div className="choices">{options.map(option => { const checked = multiple ? selected.includes(option) : selected === option; return <label className={(multiple ? 'check' : 'radio') + (checked ? ' checked' : '')} key={option}><input type={multiple ? 'checkbox' : 'radio'} name={id} checked={checked} onChange={() => choose(option)} className="sr-only" />{multiple && <span className="box" aria-hidden="true" />}<span>{option}</span></label>; })}</div></fieldset>;
}

function App() {
  const [step, setStep] = useState(0); const [screen, setScreen] = useState(0); const [answers, setAnswers] = useState({}); const [result, setResult] = useState(null);
  const setAnswer = (id, value) => setAnswers(prev => ({...prev, [id]: value}));
  const current = STEPS[step]; const lastStep = STEPS.length - 1; const lastScreen = current.screens.length - 1; const questions = current.screens[screen];
  const complete = useMemo(() => questions.every(([id]) => answers[id]), [questions, answers]);
  const goNext = () => { if (screen < lastScreen) setScreen(screen + 1); else { setStep(step + 1); setScreen(0); } };
  const goPrev = () => { if (screen > 0) setScreen(screen - 1); else { setStep(step - 1); setScreen(STEPS[step - 1].screens.length - 1); } };
  const isFirst = step === 0 && screen === 0; const isLast = step === lastStep && screen === lastScreen;
  const finish = async () => { const fallback = () => { const critical = []; const alerts = []; if ((answers.sensitive || []).some(x => !['Aucun de ces usages', 'Je ne sais pas'].includes(x))) critical.push('Revue humaine requise pour les usages sensibles déclarés.'); if (answers.humanReview === 'Jamais') critical.push('Absence de vérification humaine avant une décision importante.'); if (answers.deepfakeLabel === 'Non') critical.push('Contenus synthétiques potentiellement non signalés.'); [['registry','Non','Créer un registre des usages IA.'],['training','Non','Former les personnes qui utilisent ou supervisent l’IA.'],['policy','Non','Formaliser et diffuser une charte IA.'],['chatbotNotice','Non','Informer clairement les utilisateurs du chatbot.']].forEach(([k,v,m]) => answers[k]===v && alerts.push(m)); const evidence = ['registry','training','evidence','policy','humanReview','chatbotNotice'].filter(k => answers[k] && !['Non','Jamais','Je ne sais pas'].includes(answers[k])).length; return {score: Math.round(evidence / 6 * 100), critical, alerts}; }; try { const r=await fetch('http://localhost:3001/api/results',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers})}); setResult(r.ok ? await r.json() : fallback()); } catch { setResult(fallback()); }};
  if (result) return <main><header><span className="brand">PASSEPORT <b>IA</b></span><span>Audit AI Act</span></header><section className="card results"><p className="eyebrow">DIAGNOSTIC AI ACT</p><h1>Votre résultat</h1><div className="score"><strong>{result.score}<small>/100</small></strong><span>Maturité déclarative</span></div><p className="notice">Ce résultat est indicatif : il ne constitue pas une certification de conformité ni un avis juridique.</p>{result.critical?.length>0 && <section className="alert critical"><h2>Revue prioritaire</h2><ul>{result.critical.map(x=><li key={x}>{x}</li>)}</ul></section>}<section><h2>Vos prochaines actions</h2><ol>{(result.alerts?.length ? result.alerts : ['Consolider les preuves de vos mesures et réévaluer régulièrement vos usages.']).map(x=><li key={x}>{x}</li>)}</ol></section><button onClick={()=>{setStep(0);setScreen(0);setResult(null);setAnswers({})}}>Recommencer l’audit</button></section></main>;
  return <main><header><span className="brand">PASSEPORT <b>IA</b></span><span>Audit AI Act</span></header><Stepper current={step} steps={STEPS} /><section className="card"><h1>{current.title}</h1><p className="intro">{current.intro}</p>{questions.map(([id,label,options,multiple])=><Choice key={id} id={id} label={label} options={options} multiple={multiple} value={answers[id]} setAnswer={setAnswer}/>) }{step===lastStep && <section className="contact"><label>Prénom<input required onChange={e=>setAnswer('firstName',e.target.value)} /></label><label>Nom<input required onChange={e=>setAnswer('lastName',e.target.value)} /></label><label>Entreprise<input required onChange={e=>setAnswer('company',e.target.value)} /></label><label>E-mail<input type="email" required onChange={e=>setAnswer('email',e.target.value)} /></label><label>Téléphone (facultatif)<input onChange={e=>setAnswer('phone',e.target.value)} /></label><label className="check contact-consent"><input type="checkbox" checked={answers.consent || false} onChange={e=>setAnswer('consent',e.target.checked)} className="sr-only" /><span className="box" aria-hidden="true" /><span>J’accepte le traitement de mes données pour recevoir mon résultat.</span></label></section>}</section><nav>{!isFirst ? <button className="secondary" onClick={goPrev}>← Précédent</button> : <span />}{!isLast ? <button disabled={!complete} onClick={goNext}>Continuer →</button> : <button disabled={!answers.firstName || !answers.lastName || !answers.company || !answers.email || !answers.consent} onClick={finish}>Voir mes résultats →</button>}</nav></main>
}
createRoot(document.getElementById('root')).render(<App/>);
