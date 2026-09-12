export function PageLoading({ label = "Loading…" }) {
  return (
    <div className="page-loading">
      <div className="spinner" />
      <div className="loading-label">{label}</div>
    </div>
  );
}
