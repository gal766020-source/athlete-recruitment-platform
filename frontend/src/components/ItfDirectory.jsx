import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import OutreachModal from './OutreachModal';
import Spinner from './Spinner';

const GENDER_LABELS = { boys: '♂ Boys', girls: '♀ Girls' };

export default function ItfDirectory({ coachProfile }) {
  const { authFetch } = useAuth();

  const [players, setPlayers]           = useState([]);
  const [total, setTotal]               = useState(0);
  const [rankingDate, setRankingDate]   = useState('');
  const [loading, setLoading]           = useState(false);
  const [searched, setSearched]         = useState(false);
  const [outreachTarget, setOutreachTarget] = useState(null);

  const [filters, setFilters] = useState({ gender: 'all', nationality: '', search: '' });
  function setF(field, value) { setFilters((p) => ({ ...p, [field]: value })); }

  async function runSearch(e) {
    e?.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (filters.gender !== 'all') params.set('gender', filters.gender);
      if (filters.nationality)      params.set('nationality', filters.nationality);
      if (filters.search)           params.set('search', filters.search);

      const res  = await authFetch(`/api/itf?${params}`);
      const data = await res.json();
      setPlayers(data.players ?? []);
      setTotal(data.total ?? 0);
      setRankingDate(data.ranking_date ?? '');
      setSearched(true);
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {outreachTarget && (
        <OutreachModal
          athlete={{ name: outreachTarget.name, nationality: outreachTarget.nationality, utr: null }}
          coach={coachProfile}
          sender="coach"
          onClose={() => setOutreachTarget(null)}
        />
      )}

      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
          Real-time ITF Junior World Rankings (U18) — top 100 boys &amp; top 100 girls.
          Rankings sourced from official ITF data.{rankingDate ? ` Last updated: ${rankingDate}.` : ''}
          {' '}Stats shown are ITF ranking only — UTR and academics are not included in ITF data.
        </p>
      </div>

      <div className="form-card" style={{ marginBottom: 20 }}>
        <form onSubmit={runSearch}>
          <div className="form-grid three" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label>Gender</label>
              <select value={filters.gender} onChange={(e) => setF('gender', e.target.value)}>
                <option value="all">All</option>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </div>
            <div className="form-group">
              <label>Search by name</label>
              <input
                type="text" placeholder="e.g. Ivan Ivanov"
                value={filters.search}
                onChange={(e) => setF('search', e.target.value)}
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
              onClick={() => { setFilters({ gender: 'all', nationality: '', search: '' }); setPlayers([]); setSearched(false); }}
            >
              Clear
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Spinner /> : null}
              {loading ? 'Loading…' : 'Search Rankings'}
            </button>
          </div>
        </form>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spinner dark />
        </div>
      )}

      {!loading && !searched && (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <p style={{ fontSize: 15 }}>Use the filters above to browse ITF junior rankings.</p>
        </div>
      )}

      {!loading && searched && players.length === 0 && (
        <div className="empty-state">
          <h3>No players found</h3>
          <p>Try adjusting your filters.</p>
        </div>
      )}

      {!loading && players.length > 0 && (
        <>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
            {total} players found
          </p>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ITF Rank</th>
                  <th>Name</th>
                  <th>Nationality</th>
                  <th>Category</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={`${p.gender}-${p.rank}-${i}`}>
                    <td><strong>#{p.rank}</strong></td>
                    <td className="td-name">{p.name}</td>
                    <td>{p.nationality}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px',
                        borderRadius: 4,
                        background: p.gender === 'boys' ? '#dbeafe' : '#fce7f3',
                        color:      p.gender === 'boys' ? '#1d4ed8' : '#be185d',
                      }}>
                        {GENDER_LABELS[p.gender]}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => setOutreachTarget(p)}
                      >
                        Draft Email
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: '#aaa', marginTop: 10 }}>
            * These players have not registered on this platform. The outreach draft is a template for you to send via your own email client.
          </p>
        </>
      )}
    </div>
  );
}
