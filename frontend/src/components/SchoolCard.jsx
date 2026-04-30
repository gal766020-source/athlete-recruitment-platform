import { useState } from 'react';
import ScoreRing from './ScoreRing';
import OutreachModal from './OutreachModal';
import { useAuth } from '../context/AuthContext';

export default function SchoolCard({ match, rank, athlete }) {
  const [showOutreach,    setShowOutreach]    = useState(false);
  const [coachResults,    setCoachResults]    = useState(null);
  const [coachLoading,    setCoachLoading]    = useState(false);
  const [coachError,      setCoachError]      = useState(null);
  const [showCoachPanel,  setShowCoachPanel]  = useState(false);
  const { authFetch } = useAuth();

  const schPct = Math.round(match.scholarship_probability * 100);

  const subScoreItems = [
    { label: 'Athletic', key: 'athleticMatch' },
    { label: 'Academic', key: 'academicMatch' },
    { label: 'Afford.',  key: 'affordability' },
    { label: 'Division', key: 'divisionFit' },
  ];

  async function handleFindCoach() {
    if (showCoachPanel && coachResults) {
      setShowCoachPanel(false);
      return;
    }
    setShowCoachPanel(true);
    if (coachResults) return;

    setCoachLoading(true);
    setCoachError(null);
    try {
      const res  = await authFetch(`/api/coach-search?school=${encodeURIComponent(match.school)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setCoachResults(data);
    } catch (err) {
      setCoachError(err.message);
    } finally {
      setCoachLoading(false);
    }
  }

  const dataSourceLabel = match.data_source === 'scorecard_live'
    ? { text: 'Live · College Scorecard', color: '#16a34a' }
    : match.data_source === 'scorecard_cached'
    ? { text: 'Cached · College Scorecard', color: '#2563eb' }
    : { text: 'Local data', color: '#999' };

  return (
    <>
      <div className="school-card">
        <ScoreRing score={match.fit_score} category={match.category} />

        <div className="card-body">
          <div className="card-top">
            <span className="card-school-name">
              <span style={{ color: '#999', fontSize: 12, marginRight: 8, fontFamily: 'JetBrains Mono, monospace' }}>
                #{rank}
              </span>
              {match.school}
            </span>
            <span className={`category-pill ${match.category}`}>{match.category}</span>
          </div>

          <div className="card-meta">
            <span className="card-meta-item">
              <MetaIcon type="division" /> {match.division}
            </span>
            <span className="card-meta-item">
              <MetaIcon type="location" /> {match.location}
            </span>
            <span className="card-meta-item">
              <MetaIcon type="tuition" /> ${match.tuition.toLocaleString()} / yr
            </span>
            <span style={{ fontSize: 11, color: dataSourceLabel.color, marginLeft: 4 }}>
              · {dataSourceLabel.text}
            </span>
          </div>

          <p className="card-reasoning">{match.reasoning}</p>

          <div className="sub-scores">
            {subScoreItems.map(({ label }) => {
              const value = getSubScore(match, label);
              return (
                <span key={label} className="sub-score">
                  {label} {Math.round(value * 100)}
                </span>
              );
            })}
          </div>

          <div className="card-footer">
            <div className="scholarship-bar">
              <span>Aid probability</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${schPct}%` }} />
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                {schPct}%
              </span>
              {match.division === 'D3' && (
                <span style={{ fontSize: 11, color: '#999' }}>(merit-based)</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleFindCoach}
              >
                {showCoachPanel && coachResults ? 'Hide Coach Info' : '🔍 Find Coach'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowOutreach(true)}
              >
                Generate Outreach
              </button>
            </div>
          </div>

          {showCoachPanel && (
            <div style={{
              marginTop: 12,
              padding: '12px 14px',
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 13,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#1e293b' }}>
                Coach Search Results
                <span style={{ fontWeight: 400, fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>
                  via Google Search · SerpAPI
                </span>
              </div>

              {coachLoading && <p style={{ color: '#64748b' }}>Searching Google...</p>}
              {coachError   && <p style={{ color: '#dc2626' }}>{coachError}</p>}

              {coachResults && coachResults.results.length === 0 && (
                <p style={{ color: '#64748b' }}>No results found.</p>
              )}

              {coachResults && coachResults.results.map((r, i) => (
                <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < coachResults.results.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                  <a href={r.link} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
                    {r.title}
                  </a>
                  <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 12 }}>{r.snippet}</p>
                </div>
              ))}

              {coachResults && (
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Fetched {new Date(coachResults.fetched_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {showOutreach && (
        <OutreachModal
          athlete={athlete}
          schoolName={match.school}
          onClose={() => setShowOutreach(false)}
        />
      )}
    </>
  );
}

function getSubScore(match, label) {
  const map = {
    'Athletic': match.sub_scores?.athleticMatch ?? match.athleticMatch ?? 0,
    'Academic': match.sub_scores?.academicMatch  ?? match.academicMatch  ?? 0,
    'Afford.':  match.sub_scores?.affordability  ?? match.affordability  ?? 0,
    'Division': match.sub_scores?.divisionFit    ?? match.divisionFit    ?? 0,
  };
  return map[label] ?? 0;
}

function MetaIcon({ type }) {
  const icons = { division: '◈', location: '◎', tuition: '◉' };
  return <span style={{ fontSize: 10, opacity: 0.5 }}>{icons[type]}</span>;
}
