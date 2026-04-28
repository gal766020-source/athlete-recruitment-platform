import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import OutreachModal from '../components/OutreachModal';
import ItfDirectory from '../components/ItfDirectory';

const TIER_COLORS = { Elite: '#9333ea', High: '#2563eb', Emerging: '#16a34a' };

export default function CoachDashboard() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('athletes');
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [outreachTarget, setOutreachTarget] = useState(null);
  const [coachProfile, setCoachProfile] = useState(null);

  useEffect(() => {
    authFetch('/api/coaches/me')
      .then((r) => r.json())
      .then(({ user, profile }) => setCoachProfile({ name: user?.full_name || user?.username, school: profile?.school_name, position: profile?.position, division: profile?.division }))
      .catch(() => {});
  }, []);

  const [filters, setFilters] = useState({
    utr_min: '', utr_max: '', nationality: '',
    grad_year: '', tier: '', search: '',
  });

  function setF(field, value) {
    setFilters((p) => ({ ...p, [field]: value }));
  }

  async function runSearch(e) {
    e?.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.utr_min)    params.set('utr_min', filters.utr_min);
      if (filters.utr_max)    params.set('utr_max', filters.utr_max);
      if (filters.nationality) params.set('nationality', filters.nationality);
      if (filters.grad_year)  params.set('grad_year', filters.grad_year);
      if (filters.tier)       params.set('tier', filters.tier);
      if (filters.search)     params.set('search', filters.search);
      params.set('limit', '100');

      const res  = await authFetch(`/api/athletes/search?${params}`);
      const data = await res.json();
      setAthletes(data.athletes ?? []);
      setSearched(true);
    } catch {
      setAthletes([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container wide">
      <h1 className="page-heading">Recruit Athletes</h1>
      <p className="page-subheading">Search registered athletes or browse the ITF Junior World Rankings.</p>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e5e7eb' }}>
        {[
          { key: 'athletes', label: 'Find Athletes' },
          { key: 'itf',      label: 'ITF Junior Rankings' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '8px 20px', border: 'none', cursor: 'pointer', fontWeight: 600,
              fontSize: 14, background: 'none',
              borderBottom: activeTab === key ? '2px solid #111' : '2px solid transparent',
              marginBottom: -2,
              color: activeTab === key ? '#111' : '#888',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'itf' && <ItfDirectory coachProfile={coachProfile} />}

      {activeTab === 'athletes' && <>
      {outreachTarget && (
        <OutreachModal
          athlete={{ name: outreachTarget.full_name || outreachTarget.username, utr: outreachTarget.utr, nationality: outreachTarget.nationality, age: outreachTarget.age, itf_rank: outreachTarget.itf_rank, gpa: outreachTarget.gpa }}
          coach={coachProfile}
          sender="coach"
          onClose={() => setOutreachTarget(null)}
        />
      )}

      {/* Search filters */}
      <div className="form-card" style={{ marginBottom: 20 }}>
        <form onSubmit={runSearch}>
          <div className="form-grid" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label>Search by name / nationality</label>
              <input
                type="text" placeholder="e.g. France, or player name"
                value={filters.search}
                onChange={(e) => setF('search', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Recruitment Tier</label>
              <select value={filters.tier} onChange={(e) => setF('tier', e.target.value)}>
                <option value="">All Tiers</option>
                <option>Elite</option>
                <option>High</option>
                <option>Emerging</option>
              </select>
            </div>
            <div className="form-group">
              <label>Graduation Year</label>
              <select value={filters.grad_year} onChange={(e) => setF('grad_year', e.target.value)}>
                <option value="">Any year</option>
                {[2025, 2026, 2027, 2028].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid three" style={{ marginBottom: 18 }}>
            <div className="form-group">
              <label>UTR Minimum</label>
              <input
                type="number" step="0.1" placeholder="e.g. 10.0" min={1} max={16}
                value={filters.utr_min}
                onChange={(e) => setF('utr_min', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>UTR Maximum</label>
              <input
                type="number" step="0.1" placeholder="e.g. 13.0" min={1} max={16}
                value={filters.utr_max}
                onChange={(e) => setF('utr_max', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Nationality</label>
              <input
                type="text" placeholder="e.g. France"
                value={filters.nationality}
                onChange={(e) => setF('nationality', e.target.value)}
              />
            </div>
          </div>

          <div className="flex-row flex-end">
            <button
              type="button" className="btn btn-ghost"
              onClick={() => { setFilters({ utr_min: '', utr_max: '', nationality: '', grad_year: '', tier: '', search: '' }); setAthletes([]); setSearched(false); }}
            >
              Clear
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Spinner /> : null}
              {loading ? 'Searching…' : 'Search Athletes'}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spinner dark />
        </div>
      )}

      {!loading && searched && athletes.length === 0 && (
        <div className="empty-state">
          <h3>No athletes found</h3>
          <p>Try broadening your search filters, or check back as more athletes register.</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <p style={{ fontSize: 15 }}>Use the filters above to search registered athletes.</p>
        </div>
      )}

      {!loading && athletes.length > 0 && (
        <>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>{athletes.length} athletes found</p>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Nationality</th>
                  <th>Age</th>
                  <th>Grad Year</th>
                  <th>UTR</th>
                  <th>ITF Rank</th>
                  <th>GPA</th>
                  <th>Strength</th>
                  <th>Tier</th>
                  <th>Video</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {athletes.map((a) => (
                  <tr
                    key={a.user_id}
                    className="table-row-clickable"
                    onClick={() => navigate(`/profile/${a.username}`)}
                  >
                    <td className="td-name">{a.full_name || a.username}</td>
                    <td>{a.nationality ?? '—'}</td>
                    <td>{a.age ?? '—'}</td>
                    <td>{a.graduation_year ?? '—'}</td>
                    <td><strong>{a.utr ?? '—'}</strong></td>
                    <td>{a.itf_rank ?? <span className="td-muted">—</span>}</td>
                    <td>{a.gpa ?? <span className="td-muted">—</span>}</td>
                    <td>
                      <div className="pss-cell">
                        <div className="pss-bar-mini">
                          <div className="pss-fill-mini" style={{ width: `${(a.player_strength_score * 100).toFixed(0)}%` }} />
                        </div>
                        <span>{(a.player_strength_score * 100).toFixed(0)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="tier-badge" style={{ '--tier-color': TIER_COLORS[a.recruitment_tier] }}>
                        {a.recruitment_tier}
                      </span>
                    </td>
                    <td>
                      {a.video_url
                        ? <a href={a.video_url} target="_blank" rel="noreferrer" className="video-link" onClick={(e) => e.stopPropagation()}>▶ Watch</a>
                        : <span className="td-muted">—</span>}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={(e) => { e.stopPropagation(); setOutreachTarget(a); }}
                      >
                        Contact
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      </>}
    </div>
  );
}
