import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const DIVISIONS = ['D1', 'D2', 'D3'];

const LOCATIONS = [
  'Alabama', 'California', 'Connecticut', 'Florida', 'Georgia',
  'Illinois', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
  'Michigan', 'Missouri', 'New York', 'North Carolina', 'Ohio',
  'Pennsylvania', 'South Carolina', 'Tennessee', 'Texas', 'Vermont',
  'Virginia',
];

const DEFAULT_FORM = {
  name: '',
  age: '',
  utr: '',
  itf_rank: '',
  atp_rank: '',
  nationality: '',
  gpa: '',
  sat: '',
  divisions: [],
  locations: [],
  max_tuition: '65000',
};

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Required';
  const age = Number(form.age);
  if (!form.age || isNaN(age) || age < 10 || age > 25) errors.age = 'Must be 10–25';
  const utr = Number(form.utr);
  if (!form.utr || isNaN(utr) || utr < 1 || utr > 16) errors.utr = 'UTR must be 1–16';
  if (!form.nationality.trim()) errors.nationality = 'Required';
  if (form.gpa && (isNaN(Number(form.gpa)) || Number(form.gpa) < 0 || Number(form.gpa) > 4.0))
    errors.gpa = 'GPA must be 0–4.0';
  if (form.sat && (isNaN(Number(form.sat)) || Number(form.sat) < 400 || Number(form.sat) > 1600))
    errors.sat = 'SAT must be 400–1600';
  const maxT = Number(form.max_tuition);
  if (!form.max_tuition || isNaN(maxT) || maxT < 5000)
    errors.max_tuition = 'Must be ≥ $5,000';
  return errors;
}

export default function PlayerInput() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  }

  function toggleDivision(div) {
    setForm((prev) => ({
      ...prev,
      divisions: prev.divisions.includes(div)
        ? prev.divisions.filter((d) => d !== div)
        : [...prev.divisions, div],
    }));
  }

  function toggleLocation(loc) {
    setForm((prev) => ({
      ...prev,
      locations: prev.locations.includes(loc)
        ? prev.locations.filter((l) => l !== loc)
        : [...prev.locations, loc],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setApiError(null);

    const payload = {
      athlete_profile: {
        name: form.name.trim(),
        age: Number(form.age),
        utr: Number(form.utr),
        itf_rank: form.itf_rank ? Number(form.itf_rank) : null,
        atp_rank: form.atp_rank ? Number(form.atp_rank) : null,
        nationality: form.nationality.trim(),
        gpa: form.gpa ? Number(form.gpa) : null,
        sat: form.sat ? Number(form.sat) : null,
      },
      preferences: {
        division: form.divisions,
        locations: form.locations,
        max_tuition: Number(form.max_tuition),
      },
    };

    try {
      const res = await authFetch('/api/match-athlete', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Server returned ${res.status}`);
      }

      const data = await res.json();
      navigate('/results', { state: { results: data, athlete: payload.athlete_profile } });
    } catch (err) {
      setApiError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-heading">Player Profile</h1>
      <p className="page-subheading">
        Enter the athlete's competitive data and recruitment preferences to generate school matches.
      </p>

      {apiError && <div className="error-alert">{apiError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-card">
          <p className="form-section-label">Athlete Information</p>
          <div className="form-grid">
            <Field label="Full Name" required error={errors.name}>
              <input
                type="text"
                placeholder="e.g. Lucas Moreau"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={errors.name ? 'error' : ''}
              />
            </Field>
            <Field label="Age" required error={errors.age}>
              <input
                type="number"
                placeholder="17"
                min={10}
                max={25}
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
                className={errors.age ? 'error' : ''}
              />
            </Field>
            <Field label="Nationality" required error={errors.nationality}>
              <input
                type="text"
                placeholder="e.g. France"
                value={form.nationality}
                onChange={(e) => set('nationality', e.target.value)}
                className={errors.nationality ? 'error' : ''}
              />
            </Field>
          </div>

          <hr className="form-divider" />
          <p className="form-section-label">Competitive Rankings</p>

          <div className="form-grid three">
            <Field label="UTR Rating" required error={errors.utr}>
              <input
                type="number"
                step="0.1"
                placeholder="12.4"
                min={1}
                max={16}
                value={form.utr}
                onChange={(e) => set('utr', e.target.value)}
                className={errors.utr ? 'error' : ''}
              />
              <span className="form-hint">Universal Tennis Rating (0–16)</span>
            </Field>
            <Field label="ITF Junior Rank" error={errors.itf_rank}>
              <input
                type="number"
                placeholder="180"
                min={1}
                max={2000}
                value={form.itf_rank}
                onChange={(e) => set('itf_rank', e.target.value)}
              />
              <span className="form-hint">Leave blank if not ranked</span>
            </Field>
            <Field label="ATP Rank" error={errors.atp_rank}>
              <input
                type="number"
                placeholder="820"
                min={1}
                max={2000}
                value={form.atp_rank}
                onChange={(e) => set('atp_rank', e.target.value)}
              />
              <span className="form-hint">Leave blank if not ranked</span>
            </Field>
          </div>

          <hr className="form-divider" />
          <p className="form-section-label">Academic Profile</p>

          <div className="form-grid">
            <Field label="GPA" error={errors.gpa}>
              <input
                type="number"
                step="0.01"
                placeholder="3.7"
                min={0}
                max={4.0}
                value={form.gpa}
                onChange={(e) => set('gpa', e.target.value)}
                className={errors.gpa ? 'error' : ''}
              />
              <span className="form-hint">4.0 scale — optional</span>
            </Field>
            <Field label="SAT Score" error={errors.sat}>
              <input
                type="number"
                placeholder="1340"
                min={400}
                max={1600}
                value={form.sat}
                onChange={(e) => set('sat', e.target.value)}
                className={errors.sat ? 'error' : ''}
              />
              <span className="form-hint">400–1600 — optional</span>
            </Field>
          </div>

          <hr className="form-divider" />
          <p className="form-section-label">Recruitment Preferences</p>

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label>Division Preference <span style={{ color: '#aaa', fontWeight: 400 }}>(select all that apply)</span></label>
            <div className="checkbox-group">
              {DIVISIONS.map((div) => (
                <label
                  key={div}
                  className={`checkbox-pill${form.divisions.includes(div) ? ' checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={form.divisions.includes(div)}
                    onChange={() => toggleDivision(div)}
                  />
                  {div}
                </label>
              ))}
            </div>
            <span className="form-hint">Leave all unchecked to consider every division</span>
          </div>

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label>Preferred Locations <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
            <div className="checkbox-group">
              {LOCATIONS.map((loc) => (
                <label
                  key={loc}
                  className={`checkbox-pill${form.locations.includes(loc) ? ' checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={form.locations.includes(loc)}
                    onChange={() => toggleLocation(loc)}
                  />
                  {loc}
                </label>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <Field label="Maximum Annual Tuition (OOS)" required error={errors.max_tuition}>
              <input
                type="number"
                placeholder="65000"
                min={5000}
                max={100000}
                value={form.max_tuition}
                onChange={(e) => set('max_tuition', e.target.value)}
                className={errors.max_tuition ? 'error' : ''}
              />
              <span className="form-hint">Out-of-state tuition ceiling in USD</span>
            </Field>
          </div>
        </div>

        <div className="flex-row flex-end mt-24">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { setForm(DEFAULT_FORM); setErrors({}); }}
            disabled={submitting}
          >
            Reset
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <Spinner /> : null}
            {submitting ? 'Analyzing…' : 'Find Matches'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div className="form-group">
      <label>
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
