import { useState } from 'react';
import ScoreRing from './ScoreRing';
import OutreachModal from './OutreachModal';
import { useAuth } from '../context/AuthContext';

export default function SchoolCard({ match, rank, athlete }) {
  const [showOutreach,   setShowOutreach]   = useState(false);
  const [coachResults,   setCoachResults]   = useState(null);
  const [coachLoading,   setCoachLoading]   = useState(false);
  const [coachError,     setCoachError]     = useState(null);
  const [showCoachPanel, setShowCoachPanel] = useState(false);
  const [newsResults,    setNewsResults]    = useState(null);
  const [newsLoading,    setNewsLoading]    = useState(false);
  const [newsError,      setNewsError]      = useState(null);
  const [showNewsPanel,  setShowNewsPanel]  = useState(false);
  const { authFetch } = useAuth();

  const schPct = Math.round(match.scholarship_probability * 100);

  const subScoreItems = [
    { label: 'Athletic', key: 'athleticMatch' },
    { label: 'Academic', key: 'academicMatch' },
    { label: 'Afford.',  key: 'affordability' },
    { label: 'Division', key: 'divisionFit' },
  ];

  async function handleFindCoach() {
    if (showCoachPanel && coachResults) { setShowCoachPanel(false); return; }
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

  async function handleProgramNews() {
    if (showNewsPanel && newsResults) { setShowNewsPanel(false); return; }
    setShowNewsPanel(true);
    if (newsResults) return;
    setNewsLoading(true);
    setNewsError(null);
    try {
      const res  = await authFetch(`/api/program-news?school=${encodeURIComponent(match.school)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setNewsResults(data);
    } catch (err) {
      setNewsError(err.message);
    } finally {
      setNewsLoading(false);
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
            <span className="card-meta-item"><MetaIcon type="division" /> {match.division}</span>
            <span className="card-meta-item"><MetaIcon type="location" /> {match.location}</span>
            <span className="card-meta-item"><MetaIcon type="tuition" /> ${match.tuition.toLocaleString()} / yr</span>
            <span style={{ fontSize: 11, color: dataSourceLabel.color, marginLeft: 4 }}>
              · {dataSourceLabel.text}
            </span>
          </div>

          {/* Facts — real data bullets, no AI text */}
          {match.facts && match.facts.length > 0 && (
            <ul style={{
              margin: '10px 0 8px',
              paddingLeft: 16,
              fontSize: 13,
              color: '#334155',
              lineHeight: 1.7,
            }}>
              {match.facts.map((fact, i) => (
                <li key={i} style={{ listStyleType: 'disc' }}>{fact}</li>
              ))}
            </ul>
          )}

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
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{schPct}%</span>
              {match.division === 'D3' && (
                <span style={{ fontSize: 11, color: '#999' }}>(merit-based)</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleFindCoach}>
                {showCoachPanel && coachResults ? 'Hide Coach' : '🔍 Find Coach'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleProgramNews}>
                {showNewsPanel && newsResults ? 'Hide News' : '📰 Program News'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowOutreach(true)}>
                Generate Outreach
              </button>
            </div>
          </div>

          {/* Coach search panel */}
          {showCoachPanel && (
            <InfoPanel title="Coach Search" source="Google Search · SerpAPI">
              {coachLoading && <PanelMsg>Searching Google...</PanelMsg>}
              {coachError   && <PanelMsg color="#dc2626">{coachError}</PanelMsg>}
              {coachResults && coachResults.results.length === 0 && <PanelMsg>No results found.</PanelMsg>}
              {coachResults && coachResults.results.map((r, i) => (
                <ResultItem key={i} item={r} isLast={i === coachResults.results.length - 1} />
              ))}
              {coachResults && <PanelFooter date={coachResults.fetched_at} />}
            </InfoPanel>
          )}

          {/* Program news panel */}
          {showNewsPanel && (
            <InfoPanel title="Recent Program News" source="Google News · SerpAPI">
              {newsLoading && <PanelMsg>Fetching latest news...</PanelMsg>}
              {newsError   && <PanelMsg color="#dc2626">{newsError}</PanelMsg>}
              {newsResults && newsResults.articles.length === 0 && <PanelMsg>No recent news found.</PanelMsg>}
              {newsResults && newsResults.articles.map((a, i) => (
                <NewsItem key={i} item={a} isLast={i === newsResults.articles.length - 1} />
              ))}
              {newsResults && <PanelFooter date={newsResults.fetched_at} />}
            </InfoPanel>
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

function InfoPanel({ title, source, children }) {
  return (
    <div style={{
      marginTop: 12,
      padding: '12px 14px',
      background: '#f8fafc',
      borderRadius: 8,
      border: '1px solid #e2e8f0',
      fontSize: 13,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#1e293b' }}>
        {title}
        <span style={{ fontWeight: 400, fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>{source}</span>
      </div>
      {children}
    </div>
  );
}

function PanelMsg({ color = '#64748b', children }) {
  return <p style={{ color, margin: 0 }}>{children}</p>;
}

function PanelFooter({ date }) {
  return (
    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, marginBottom: 0 }}>
      Fetched {new Date(date).toLocaleString()}
    </p>
  );
}

function ResultItem({ item, isLast }) {
  return (
    <div style={{ marginBottom: isLast ? 0 : 10, paddingBottom: isLast ? 0 : 10, borderBottom: isLast ? 'none' : '1px solid #e2e8f0' }}>
      <a href={item.link} target="_blank" rel="noopener noreferrer"
        style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
        {item.title}
      </a>
      <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 12 }}>{item.snippet}</p>
    </div>
  );
}

function NewsItem({ item, isLast }) {
  return (
    <div style={{ marginBottom: isLast ? 0 : 10, paddingBottom: isLast ? 0 : 10, borderBottom: isLast ? 'none' : '1px solid #e2e8f0' }}>
      <a href={item.link} target="_blank" rel="noopener noreferrer"
        style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
        {item.title}
      </a>
      <div style={{ marginTop: 3, fontSize: 11, color: '#94a3b8' }}>
        {item.source}{item.date ? ` · ${item.date}` : ''}
      </div>
    </div>
  );
}

function getSubScore(match, label) {
  const map = {
    'Athletic': match.sub_scores?.athleticMatch ?? 0,
    'Academic': match.sub_scores?.academicMatch  ?? 0,
    'Afford.':  match.sub_scores?.affordability  ?? 0,
    'Division': match.sub_scores?.divisionFit    ?? 0,
  };
  return map[label] ?? 0;
}

function MetaIcon({ type }) {
  const icons = { division: '◈', location: '◎', tuition: '◉' };
  return <span style={{ fontSize: 10, opacity: 0.5 }}>{icons[type]}</span>;
}
