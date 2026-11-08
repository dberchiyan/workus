import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import SettingsBrightnessOutlined from '@mui/icons-material/SettingsBrightnessOutlined';
import { useColorScheme } from '@mui/material/styles';
import { type ReactNode, useDeferredValue } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useAccess, useLogout } from '@/features/auth';
import { useEmployeeQuickSearch } from '@/features/employee/core';
import { SETTINGS_SECTIONS, sectionAccessPart } from '@/features/settings';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { employeeProfilePath, settingsPath } from '@/shared/lib/paths';
import { useNavigationItems } from './useNavigationItems';

export const COMMAND_GROUPS = ['people', 'pages', 'settings', 'preferences', 'account'] as const;
export type CommandGroup = (typeof COMMAND_GROUPS)[number];

export interface Command {
  id: string;
  group: CommandGroup;
  label: string;
  /** A second, muted line: a position, "Settings", "Current". */
  hint?: string;
  /** Extra words the search matches (not shown). */
  keywords?: string;
  leading: ReactNode;
  run: () => void;
}

/** People search starts at two characters (one matches almost everyone). */
const MIN_PEOPLE_QUERY = 2;
const THEMES = [
  { mode: 'light', icon: LightModeOutlined },
  { mode: 'dark', icon: DarkModeOutlined },
  { mode: 'system', icon: SettingsBrightnessOutlined },
] as const;

/** Best first: the label starts with the query, then a word in it does, then it only contains it. */
const score = (command: Command, query: string): number => {
  const label = command.label.toLowerCase();
  if (label.startsWith(query)) {
    return 3;
  }
  if (label.split(/\s+/).some((word) => word.startsWith(query))) {
    return 2;
  }
  return `${label} ${command.keywords?.toLowerCase() ?? ''}`.includes(query) ? 1 : 0;
};

/**
 * Everything the command menu offers the signed-in person — pages and settings they can open
 * (by ACCESS), the theme, signing out and, for admins, people by name or email — filtered by
 * the query and grouped in a fixed order.
 */
export const useCommands = (query: string) => {
  const { t } = useTranslation(['shell', 'settings', 'common']);
  const navigate = useNavigate();
  const can = useAccess();
  const { main, bottom } = useNavigationItems();
  const { mode, setMode } = useColorScheme();
  const logout = useLogout();
  const normalized = query.trim().toLowerCase();
  const peopleQuery = useDeferredValue(normalized);
  const searchesPeople = can('section.employees') && peopleQuery.length >= MIN_PEOPLE_QUERY;
  const people = useEmployeeQuickSearch(peopleQuery, searchesPeople);

  const fixed: Command[] = [
    ...[...main, ...bottom].map((item) => ({
      id: `page:${item.section}`,
      group: 'pages' as const,
      label: t(`shell:nav.${item.section}`),
      leading: <item.icon aria-hidden fontSize="small" />,
      run: () => {
        void navigate(item.path);
      },
    })),
    ...SETTINGS_SECTIONS.filter((section) => {
      const part = sectionAccessPart(section.key);
      return part === undefined || can(part);
    }).map((section) => ({
      id: `settings:${section.key}`,
      group: 'settings' as const,
      label: t(`settings:sections.${section.key}`),
      keywords: 'settings preferences',
      leading: <section.icon aria-hidden fontSize="small" />,
      run: () => {
        void navigate(settingsPath(section.key));
      },
    })),
    ...THEMES.map(({ mode: option, icon: Icon }) => ({
      id: `theme:${option}`,
      group: 'preferences' as const,
      label: t('shell:command.theme', { theme: t(`common:theme.${option}`) }),
      ...((mode ?? 'system') === option ? { hint: t('shell:command.current') } : {}),
      keywords: 'appearance mode colour color',
      leading: <Icon aria-hidden fontSize="small" />,
      run: () => {
        setMode(option);
      },
    })),
    {
      id: 'account:sign-out',
      group: 'account',
      label: t('shell:account.signOut'),
      keywords: 'log out logout exit',
      leading: <LogoutOutlined aria-hidden fontSize="small" />,
      run: () => {
        logout.mutate();
      },
    },
  ];

  const found: Command[] = searchesPeople
    ? (people.data?.content ?? []).map((person) => ({
        id: `person:${person.id}`,
        group: 'people',
        label: `${person.firstName} ${person.lastName}`,
        hint: person.position.title,
        keywords: person.email,
        leading: (
          <InitialsAvatar
            id={person.userId}
            firstName={person.firstName}
            lastName={person.lastName}
            size="sm"
          />
        ),
        run: () => {
          void navigate(employeeProfilePath(person.id));
        },
      }))
    : [];

  const matching =
    normalized.length === 0
      ? fixed
      : fixed
          .map((command) => ({ command, rank: score(command, normalized) }))
          .filter(({ rank }) => rank > 0)
          .sort((a, b) => b.rank - a.rank)
          .map(({ command }) => command);
  // The server already matched people (name or email); keep its order.
  const commands = [...found, ...matching];
  const groups = COMMAND_GROUPS.map((group) => ({
    group,
    commands: commands.filter((command) => command.group === group),
  })).filter(({ commands: inGroup }) => inGroup.length > 0);

  return {
    groups,
    /** In display order — what ↑ / ↓ walk through. */
    ordered: groups.flatMap(({ commands: inGroup }) => inGroup),
    isSearchingPeople: searchesPeople && people.isFetching,
  };
};
