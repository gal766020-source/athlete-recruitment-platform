import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function Dashboard() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [pRes, hRes] = await Promise.all([
          authFetch('/api/players'),
          authFetch('/api/history'),
        ]);
        const pData = await pRes.json();
        const hData = await hRes.json();
        if (!cancelled) {
          setPlayers(pData.players ?? []);
          setHistory(hData.history ?? []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <Spinner dark />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-alert">{error}</div>
      </div>
    );
  }

  const eliteCount    = players.filter((p) => p.recruitment_tier === 'Elite').length;
  const highCount     = players.filter((p) => p.recruitment_tier === 'High').length;
  const emergingCount = players.filter((p) => p.recruitment_tier === 'Emerging').length;
  const avgPSS        = players.length ? (players.reduce((s, p) => s + p.player_strength_score, 0) / players.length) : 0;
  const nationalities = new Set(players.map((p) => p.nationality)).size;

  const recentSearches = history.slice(0, 5);

  const tierData = [
    { tier: 'Elite', count: eliteCount, color: '#9333ea' },
    { tier: 'High',  count: highCount,  color: '#2563eb' },
    { tier: 'Emerging', count: emergingCount, color: '#16a34a' },
  ];

  return (
    <div className="page-container wide">
      <h1 className="page-heading">Dashboard</h1>
      <p className="page-subheading">Platform overview and recruitment pipeline at a glance.</p>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard label="Total Players" value={players.length} icon="👤" />
        <KpiCard label="Elite Prospects" value={eliteCount} icon="⭐" accent="#9333ea" />
        <KpiCard label="Avg Strength Score" value={(avgPSS * 100).toFixed(1)} suffix="/100" icon="📊" />
        <KpiCard label="Nationalities" value={nationalities} icon="🌍" />
        <KpiCard label="Searches Run" value={history.length} icon="🔍" />
        <KpiCard label="Schools in DB" value={50} icon="🏫" />
      </div>

      {/* Tier Distribution */}
      <div className="dash-section-grid">
        <div className="dash-card">
          <h3 className="dash-card-title">Recruitment Tier Distribution</h3>
          <div className="tier-bars">
            {tierData.map(({ tier, count, color }) => (
              <div key={tier} className="tier-bar-row">
                <span className="tier-bar-label">{tier}</span>
                <div className="tier-bar-track">
                  <div
                    className="tier-bar-fill"
                    style={{
                      width: players.length ? `${(count / players.length) * 100}%` : '0%',
                      background: color,
                    }}
                  />
                </div>
                <span className="tier-bar-count">{count}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            {tierData.map(({ tier, count, color }) => (
              <button
                key={tier}
                className="tier-pill-btn"
                style={{ '--tier-color': color }}
                onClick={() => navigate(`/players?tier=${tier}`)}
              >
                {tier} · {count}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        <div className="dash-card">
          <h3 className="dash-card-title">Recent Searches</h3>
          {recentSearches.length === 0 ? (
            <p style={{ color: '#888', fontSize: 13 }}>No searches yet. Run the Match Engine to get started.</p>
          ) : (
            <div className="dash-search-list">
              {recentSearches.map((s) => (
                <div key={s.id} className="dash-search-row">
                  <div>
                    <span className="dash-search-name">{s.athlete_name}</span>
                    <span className="dash-search-meta">
                      UTR {s.utr} · {s.divisions || 'All divisions'} · {s.match_count} matches
                    </span>
                  </div>
                  <span className="dash-search-date">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 12 }}
            onClick={() => navigate('/history')}
          >
            View all history →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dash-card" style={{ marginTop: 20 }}>
        <h3 className="dash-card-title">Quick Actions</h3>
        <div className="quick-actions-grid">
          <QuickAction
            icon="🎾"
            title="Match Engine"
            desc="Run a new athlete profile against 50 college programs"
            onClick={() => navigate('/')}
          />
          <QuickAction
            icon="👥"
            title="Player Database"
            desc="Browse and filter 80 tracked prospects"
            onClick={() => navigate('/players')}
          />
          <QuickAction
            icon="🏫"
            title="School Database"
            desc="Explore all 50 college tennis programs"
            onClick={() => navigate('/schools')}
          />
          <QuickAction
            icon="📋"
            title="Search History"
            desc="Review past match analyses and results"
            onClick={() => navigate('/history')}
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, suffix = '', icon, accent }) {
  return (
    <div className="kpi-card">
      <span className="kpi-icon">{icon}</span>
      <div>
        <div className="kpi-value" style={accent ? { color: accent } : {}}>
          {value}{suffix}
        </div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}

function QuickAction({ icon, title, desc, onClick }) {
  return (
    <button className="quick-action-card" onClick={onClick}>
      <span className="quick-action-icon">{icon}</span>
      <div>
        <div className="quick-action-title">{title}</div>
        <div className="quick-action-desc">{desc}</div>
      </div>
    </button>
  );
}
