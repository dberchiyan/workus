/**
 * A thin bar along the top edge while a page loads. It appears only after 150 ms, so quick loads
 * show nothing; with reduced motion it stays still. Decorative — the caller announces the state.
 * CSS keyframes (`.app-progress*` in theme/tailwind.css), not Motion: the bar is on the first
 * load, and Motion would add ~45 KB to it.
 */
export function TopProgressBar() {
  return (
    <div
      aria-hidden
      className="app-progress pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
    >
      <div className="app-progress-bar h-full w-1/3 bg-primary" />
    </div>
  );
}
