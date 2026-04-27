import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const DIV_COLORS = { D1: '#dc2626', D2: '#2563eb', D3: '#16a34a' };

export default function Schools() {
  const { authFetch } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [divFilter, setDivFilter] = useState('');
  const [sortKey, setSortKey] = useState('tennis_utr_benchmark');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await authFetch('/api/schools');
        const data = await res.json();
        if (!cancelled) setSchools(data.schools ?? []);
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
    let list = [...schools];
    if (divFilter) list = list.filter((s) => s.division === divFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (av == null) av = 0;
      if (bv == null) bv = 0;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [schools, divFilter, search, sortKey, sortDir]);

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
      <h1 className="page-heading">School Database</h1>
      <p className="page-subheading">{schools.length} US college tennis programs · D1, D2, and D3</p>

      <div className="table-filters">
        <input
          className="table-search-input"
          placeholder="Search by school name or state…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-pills">
          {['', 'D1', 'D2', 'D3'].map((d) => (
            <button
              key={d}
              className={`filter-pill${divFilter === d ? ' active' : ''}`}
              style={divFilter === d && d ? { '--pill-color': DIV_COLORS[d] } : {}}
              onClick={() => setDivFilter(d)}
            >
              {d || 'All Divisions'}
            </button>
          ))}
        </div>
        <span className="table-count">{filtered.length} schools</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No schools found</h3>
          <p>Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <SortHeader label="School" field="name" />
                <SortHeader label="Division" field="division" />
                <SortHeader label="Location" field="location" />
                <SortHeader label="OOS Tuition" field="tuition" />
                <SortHeader label="UTR Benchmark" field="tennis_utr_benchmark" />
                <SortHeader label="Min GPA" field="gpa_min" />
                <SortHeader label="SAT Range" field="sat_min" />
                <SortHeader label="Accept %" field="acceptance_rate" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id}>
                  <td className="td-muted">{i + 1}</td>
                  <td className="td-name">{s.name}</td>
                  <td>
                    <span className="div-badge" style={{ '--div-color': DIV_COLORS[s.division] }}>
                      {s.division}
                    </span>
                  </td>
                  <td>{s.location}</td>
                  <td>${s.tuition.toLocaleString()}</td>
                  <td><strong>{s.tennis_utr_benchmark}</strong></td>
                  <td>{s.gpa_min}</td>
                  <td>{s.sat_min}–{s.sat_max}</td>
                  <td>{s.acceptance_rate != null ? `${Math.round(s.acceptance_rate * 100)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
