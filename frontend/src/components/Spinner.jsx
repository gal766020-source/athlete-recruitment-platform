export default function Spinner({ dark = false }) {
  return <div className={`spinner${dark ? ' dark' : ''}`} aria-label="Loading" />;
}
