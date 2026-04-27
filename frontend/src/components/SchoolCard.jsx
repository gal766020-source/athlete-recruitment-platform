import { useState } from 'react';
import ScoreRing from './ScoreRing';
import OutreachModal from './OutreachModal';

export default function SchoolCard({ match, rank, athlete }) {
  const [showOutreach, setShowOutreach] = useState(false);

  const schPct = Math.round(match.scholarship_probability * 100);

  const subScoreItems = [
    { label: 'Athletic', key: 'athleticMatch' },
    { label: 'Academic', key: 'academicMatch' },
    { label: 'Afford.', key: 'affordability' },
    { label: 'Division', key: 'divisionFit' },
  ];

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

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowOutreach(true)}
            >
              Generate Outreach
            </button>
          </div>
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
  // The API returns sub-scores via subScores — fall back gracefully
  const map = {
    'Athletic':  match.sub_scores?.athleticMatch ?? match.athleticMatch ?? 0,
    'Academic':  match.sub_scores?.academicMatch  ?? match.academicMatch  ?? 0,
    'Afford.':   match.sub_scores?.affordability  ?? match.affordability  ?? 0,
    'Division':  match.sub_scores?.divisionFit    ?? match.divisionFit    ?? 0,
  };
  return map[label] ?? 0;
}

function MetaIcon({ type }) {
  const icons = {
    division: '◈',
    location: '◎',
    tuition:  '◉',
  };
  return <span style={{ fontSize: 10, opacity: 0.5 }}>{icons[type]}</span>;
}
