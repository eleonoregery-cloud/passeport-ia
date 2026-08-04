import express from 'express';
import cors from 'cors';
const app = express(); app.use(cors()); app.use(express.json());
const isUnknown = value => value === 'Je ne sais pas' || value === undefined;
app.post('/api/results', (req, res) => {
  const a = req.body.answers || {}, critical = [], alerts = [], clarify = [];
  if ((a.sensitive || []).some(x => !['Aucun de ces usages', 'Je ne sais pas'].includes(x))) critical.push('Revue humaine requise pour les usages sensibles déclarés.');
  if (a.humanReview === 'Jamais') critical.push('Absence de vérification humaine avant une décision importante.');
  if (a.deepfakeLabel === 'Non') critical.push('Contenus synthétiques potentiellement non signalés.');
  const actions = [['registry','Non','Créer un registre des outils, finalités, utilisateurs et données.'],['training','Non','Former les personnes qui utilisent ou supervisent l’IA.'],['policy','Non','Formaliser puis diffuser une charte IA.'],['chatbotNotice','Non','Informer clairement les personnes qu’elles interagissent avec une IA.'],['evidence','Non','Conserver les preuves de formation et de gouvernance.']];
  actions.forEach(([key, expected, message]) => a[key] === expected && alerts.push(message));
  Object.entries(a).forEach(([key,value]) => (isUnknown(value) || Array.isArray(value) && value.includes('Je ne sais pas')) && clarify.push(key));
  const measures = ['registry','training','evidence','policy','humanReview','chatbotNotice'];
  const good = measures.filter(key => a[key] && !['Non','Jamais','Je ne sais pas'].includes(a[key])).length;
  res.json({ score: Math.round(good / measures.length * 100), critical, alerts, clarify });
});
app.listen(process.env.PORT || 3001, () => console.log('API available on port 3001'));
