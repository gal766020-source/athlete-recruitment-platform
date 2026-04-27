import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';

const TIER_COLORS = { Elite: '#9333ea', High: '#2563eb', Emerging: '#16a34a' };

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const base = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${base}/api/athletes/public/${username}`);
        if (!res.ok) throw new Error('Profile not found or set to private');
        const data = await res.json();
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [username]);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100, minHeight: '100vh', background: '#f5f5f5' }}>
        <Spinner dark />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Profile not available</h2>
          <p style={{ color: '#888', marginBottom: 20 }}>{error ?? 'This profile is private or does not exist.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </div>
    );
  }

  const pss  = profile.player_strength_score;
  const tier = profile.recruitment_tier;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header bar */}
        <div className="public-profile-bar">
          <span className="header-logo">ARP</span>
          <span style={{ fontSize: 13, color: '#555' }}>Athlete Recruitment Platform</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
              {copied ? '✓ Copied' : '🔗 Share'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>

        {/* Profile card */}
        <div className="form-card" style={{ marginTop: 20 }}>
          <div className="profile-header">
            <div className="profile-avatar">
              {(profile.full_name || username).split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
                {profile.full_name || username}
              </h1>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                {profile.nationality ?? ''}
                {profile.age ? ` · Age ${profile.age}` : ''}
                {profile.graduation_year ? ` · Class of ${profile.graduation_year}` : ''}
                {profile.itf_rank ? ` · ITF #${profile.itf_rank}` : ''}
                {profile.atp_rank ? ` · ATP #${profile.atp_rank}` : ''}
              </p>
              {tier && (
                <span className="tier-badge-lg" style={{ '--tier-color': TIER_COLORS[tier] }}>{tier}</span>
              )}
            </div>
          </div>

          {/* PSS bar */}
          {pss != null && (
            <div className="results-strength-bar" style={{ marginTop: 20 }}>
              <span className="strength-label">Player Strength Score</span>
              <div className="strength-track">
                <div className="strength-fill" style={{ width: `${(pss * 100).toFixed(1)}%`, background: TIER_COLORS[tier] }} />
              </div>
              <span className="strength-value">{(pss * 100).toFixed(1)}</span>
            </div>
          )}

          {/* Stats */}
          <div className="profile-stats-grid" style={{ marginTop: 20 }}>
            <StatCard label="UTR Rating"  value={profile.utr ?? '—'}        sub="Universal Tennis Rating" />
            <StatCard label="ITF Rank"    value={profile.itf_rank ?? '—'}   sub="Junior circuit" />
            <StatCard label="ATP Rank"    value={profile.atp_rank ?? '—'}   sub="Professional circuit" />
            <StatCard label="GPA"         value={profile.gpa ?? '—'}        sub="4.0 scale" />
            <StatCard label="SAT"         value={profile.sat ?? '—'}        sub="400–1600" />
            <StatCard label="Grad Year"   value={profile.graduation_year ?? '—'} sub="Expected graduation" />
          </div>

          {/* Bio */}
          {profile.bio && (
            <>
              <hr className="form-divider" />
              <h3 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 10 }}>
                About
              </h3>
              <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7 }}>{profile.bio}</p>
            </>
          )}

          {/* Video */}
          {profile.video_url && (
            <>
              <hr className="form-divider" />
              <h3 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 10 }}>
                Highlight Video
              </h3>
              <a
                href={profile.video_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                ▶ Watch Highlights
              </a>
            </>
          )}

          {/* CTA for coaches */}
          <hr className="form-divider" />
          <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '16px 20px', border: '1px solid #e2e2e2' }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Are you a college coach?</p>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              Sign in to the Athlete Recruitment Platform to access full analytics, contact this athlete, and search our full database.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>
              Create Coach Account
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#bbb' }}>
          Powered by Athlete Recruitment Platform · arp.tennis
        </p>
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
