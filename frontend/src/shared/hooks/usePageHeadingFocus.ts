import { type RefObject, useEffect, useRef } from 'react';

/** Route change → focus moves to the page's <h1> (ux.md → Accessibility). */
export const usePageHeadingFocus = <T extends HTMLElement>(): RefObject<T | null> => {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return ref;
};
