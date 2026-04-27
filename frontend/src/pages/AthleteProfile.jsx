import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const TIER_COLORS = { Elite: '#9333ea', High: '#2563eb', Emerging: '#16a34a' };

export default function AthleteProfile() {
  const { authFetch, username } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState(null);
  const [apiError, setApiError]   = useState(null);
  const [profile, setProfile]     = useState(null);
  const [pss, setPss]             = useState(null);
  const [tier, setTier]           = useState(null);

  const [form, setForm] = useState({
    full_name: '', age: '', nationality: '', utr: '', itf_rank: '', atp_rank: '',
    gpa: '', sat: '', graduation_year: '', video_url: '', bio: '', is_public: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [meRes, profileRes] = await Promise.all([
          authFetch('/api/auth/me'),
          authFetch('/api/athletes/me'),
        ]);
        const meData      = await meRes.json();
        const profileData = await profileRes.json();
        if (cancelled) return;

        setForm((prev) => ({
          ...prev,
          full_name: meData.full_name || '',
        }));

        if (profileData.profile) {
          const p = profileData.profile;
          setProfile(p);
          setPss(p.player_strength_score);
          setTier(p.recruitment_tier);
          setForm({
            full_name:       meData.full_name || '',
            age:             p.age ?? '',
            nationality:     p.nationality ?? '',
            utr:             p.utr ?? '',
            itf_rank:        p.itf_rank ?? '',
            atp_rank:        p.atp_rank ?? '',
            gpa:             p.gpa ?? '',
            sat:             p.sat ?? '',
            graduation_year: p.graduation_year ?? '',
            video_url:       p.video_url ?? '',
            bio:             p.bio ?? '',
            is_public:       p.is_public !== 0,
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function set(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setApiError(null);
    try {
      const res = await authFetch('/api/athletes/me', {
        method: 'PUT',
        body: JSON.stringify({
          age:             form.age ? Number(form.age) : null,
          nationality:     form.nationality || null,
          utr:             form.utr ? Number(form.utr) : null,
          itf_rank:        form.itf_rank ? Number(form.itf_rank) : null,
          atp_rank:        form.atp_rank ? Number(form.atp_rank) : null,
          gpa:             form.gpa ? Number(form.gpa) : null,
          sat:             form.sat ? Number(form.sat) : null,
          graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
          video_url:       form.video_url || null,
          bio:             form.bio || null,
          is_public:       form.is_public,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setProfile(data.profile);
      setPss(data.profile.player_strength_score);
      setTier(data.profile.recruitment_tier);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <Spinner dark />
      </div>
    );
  }

  const profileUrl = `${window.location.origin}/profile/${username}`;

  return (
    <div className="page-container">
      <h1 className="page-heading">My Athlete Profile</h1>
      <p className="page-subheading">This is your recruiting profile. Keep it up to date — coaches can find you here.</p>

      {error && <div className="error-alert">{error}</div>}

      {/* Strength score + share link */}
      {pss != null && (
        <div className="athlete-profile-banner">
          <div>
            <div className="athlete-pss-row">
              <span className="strength-label">Strength Score</span>
              <div className="strength-track" style={{ flex: 1, minWidth: 120 }}>
                <div className="strength-fill" style={{ width: `${(pss * 100).toFixed(1)}%` }} />
              </div>
              <span className="strength-value">{(pss * 100).toFixed(1)}</span>
              <span className="tier-badge" style={{ '--tier-color': TIER_COLORS[tier] }}>{tier}</span>
            </div>
          </div>
          {form.is_public && (
            <div className="share-url-box">
              <span className="share-url-label">Shareable profile:</span>
              <a className="share-url-link" href={profileUrl} target="_blank" rel="noreferrer">
                {profileUrl}
              </a>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => navigator.clipboard.writeText(profileUrl)}
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}

      {apiError && <div className="error-alert">{apiError}</div>}

      <form onSubmit={handleSave} noValidate>
        <div className="form-card">
          <p className="form-section-label">Personal Information</p>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={form.full_name} disabled style={{ opacity: 0.6 }} />
              <span className="form-hint">Change via account settings</span>
            </div>
            <div className="form-group">
              <label>Nationality</label>
              <input
                type="text" placeholder="e.g. France"
                value={form.nationality}
                onChange={(e) => set('nationality', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input
                type="number" placeholder="17" min={10} max={25}
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Graduation Year</label>
              <input
                type="number" placeholder="2026" min={2024} max={2030}
                value={form.graduation_year}
                onChange={(e) => set('graduation_year', e.target.value)}
              />
            </div>
          </div>

          <hr className="form-divider" />
          <p className="form-section-label">Tennis Rankings</p>
          <div className="form-grid three">
            <div className="form-group">
              <label>UTR Rating *</label>
              <input
                type="number" step="0.1" placeholder="12.4" min={1} max={16}
                value={form.utr}
                onChange={(e) => set('utr', e.target.value)}
              />
              <span className="form-hint">Universal Tennis Rating (1–16)</span>
            </div>
            <div className="form-group">
              <label>ITF Junior Rank</label>
              <input
                type="number" placeholder="88" min={1}
                value={form.itf_rank}
                onChange={(e) => set('itf_rank', e.target.value)}
              />
              <span className="form-hint">Leave blank if unranked</span>
            </div>
            <div className="form-group">
              <label>ATP Rank</label>
              <input
                type="number" placeholder="820" min={1}
                value={form.atp_rank}
                onChange={(e) => set('atp_rank', e.target.value)}
              />
              <span className="form-hint">Leave blank if unranked</span>
            </div>
          </div>

          <hr className="form-divider" />
          <p className="form-section-label">Academic Profile</p>
          <div className="form-grid">
            <div className="form-group">
              <label>GPA</label>
              <input
                type="number" step="0.01" placeholder="3.7" min={0} max={4.0}
                value={form.gpa}
                onChange={(e) => set('gpa', e.target.value)}
              />
              <span className="form-hint">4.0 scale — optional</span>
            </div>
            <div className="form-group">
              <label>SAT Score</label>
              <input
                type="number" placeholder="1340" min={400} max={1600}
                value={form.sat}
                onChange={(e) => set('sat', e.target.value)}
              />
              <span className="form-hint">400–1600 — optional</span>
            </div>
          </div>

          <hr className="form-divider" />
          <p className="form-section-label">Highlight Video & Bio</p>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Highlight Video URL</label>
            <input
              type="url" placeholder="https://youtube.com/watch?v=..."
              value={form.video_url}
              onChange={(e) => set('video_url', e.target.value)}
            />
            <span className="form-hint">YouTube, Vimeo, or any public video link</span>
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Bio / Scout Notes</label>
            <textarea
              className="email-body-textarea"
              style={{ minHeight: 100 }}
              placeholder="Describe your game style, achievements, goals…"
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
            />
          </div>

          <hr className="form-divider" />
          <label className="toggle-row">
            <span>
              <strong>Public profile</strong>
              <span className="form-hint" style={{ display: 'block', marginTop: 2 }}>
                Allow coaches to find you via search and shareable link
              </span>
            </span>
            <input
              type="checkbox"
              className="toggle-checkbox"
              checked={form.is_public}
              onChange={(e) => set('is_public', e.target.checked)}
            />
          </label>
        </div>

        <div className="flex-row flex-end mt-24">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/athlete/matches')}>
            View My Matches →
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Spinner /> : null}
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
