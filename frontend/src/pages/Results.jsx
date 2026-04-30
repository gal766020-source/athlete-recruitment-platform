import { useLocation, useNavigate } from 'react-router-dom';
import SchoolCard from '../components/SchoolCard';

function exportCSV(matches, athleteName) {
  const headers = ['Rank','School','Division','Location','Tuition','UTR Benchmark','Fit Score','Category','Aid %','Athletic','Academic','Afford.','Division Fit','Reasoning'];
  const rows = matches.map((m, i) => [
    i + 1,
    m.school,
    m.division,
    m.location,
    m.tuition,
    m.tennis_utr_benchmark ?? '',
    m.fit_score,
    m.category,
    Math.round((m.scholarship_probability ?? 0) * 100) + '%',
    m.sub_scores ? Math.round(m.sub_scores.athleticMatch * 100) : '',
    m.sub_scores ? Math.round(m.sub_scores.academicMatch * 100) : '',
    m.sub_scores ? Math.round(m.sub_scores.affordability * 100) : '',
    m.sub_scores ? Math.round(m.sub_scores.divisionFit * 100) : '',
    m.reasoning ?? '',
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${athleteName.replace(/\s+/g, '_')}_matches.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Results() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  if (!state?.results) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>No results to display</h3>
          <p>Submit a player profile to generate school matches.</p>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/')}>Back to Form</button>
        </div>
      </div>
    );
  }

  const { results, athlete } = state;
  const { matches, player_strength_score, normalization_components, recruitment_tier, utr_roadmap, fetched_at } = results;

  const targetCount = matches.filter((m) => m.category === 'Target').length;
  const reachCount  = matches.filter((m) => m.category === 'Reach').length;
  const safetyCount = matches.filter((m) => m.category === 'Safety').length;

  return (
    <div className="page-container wide">
      <div className="results-back-btn">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>← New Search</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
        <h1 className="page-heading" style={{ marginBottom: 0 }}>Match Results — {athlete.name}</h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => exportCSV(matches, athlete.name)}
            title="Download results as CSV"
          >
            ↓ Export CSV
          </button>
          {fetched_at && (
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              Data fetched {new Date(fetched_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <p className="page-subheading">
        {athlete.nationality} · Age {athlete.age} · UTR {athlete.utr}
        {athlete.itf_rank ? ` · ITF #${athlete.itf_rank}` : ''}
        {athlete.atp_rank ? ` · ATP #${athlete.atp_rank}` : ''}
      </p>

      {player_strength_score != null && (
        <div className="results-strength-bar">
          <span className="strength-label">Player Strength Score</span>
          <div className="strength-track">
            <div className="strength-fill" style={{ width: `${(player_strength_score * 100).toFixed(1)}%` }} />
          </div>
          <span className="strength-value">{(player_strength_score * 100).toFixed(1)}</span>
          {recruitment_tier && (
            <span className={`tier-badge`} style={{ '--tier-color': recruitment_tier === 'Elite' ? '#9333ea' : recruitment_tier === 'High' ? '#2563eb' : '#16a34a' }}>
              {recruitment_tier}
            </span>
          )}
          <NormComponents components={normalization_components} />
        </div>
      )}

      {utr_roadmap && utr_roadmap.length > 0 && (
        <div className="roadmap-banner">
          <div className="roadmap-title">📈 UTR Improvement Roadmap</div>
          <p className="roadmap-subtitle">
            Raise your UTR to unlock these additional programs:
          </p>
          <div className="roadmap-items">
            {utr_roadmap.map((r) => (
              <div key={r.school} className="roadmap-item">
                <span className="roadmap-school">{r.school}</span>
                <span className="roadmap-div">{r.division}</span>
                <span className="roadmap-gap">+{r.gap} UTR needed</span>
                <span className="roadmap-benchmark">Benchmark: {r.benchmark}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="results-meta">
        <span className="results-meta-stat"><strong>{matches.length}</strong> schools analyzed</span>
        <span className="results-meta-stat"><strong style={{ color: '#16a34a' }}>{targetCount}</strong> Target</span>
        <span className="results-meta-stat"><strong style={{ color: '#b45309' }}>{reachCount}</strong> Reach</span>
        <span className="results-meta-stat"><strong style={{ color: '#1d4ed8' }}>{safetyCount}</strong> Safety</span>
      </div>

      {matches.length === 0 ? (
        <div className="empty-state">
          <h3>No matches found</h3>
          <p>Try expanding division or location preferences, or increasing the tuition ceiling.</p>
        </div>
      ) : (
        <div className="results-list">
          {matches.map((match, i) => (
            <SchoolCard key={match.school_id ?? match.school} match={match} rank={i + 1} athlete={athlete} />
          ))}
        </div>
      )}
    </div>
  );
}

function NormComponents({ components }) {
  if (!components) return null;
  const items = [
    { label: 'UTR', value: components.utr_normalized },
    components.itf_normalized !== null && { label: 'ITF', value: components.itf_normalized },
    components.atp_normalized !== null && { label: 'ATP', value: components.atp_normalized },
  ].filter(Boolean);

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {items.map(({ label, value }) => (
        <span key={label} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999' }}>
          {label} {(value * 100).toFixed(0)}
        </span>
      ))}
    </div>
  );
}
