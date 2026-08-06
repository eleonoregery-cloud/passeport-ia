import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './supabaseClient.js';
import { downloadReportPdf } from './report.js';
import logoUrl from './assets/logo-passeport-ia-fond-blanc.png';
import './styles.css';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <main className="login">
      <form className="card" onSubmit={submit}>
        <img src={logoUrl} alt="Passeport IA" className="logo-img" />
        <h1>Back-office</h1>
        <label>E-mail<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Mot de passe<input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</button>
      </form>
    </main>
  );
}

function toCsv(rows) {
  const headers = ['created_at', 'company', 'first_name', 'last_name', 'email', 'phone', 'sector', 'size', 'risk_score', 'conforme', 'wants_contact'];
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))];
  return lines.join('\n');
}

function downloadCsv(rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `soumissions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Detail({ row, onClose }) {
  const result = row.result || {};
  const groups = [
    ['À corriger', result.bad, 'bad'],
    ['Partiel', result.partial, 'partial'],
    ['Conforme', result.good, 'ok'],
  ];
  const downloadReport = () => downloadReportPdf({
    contact: { company: row.company, firstName: row.first_name, lastName: row.last_name, email: row.email, sector: row.sector, date: row.created_at },
    result: { ...result, riskScore: row.risk_score },
    logoUrl,
  });
  return (
    <div className="overlay" onClick={onClose}>
      <div className="card detail" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Fermer">×</button>
        <h2>{row.company || 'Sans entreprise'}</h2>
        <p className="meta">{row.first_name} {row.last_name} · {row.email} {row.phone ? `· ${row.phone}` : ''}</p>
        <p className="meta">Secteur : {row.sector || '—'} · Taille : {row.size || '—'} · {new Date(row.created_at).toLocaleString('fr-FR')}</p>
        <p className={'badge ' + (row.conforme ? 'ok' : 'bad')}>{row.conforme ? 'CONFORME' : 'NON CONFORME'} — {row.risk_score}% de non-conformité</p>
        <p className={'badge ' + (row.wants_contact ? 'ok' : 'bad')}>{row.wants_contact ? 'Souhaite être recontacté(e)' : 'Ne souhaite pas être recontacté(e)'}</p>
        <button className="secondary" onClick={downloadReport}>Télécharger le rapport (PDF)</button>
        {groups.map(([title, items, tone]) => (
          <section key={title}>
            <h3 className={tone}>{title}</h3>
            {!items || items.length === 0 ? <p className="empty">Aucun point.</p> : (
              <ul>{items.map(i => <li key={i.key}><strong>{i.label}</strong> : {i.message}{i.solution && <span className="solution"> — {i.solution}</span>}</li>)}</ul>
            )}
          </section>
        ))}
        <h3>Réponses complètes</h3>
        <pre className="raw">{JSON.stringify(row.answers, null, 2)}</pre>
      </div>
    </div>
  );
}

function Dashboard({ session }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [conformeFilter, setConformeFilter] = useState('all');
  const [contactFilter, setContactFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('submissions').select('*').order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) setError(error.message);
      else setRows(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => rows.filter(r => {
    if (conformeFilter === 'conforme' && !r.conforme) return false;
    if (conformeFilter === 'non-conforme' && r.conforme) return false;
    if (contactFilter === 'oui' && !r.wants_contact) return false;
    if (contactFilter === 'non' && r.wants_contact) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return [r.company, r.email, r.first_name, r.last_name].some(v => (v || '').toLowerCase().includes(q));
  }), [rows, search, conformeFilter, contactFilter]);

  return (
    <main>
      <header className="topbar">
        <div className="topbar-brand">
          <img src={logoUrl} alt="Passeport IA" className="logo-img" />
          <h1>Soumissions</h1>
        </div>
        <div className="topbar-actions">
          <span>{session.user.email}</span>
          <button className="secondary" onClick={() => supabase.auth.signOut()}>Déconnexion</button>
        </div>
      </header>

      <div className="toolbar">
        <input placeholder="Rechercher entreprise, e-mail, nom…" value={search} onChange={e => setSearch(e.target.value)} />
        <select value={conformeFilter} onChange={e => setConformeFilter(e.target.value)}>
          <option value="all">Toutes</option>
          <option value="conforme">Conformes</option>
          <option value="non-conforme">Non conformes</option>
        </select>
        <select value={contactFilter} onChange={e => setContactFilter(e.target.value)}>
          <option value="all">Recontact : indifférent</option>
          <option value="oui">Souhaite être recontacté</option>
          <option value="non">Ne souhaite pas être recontacté</option>
        </select>
        <button onClick={() => downloadCsv(filtered)} disabled={filtered.length === 0}>Exporter CSV</button>
      </div>

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <table>
          <thead>
            <tr><th>Date</th><th>Entreprise</th><th>Contact</th><th>Secteur</th><th>Score</th><th>Statut</th><th>Recontact</th><th>Rapport</th></tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} onClick={() => setSelected(r)}>
                <td>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                <td>{r.company || '—'}</td>
                <td>{r.first_name} {r.last_name}<br /><span className="muted">{r.email}</span></td>
                <td>{r.sector || '—'}</td>
                <td>{r.risk_score}%</td>
                <td><span className={'badge ' + (r.conforme ? 'ok' : 'bad')}>{r.conforme ? 'Conforme' : 'Non conforme'}</span></td>
                <td><span className={'badge ' + (r.wants_contact ? 'ok' : 'bad')}>{r.wants_contact ? 'Oui' : 'Non'}</span></td>
                <td><button className="secondary" onClick={e => { e.stopPropagation(); downloadReportPdf({ contact: { company: r.company, firstName: r.first_name, lastName: r.last_name, email: r.email, sector: r.sector, date: r.created_at }, result: { ...(r.result || {}), riskScore: r.risk_score }, logoUrl }); }}>PDF</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="empty">Aucune soumission.</td></tr>}
          </tbody>
        </table>
      )}

      {selected && <Detail row={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  return session ? <Dashboard session={session} /> : <LoginForm />;
}

createRoot(document.getElementById('root')).render(<App />);
