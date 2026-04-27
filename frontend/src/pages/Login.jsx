import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function Login() {
  const { login, isAuthed, role } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  if (isAuthed) {
    if (role === 'coach')   return <Navigate to="/coach" replace />;
    if (role === 'athlete') return <Navigate to="/athlete/profile" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${base}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Login failed');
      login(data.token, data.username, data.role);

      if (data.role === 'coach')   navigate('/coach');
      else if (data.role === 'athlete') navigate('/athlete/profile');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-logo">ARP</div>
        <h1 className="login-title">Athlete Recruitment Platform</h1>
        <p className="login-subtitle">Sign in to your account</p>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text" autoComplete="username" autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>
          <div className="form-group" style={{ marginTop: 10 }}>
            <label>Password</label>
            <input
              type="password" autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 14 }}>
            {loading ? <Spinner /> : 'Sign In'}
          </button>
        </form>

        <p className="login-hint" style={{ marginTop: 10 }}>Admin: admin / admin123</p>

        <p style={{ marginTop: 16, fontSize: 12, color: '#888' }}>
          New here?{' '}
          <Link to="/register" style={{ color: '#111', fontWeight: 500 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
