import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function OutreachModal({ athlete, schoolName, onClose }) {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState({ subject: '', body: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchEmail() {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch('/api/generate-outreach', {
          method: 'POST',
          body: JSON.stringify({ athlete, school: schoolName }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Server error ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setEmail(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEmail();
    return () => { cancelled = true; };
  }, [athlete, schoolName]);

  async function handleCopy() {
    const text = `Subject: ${email.subject}\n\n${email.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div className="modal-header">
          <h2>Outreach Draft — {schoolName}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <Spinner dark />
            </div>
          )}

          {error && !loading && (
            <div className="error-alert">{error}</div>
          )}

          {!loading && !error && (
            <>
              <div className="email-subject-row">
                <div className="email-field-label">Subject</div>
                <div className="email-subject-text">{email.subject}</div>
              </div>
              <div>
                <div className="email-field-label" style={{ marginBottom: 6 }}>Body</div>
                <textarea
                  className="email-body-textarea"
                  value={email.body}
                  onChange={(e) => setEmail((prev) => ({ ...prev, body: e.target.value }))}
                  spellCheck
                />
              </div>
              <p style={{ fontSize: 11, color: '#999', marginTop: 10 }}>
                Review and edit before sending. This draft is generated for informational purposes only.
              </p>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-secondary"
            onClick={handleCopy}
            disabled={loading || !!error}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
