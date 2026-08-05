export const RULES = [
  {
    key: 'sensitive', label: 'Usages sensibles',
    classify: a => (a.sensitive || []).some(x => !['Aucun de ces usages', 'Je ne sais pas'].includes(x)) ? 'bad' : 'good',
    bad: { message: 'Usages sensibles déclarés (RH, crédit, santé, biométrie...) nécessitant une vigilance renforcée.', solution: 'Mettre en place une revue humaine systématique et documenter les garanties pour ces usages.' },
    good: { message: 'Aucun usage à haut risque nécessitant une revue humaine renforcée.' },
  },
  {
    key: 'humanReview', label: 'Revue humaine',
    classify: a => a.humanReview === 'Oui, systématiquement selon le risque' ? 'good' : a.humanReview === 'Jamais' ? 'bad' : 'partial',
    bad: { message: 'Absence de vérification humaine avant une décision importante.', solution: 'Instaurer une vérification humaine avant toute décision importante ou publication à risque.' },
    partial: { message: 'Vérification humaine seulement partielle ou occasionnelle.', solution: 'Étendre la vérification humaine à l’ensemble des usages à risque, pas seulement à certains cas.' },
    good: { message: 'Une vérification humaine systématique est prévue selon le risque.' },
  },
  {
    key: 'deepfakeLabel', label: 'Contenus IA',
    classify: a => ['Oui, systématiquement', 'Non concerné'].includes(a.deepfakeLabel) ? 'good' : a.deepfakeLabel === 'Non' ? 'bad' : 'partial',
    bad: { message: 'Contenus synthétiques non signalés comme créés ou modifiés par IA.', solution: 'Ajouter un signalement systématique sur tout contenu IA pouvant sembler authentique.' },
    partial: { message: 'Contenus synthétiques signalés seulement dans certains cas.', solution: 'Généraliser le signalement à l’ensemble des contenus IA concernés.' },
    good: { message: 'Les contenus synthétiques sont signalés comme créés ou modifiés par IA.' },
  },
  {
    key: 'registry', label: 'Registre',
    classify: a => a.registry === 'Oui, complet et régulièrement mis à jour' ? 'good' : a.registry === 'Non' ? 'bad' : 'partial',
    bad: { message: 'Aucun registre des outils, finalités, utilisateurs et données.', solution: 'Créer un registre recensant les outils IA, leurs finalités, utilisateurs et données traitées.' },
    partial: { message: 'Registre existant mais incomplet ou en cours de création.', solution: 'Compléter le registre et le mettre à jour régulièrement.' },
    good: { message: 'Un registre des outils, finalités, utilisateurs et données est tenu à jour.' },
  },
  {
    key: 'training', label: 'Formation',
    classify: a => a.training === 'Oui, toutes les personnes concernées' ? 'good' : a.training === 'Non' ? 'bad' : 'partial',
    bad: { message: 'Les personnes qui utilisent ou supervisent l’IA ne sont pas formées.', solution: 'Mettre en place une sensibilisation ou une formation pour toutes les personnes concernées.' },
    partial: { message: 'Formation partielle : seules certaines personnes sont formées, ou une formation est seulement planifiée.', solution: 'Étendre la formation à l’ensemble des personnes concernées et fixer un calendrier de déploiement.' },
    good: { message: 'Les personnes qui utilisent ou supervisent l’IA sont formées.' },
  },
  {
    key: 'policy', label: 'Charte IA',
    classify: a => a.policy === 'Oui, diffusée et appliquée' ? 'good' : a.policy === 'Non' ? 'bad' : 'partial',
    bad: { message: 'Aucune charte IA formalisée ni diffusée.', solution: 'Rédiger une charte IA et la diffuser à l’ensemble des collaborateurs.' },
    partial: { message: 'Charte IA incomplète ou encore en préparation.', solution: 'Finaliser la charte IA et organiser sa diffusion effective.' },
    good: { message: 'Une charte IA est formalisée et diffusée.' },
  },
  {
    key: 'chatbotNotice', label: 'Chatbot',
    classify: a => ['Oui, claire et visible', 'Non concerné'].includes(a.chatbotNotice) ? 'good' : a.chatbotNotice === 'Non' ? 'bad' : 'partial',
    bad: { message: 'Les personnes ne sont pas informées qu’elles interagissent avec une IA.', solution: 'Ajouter une mention claire et visible dès la première interaction avec le chatbot.' },
    partial: { message: 'La mention informant d’une interaction avec une IA est peu visible.', solution: 'Rendre la mention plus visible dès le début de l’échange.' },
    good: { message: 'Les personnes sont informées qu’elles interagissent avec une IA.' },
  },
  {
    key: 'evidence', label: 'Preuves',
    classify: a => a.evidence === 'Oui, programme, dates, participants et attestations' ? 'good' : a.evidence === 'Non' ? 'bad' : 'partial',
    bad: { message: 'Aucune preuve des mesures de formation et de gouvernance.', solution: 'Conserver les preuves des actions menées : programme, dates, participants, attestations.' },
    partial: { message: 'Preuves des mesures de formation ou de gouvernance incomplètes.', solution: 'Compléter la documentation existante avec les éléments manquants (dates, participants, attestations).' },
    good: { message: 'Les preuves des mesures de formation et de gouvernance sont conservées.' },
  },
];

export function computeResult(answers) {
  const bad = [], partial = [], good = [];
  RULES.forEach(rule => {
    const state = rule.classify(answers);
    const item = { key: rule.key, label: rule.label, ...rule[state] };
    if (state === 'bad') bad.push(item);
    else if (state === 'partial') partial.push(item);
    else good.push(item);
  });
  const total = RULES.length;
  const riskScore = Math.round(((bad.length + partial.length * 0.5) / total) * 100);
  return { bad, partial, good, total, riskScore, conforme: bad.length === 0 && partial.length === 0 };
}
