import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function Register() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [role, setRole] = useState('athlete');
  const [form, setForm] = useState({
    username: '', password: '', confirmPassword: '',
    fullName: '', email: '',
    schoolName: '', division: '', position: '',
  });
  const [errors, setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState(null);

  function set(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  }

  function validate() {
    const e = {};
    if (!form.username.trim() || form.username.length < 3) e.username = 'Min 3 characters';
    if (!form.password || form.password.length < 6)        e.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword)             e.confirmPassword = 'Passwords do not match';
    if (!form.fullName.trim())                              e.fullName = 'Required';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError(null);

    try {
      const base = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${base}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username:   form.username.trim(),
          password:   form.password,
          email:      form.email.trim() || undefined,
          fullName:   form.fullName.trim(),
          role,
          schoolName: form.schoolName.trim() || undefined,
          division:   form.division || undefined,
          position:   form.position.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Registration failed');

      login(data.token, data.username, data.role);
      navigate(data.role === 'coach' ? '/coach' : '/athlete/profile');
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <div className="login-logo">ARP</div>
        <div className="login-title">Create your account</div>
        <div className="login-subtitle">Athlete Recruitment Platform</div>

        {/* Role toggle */}
        <div className="role-toggle">
          <button
            type="button"
            className={`role-btn${role === 'athlete' ? ' active' : ''}`}
            onClick={() => setRole('athlete')}
          >
            🎾 I'm an Athlete
          </button>
          <button
            type="button"
            className={`role-btn${role === 'coach' ? ' active' : ''}`}
            onClick={() => setRole('coach')}
          >
            🏫 I'm a Coach
          </button>
        </div>

        {apiError && <div className="error-alert" style={{ textAlign: 'left', marginBottom: 16 }}>{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate className="login-form">
          <div className="form-grid" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="Alex Johnson"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                className={errors.fullName ? 'error' : ''}
              />
              {errors.fullName && <span className="field-error">{errors.fullName}</span>}
            </div>
            <div className="form-group">
              <label>Email (optional)</label>
              <input
                type="email"
                placeholder="alex@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                placeholder="alexjohnson"
                value={form.username}
                onChange={(e) => set('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
                className={errors.username ? 'error' : ''}
              />
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Confirm Password *</label>
            <input
              type="password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          {role === 'coach' && (
            <div style={{ borderTop: '1px solid #e2e2e2', paddingTop: 14, marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Coach details (optional — you can update later)</p>
              <div className="form-grid three" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label>School / University</label>
                  <input
                    type="text"
                    placeholder="Wake Forest"
                    value={form.schoolName}
                    onChange={(e) => set('schoolName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Division</label>
                  <select value={form.division} onChange={(e) => set('division', e.target.value)}>
                    <option value="">Select…</option>
                    <option>D1</option>
                    <option>D2</option>
                    <option>D3</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Position / Title</label>
                  <input
                    type="text"
                    placeholder="Head Coach"
                    value={form.position}
                    onChange={(e) => set('position', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={submitting}>
            {submitting ? <Spinner /> : null}
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 12, color: '#888' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#111', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
