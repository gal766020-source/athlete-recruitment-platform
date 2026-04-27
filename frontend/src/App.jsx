import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login          from './pages/Login';
import Register       from './pages/Register';
import Dashboard      from './pages/Dashboard';
import PlayerInput    from './pages/PlayerInput';
import Results        from './pages/Results';
import History        from './pages/History';
import Players        from './pages/Players';
import PlayerProfile  from './pages/PlayerProfile';
import Schools        from './pages/Schools';
import AthleteProfile from './pages/AthleteProfile';
import CoachDashboard from './pages/CoachDashboard';
import PublicProfile  from './pages/PublicProfile';

// Nav links per role
const ADMIN_NAV = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/players',   label: 'Players' },
  { path: '/schools',   label: 'Schools' },
  { path: '/',          label: 'Match Engine', exact: true },
  { path: '/history',   label: 'History' },
];
const COACH_NAV = [
  { path: '/coach',     label: 'Find Athletes' },
  { path: '/schools',   label: 'Schools' },
  { path: '/',          label: 'Match Engine', exact: true },
];
const ATHLETE_NAV = [
  { path: '/athlete/profile', label: 'My Profile' },
  { path: '/',                label: 'Match Engine', exact: true },
  { path: '/history',         label: 'History' },
];

function Header() {
  const { isAuthed, username, role, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const navLinks = role === 'coach' ? COACH_NAV : role === 'athlete' ? ATHLETE_NAV : ADMIN_NAV;

  function isActive(path, exact) {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  }

  function homeClick() {
    if (role === 'coach')   navigate('/coach');
    else if (role === 'athlete') navigate('/athlete/profile');
    else navigate('/dashboard');
  }

  return (
    <header className="app-header">
      <div className="header-inner">
        <button className="header-logo-btn" onClick={homeClick}>
          <span className="header-logo">ARP</span>
          <span className="header-title">Athlete Recruitment Platform</span>
        </button>

        {isAuthed && (
          <nav className="header-nav">
            {navLinks.map(({ path, label, exact }) => (
              <button
                key={path}
                className={`header-nav-link${isActive(path, exact) ? ' active' : ''}`}
                onClick={() => navigate(path)}
              >
                {label}
              </button>
            ))}
          </nav>
        )}

        <div className="header-actions">
          {isAuthed ? (
            <>
              {role && role !== 'admin' && (
                <span className="role-chip">{role === 'coach' ? '🏫 Coach' : '🎾 Athlete'}</span>
              )}
              <span className="header-user">{username}</span>
              <button className="header-nav-btn" onClick={logout}>Sign out</button>
            </>
          ) : (
            <span className="header-badge">INTERNAL TOOL</span>
          )}
        </div>
      </div>
    </header>
  );
}

function AppRoutes() {
  return (
    <>
      <Header />
      <main className="app-main">
        <Routes>
          {/* Public */}
          <Route path="/login"            element={<Login />} />
          <Route path="/register"         element={<Register />} />
          <Route path="/profile/:username" element={<PublicProfile />} />

          {/* Admin / shared */}
          <Route path="/dashboard"        element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/"                 element={<ProtectedRoute><PlayerInput /></ProtectedRoute>} />
          <Route path="/results"          element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="/history"          element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/players"          element={<ProtectedRoute><Players /></ProtectedRoute>} />
          <Route path="/players/:id"      element={<ProtectedRoute><PlayerProfile /></ProtectedRoute>} />
          <Route path="/schools"          element={<ProtectedRoute><Schools /></ProtectedRoute>} />

          {/* Athlete */}
          <Route path="/athlete/profile"  element={<ProtectedRoute><AthleteProfile /></ProtectedRoute>} />
          <Route path="/athlete/matches"  element={<ProtectedRoute><PlayerInput /></ProtectedRoute>} />

          {/* Coach */}
          <Route path="/coach"            element={<ProtectedRoute><CoachDashboard /></ProtectedRoute>} />

          <Route path="*"                 element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
}
