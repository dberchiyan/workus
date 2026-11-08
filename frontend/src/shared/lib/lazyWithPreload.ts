import { type ComponentType, lazy, type LazyExoticComponent } from 'react';

export type PreloadableComponent<T extends ComponentType> = LazyExoticComponent<T> & {
  /** Fetches the page's code ahead of time (hover, focus); safe to call again. */
  preload: () => Promise<unknown>;
};

/**
 * `React.lazy` that can also start loading early: a link preloads its page on hover or focus,
 * so the click renders at once instead of showing the loading bar.
 */
export const lazyWithPreload = <T extends ComponentType>(
  load: () => Promise<{ default: T }>,
): PreloadableComponent<T> => {
  let loading: Promise<{ default: T }> | undefined;
  const once = (): Promise<{ default: T }> => (loading ??= load());
  return Object.assign(lazy(once), { preload: once });
};
