/**
 * Circular progress ring that displays a 0–100 fit score.
 * Uses SVG stroke-dashoffset to animate the arc.
 */
export default function ScoreRing({ score, category }) {
  const R = 28;
  const C = 2 * Math.PI * R;
  const filled = (score / 100) * C;
  const color =
    category === 'Target' ? '#16a34a' :
    category === 'Reach'  ? '#b45309' :
                            '#1d4ed8';

  return (
    <div className="score-ring">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={R} fill="none" stroke="#e2e2e2" strokeWidth="5" />
        <circle
          cx="36"
          cy="36"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={C}
          strokeDashoffset={C - filled}
          strokeLinecap="round"
        />
      </svg>
      <div className="score-text">
        <span className="score-number" style={{ color }}>{score}</span>
        <span className="score-label">fit</span>
      </div>
    </div>
  );
}
