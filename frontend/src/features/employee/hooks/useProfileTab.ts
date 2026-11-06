import { useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { z } from 'zod';

export const PROFILE_TABS = ['info', 'files', 'review', 'actions'] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];

const tabSchema = z.enum(PROFILE_TABS).catch('info');

/** The open tab lives in the URL (`?tab=files`), so it survives reloads and can be shared. */
export const useProfileTab = (): { tab: ProfileTab; setTab: (tab: ProfileTab) => void } => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Keep the navigation state (where "Employees" leads back to) when switching tabs.
  const state: unknown = useLocation().state;
  const setTab = useCallback(
    (tab: ProfileTab) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (tab === 'info') {
            next.delete('tab');
          } else {
            next.set('tab', tab);
          }
          return next;
        },
        { replace: true, state },
      );
    },
    [setSearchParams, state],
  );
  return { tab: tabSchema.parse(searchParams.get('tab') ?? undefined), setTab };
};
