import { useState } from 'react';

const STORAGE_KEY = 'workus.sidebar.collapsed';

/** Storage can be blocked (private mode, policies): then the choice lasts for the visit only. */
const readCollapsed = (): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

/** Desktop sidebar folded to the icon rail — a per-browser preference, not account data. */
export const useSidebarCollapsed = () => {
  const [isCollapsed, setIsCollapsed] = useState(readCollapsed);
  const toggle = (): void => {
    setIsCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Not remembered; the sidebar still toggles.
      }
      return next;
    });
  };
  return { isCollapsed, toggle };
};
