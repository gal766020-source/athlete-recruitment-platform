import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const TIER_COLORS = { Elite: '#9333ea', High: '#2563eb', Emerging: '#16a34a' };

export default function Players() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState(searchParams.get('tier') ?? '');
  const [sortKey, setSortKey] = useState('player_strength_score');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await authFetch('/api/players');
        const data = await res.json();
        if (!cancelled) setPlayers(data.players ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = [...players];
    if (tierFilter) list = list.filter((p) => p.recruitment_tier === tierFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.nationality.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (av == null) av = 0;
      if (bv == null) bv = 0;
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [players, tierFilter, search, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  function SortHeader({ label, field }) {
    const active = sortKey === field;
    return (
      <th className="th-sortable" onClick={() => toggleSort(field)}>
        {label}
        <span className="sort-arrow">{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span>
      </th>
    );
  }

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <Spinner dark />
      </div>
    );
  }

  if (error) {
    return <div className="page-container"><div className="error-alert">{error}</div></div>;
  }

  return (
    <div className="page-container wide">
      <h1 className="page-heading">Player Database</h1>
      <p className="page-subheading">{players.length} tracked prospects · Click a row to view full profile</p>

      {/* Filters */}
      <div className="table-filters">
        <input
          className="table-search-input"
          placeholder="Search by name or nationality…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-pills">
          {['', 'Elite', 'High', 'Emerging'].map((t) => (
            <button
              key={t}
              className={`filter-pill${tierFilter === t ? ' active' : ''}`}
              style={tierFilter === t && t ? { '--pill-color': TIER_COLORS[t] } : {}}
              onClick={() => setTierFilter(t)}
            >
              {t || 'All Tiers'}
            </button>
          ))}
        </div>
        <span className="table-count">{filtered.length} players</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No players found</h3>
          <p>Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <SortHeader label="Name" field="name" />
                <SortHeader label="Nationality" field="nationality" />
                <SortHeader label="Age" field="age" />
                <SortHeader label="UTR" field="utr" />
                <SortHeader label="ITF Rank" field="itf_rank" />
                <SortHeader label="GPA" field="gpa" />
                <SortHeader label="Strength" field="player_strength_score" />
                <th>Tier</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className="table-row-clickable" onClick={() => navigate(`/players/${p.id}`)}>
                  <td className="td-muted">{i + 1}</td>
                  <td className="td-name">{p.name}</td>
                  <td>{p.nationality}</td>
                  <td>{p.age}</td>
                  <td><strong>{p.utr}</strong></td>
                  <td>{p.itf_rank ?? <span className="td-muted">—</span>}</td>
                  <td>{p.gpa ?? <span className="td-muted">—</span>}</td>
                  <td>
                    <div className="pss-cell">
                      <div className="pss-bar-mini">
                        <div className="pss-fill-mini" style={{ width: `${(p.player_strength_score * 100).toFixed(0)}%` }} />
                      </div>
                      <span>{(p.player_strength_score * 100).toFixed(0)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="tier-badge" style={{ '--tier-color': TIER_COLORS[p.recruitment_tier] }}>
                      {p.recruitment_tier}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={(e) => { e.stopPropagation(); navigate(`/players/${p.id}`); }}
                    >
                      Profile →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
