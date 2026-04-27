import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import OutreachModal from '../components/OutreachModal';

const TIER_COLORS = { Elite: '#9333ea', High: '#2563eb', Emerging: '#16a34a' };

export default function PlayerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [player, setPlayer] = useState(null);
  const [matches, setMatches] = useState(null);
  const [loadingPlayer, setLoadingPlayer] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState(null);
  const [outreachSchool, setOutreachSchool] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPlayer() {
      try {
        const res = await authFetch(`/api/players/${id}`);
        if (!res.ok) throw new Error('Player not found');
        const data = await res.json();
        if (!cancelled) {
          setPlayer(data);
          runMatches(data);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingPlayer(false);
      }
    }
    loadPlayer();
    return () => { cancelled = true; };
  }, [id]);

  async function runMatches(p) {
    setLoadingMatches(true);
    try {
      const res = await authFetch('/api/match-athlete', {
        method: 'POST',
        body: JSON.stringify({
          athlete_profile: {
            name:        p.name,
            age:         p.age,
            utr:         p.utr,
            itf_rank:    p.itf_rank,
            atp_rank:    p.atp_rank,
            nationality: p.nationality,
            gpa:         p.gpa,
            sat:         p.sat,
          },
          preferences: { division: [], locations: [], max_tuition: 70000 },
        }),
      });
      const data = await res.json();
      setMatches(data);
    } catch {
      // matches unavailable, non-fatal
    } finally {
      setLoadingMatches(false);
    }
  }

  if (loadingPlayer) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <Spinner dark />
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="page-container">
        <div className="error-alert">{error ?? 'Player not found'}</div>
        <button className="btn btn-ghost mt-16" onClick={() => navigate('/players')}>← Back</button>
      </div>
    );
  }

  const pss = player.player_strength_score;
  const tier = player.recruitment_tier;
  const tierColor = TIER_COLORS[tier];

  return (
    <div className="page-container wide">
      {outreachSchool && (
        <OutreachModal
          athlete={player}
          schoolName={outreachSchool}
          onClose={() => setOutreachSchool(null)}
        />
      )}

      <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => navigate('/players')}>
        ← Player Database
      </button>

      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {player.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div>
          <h1 className="page-heading" style={{ marginBottom: 4 }}>{player.name}</h1>
          <p className="page-subheading" style={{ marginBottom: 8 }}>
            {player.nationality} · Age {player.age}
            {player.itf_rank ? ` · ITF #${player.itf_rank}` : ''}
            {player.atp_rank ? ` · ATP #${player.atp_rank}` : ''}
          </p>
          <span className="tier-badge-lg" style={{ '--tier-color': tierColor }}>{tier}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="profile-stats-grid">
        <StatCard label="UTR Rating" value={player.utr} sub="Universal Tennis Rating" />
        <StatCard label="ITF Rank" value={player.itf_rank ?? '—'} sub="Junior circuit" />
        <StatCard label="ATP Rank" value={player.atp_rank ?? '—'} sub="Professional circuit" />
        <StatCard label="GPA" value={player.gpa ?? '—'} sub="4.0 scale" />
        <StatCard label="SAT" value={player.sat ?? '—'} sub="400–1600" />
        <div className="stat-card">
          <div className="stat-label">Strength Score</div>
          <div className="strength-bar-container">
            <div className="strength-track-lg">
              <div className="strength-fill-lg" style={{ width: `${(pss * 100).toFixed(1)}%`, background: tierColor }} />
            </div>
            <span className="stat-value">{(pss * 100).toFixed(1)}</span>
          </div>
          <div className="stat-sub">Player Strength Score</div>
        </div>
      </div>

      {/* Bio */}
      {player.bio && (
        <div className="dash-card" style={{ marginBottom: 20 }}>
          <h3 className="dash-card-title">Scout Notes</h3>
          <p style={{ color: '#ccc', lineHeight: 1.6, margin: 0 }}>{player.bio}</p>
        </div>
      )}

      {/* Normalization breakdown */}
      {player.normalization_components && (
        <div className="dash-card" style={{ marginBottom: 20 }}>
          <h3 className="dash-card-title">Strength Score Breakdown</h3>
          <div className="norm-grid">
            <NormBar
              label="UTR Component"
              value={player.normalization_components.utr_normalized}
              weight={player.normalization_components.effective_weights?.utr}
            />
            {player.normalization_components.itf_normalized != null && (
              <NormBar
                label="ITF Component"
                value={player.normalization_components.itf_normalized}
                weight={player.normalization_components.effective_weights?.itf}
              />
            )}
            {player.normalization_components.atp_normalized != null && (
              <NormBar
                label="ATP Component"
                value={player.normalization_components.atp_normalized}
                weight={player.normalization_components.effective_weights?.atp}
              />
            )}
          </div>
        </div>
      )}

      {/* Match recommendations */}
      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="dash-card-title" style={{ marginBottom: 0 }}>Recommended Schools</h3>
          {matches && (
            <span style={{ fontSize: 12, color: '#888' }}>
              Top {matches.matches?.length} of 50 analyzed
            </span>
          )}
        </div>

        {loadingMatches && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Spinner dark />
          </div>
        )}

        {!loadingMatches && matches?.matches && (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>School</th>
                  <th>Division</th>
                  <th>Location</th>
                  <th>Fit Score</th>
                  <th>Category</th>
                  <th>Aid %</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {matches.matches.map((m, i) => (
                  <tr key={m.school_id ?? m.school}>
                    <td className="td-muted">{i + 1}</td>
                    <td className="td-name">{m.school}</td>
                    <td>{m.division}</td>
                    <td>{m.location}</td>
                    <td>
                      <strong style={{ color: m.fit_score >= 85 ? '#16a34a' : m.fit_score >= 70 ? '#b45309' : '#1d4ed8' }}>
                        {m.fit_score}
                      </strong>
                    </td>
                    <td>
                      <span className={`category-badge cat-${m.category.toLowerCase()}`}>{m.category}</span>
                    </td>
                    <td>{Math.round((m.scholarship_probability ?? 0) * 100)}%</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => setOutreachSchool(m.school)}
                      >
                        Draft Email
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loadingMatches && !matches && (
          <p style={{ color: '#888', fontSize: 13 }}>Could not load recommendations.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function NormBar({ label, value, weight }) {
  return (
    <div className="norm-bar-row">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#bbb' }}>{label}</span>
        <span style={{ fontSize: 12, color: '#888' }}>
          {(value * 100).toFixed(0)} · weight {weight != null ? (weight * 100).toFixed(0) : '?'}%
        </span>
      </div>
      <div className="tier-bar-track">
        <div className="tier-bar-fill" style={{ width: `${(value * 100).toFixed(1)}%`, background: '#3b82f6' }} />
      </div>
    </div>
  );
}
