/** Sub-pixel widths leave a fraction of a pixel "to scroll" at the ends. */
const SLACK = 1;

/**
 * Ref callback for a sideways-scrolling box: marks it `data-more-start` / `data-more-end` while
 * content hides past that edge, so CSS can fade the edge (`.app-scroll-fade`) or shade a sticky
 * column. Stable (module-level), so React sets it up once; the cleanup stops listening.
 */
export function trackScrollEdges(element: HTMLElement | null): (() => void) | undefined {
  if (!element) {
    return undefined;
  }
  const update = () => {
    const { scrollLeft, scrollWidth, clientWidth } = element;
    element.toggleAttribute('data-more-start', scrollLeft > SLACK);
    element.toggleAttribute('data-more-end', scrollLeft + clientWidth < scrollWidth - SLACK);
  };
  update();
  element.addEventListener('scroll', update, { passive: true });
  // The box resizes with the window; its content when data arrives.
  const observer = new ResizeObserver(update);
  observer.observe(element);
  for (const child of element.children) {
    observer.observe(child);
  }
  return () => {
    element.removeEventListener('scroll', update);
    observer.disconnect();
  };
}
