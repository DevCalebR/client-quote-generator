export function RouteLoadingState() {
  return (
    <div className="route-loading-state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>Loading route...</p>
    </div>
  )
}
