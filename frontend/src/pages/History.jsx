import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function History() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    authFetch('/api/history')
      .then((r) => r.json())
      .then((d) => setHistory(d.history ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function loadSearch(id) {
    try {
      const res  = await authFetch(`/api/history/${id}`);
      const data = await res.json();
      navigate('/results', {
        state: {
          results:  { matches: data.results, player_strength_score: data.player_strength_score, normalization_components: null },
          athlete:  data.athlete_data,
          fromHistory: true,
        },
      });
    } catch (e) {
      alert('Failed to load search: ' + e.message);
    }
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')}>← Back</button>
      </div>

      <h1 className="page-heading">Search History</h1>
      <p className="page-subheading">Your past athlete evaluations, most recent first.</p>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spinner dark />
        </div>
      )}

      {error && <div className="error-alert">{error}</div>}

      {!loading && !error && history.length === 0 && (
        <div className="empty-state">
          <h3>No searches yet</h3>
          <p>Submit a player profile to start building your history.</p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="history-list">
          {history.map((row) => (
            <div key={row.id} className="history-card" onClick={() => loadSearch(row.id)}>
              <div className="history-card-left">
                <span className="history-athlete">{row.athlete_name}</span>
                <span className="history-meta">
                  {row.preferences?.division?.join(', ') || 'All divisions'} ·{' '}
                  {row.match_count} matches · PSS {(row.player_strength_score * 100).toFixed(0)}
                </span>
              </div>
              <div className="history-card-right">
                <span className="history-date">{formatDate(row.created_at)}</span>
                <span className="history-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso + 'Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
