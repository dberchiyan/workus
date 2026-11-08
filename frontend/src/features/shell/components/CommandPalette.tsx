import SearchOutlined from '@mui/icons-material/SearchOutlined';
import Dialog from '@mui/material/Dialog';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';
import { useCallback, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { type Command, useCommands } from '../hooks/useCommands';

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

/**
 * ⌘K / Ctrl+K: type to find a page, a setting, a person or an action; ↑ ↓ choose, Enter runs.
 * WAI-ARIA combobox with a listbox — focus stays in the input, the active option is named by
 * aria-activedescendant. The dialog remounts on each opening (empty query).
 */
export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { t } = useTranslation('shell');
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const listId = `${baseId}-list`;
  const optionId = (command: Command): string => `${baseId}-${command.id}`;
  const { groups, ordered, isSearchingPeople } = useCommands(query);
  const active = ordered[Math.min(activeIndex, ordered.length - 1)];

  // Typing can start the moment ⌘K is pressed: the input takes focus as soon as it exists (the
  // portal mounts it a render after opening), not after the dialog's fade — so the dialog's own
  // first focus is off.
  const focusOnAttach = useCallback((node: HTMLInputElement | null) => {
    node?.focus();
  }, []);

  const run = (command: Command): void => {
    onClose();
    command.run();
  };
  const move = (step: number): void => {
    if (ordered.length === 0) {
      return;
    }
    const next =
      (Math.min(activeIndex, ordered.length - 1) + step + ordered.length) % ordered.length;
    setActiveIndex(next);
    const target = ordered[next];
    if (target) {
      listRef.current
        ?.querySelector(`[id="${CSS.escape(optionId(target))}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
      disableAutoFocus
      // Opens near the top (like a search box), not centred: one-off geometry.
      slotProps={{
        paper: { className: 'self-start mt-[12vh] overflow-hidden' },
      }}
    >
      <h2 id={titleId} className="sr-only">
        {t('command.title')}
      </h2>
      <div className="flex items-center gap-3 border-b border-divider px-4">
        <SearchOutlined aria-hidden color="action" />
        <InputBase
          inputRef={focusOnAttach}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              move(event.key === 'ArrowDown' ? 1 : -1);
            } else if (event.key === 'Enter' && active) {
              event.preventDefault();
              run(active);
            }
          }}
          placeholder={t('command.placeholder')}
          className="h-14 flex-1"
          inputProps={{
            role: 'combobox',
            'aria-expanded': true,
            'aria-controls': listId,
            'aria-autocomplete': 'list',
            'aria-activedescendant': active ? optionId(active) : undefined,
            'aria-label': t('command.placeholder'),
            maxLength: 100,
          }}
        />
      </div>
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={t('command.title')}
        aria-busy={isSearchingPeople}
        className="max-h-[min(60vh,26rem)] overflow-y-auto p-2"
      >
        {groups.length === 0 && (
          <div className="px-3 py-8 text-center">
            <Typography variant="body2" color="textSecondary">
              {isSearchingPeople ? t('command.searching') : t('command.empty')}
            </Typography>
          </div>
        )}
        {groups.map(({ group, commands }) => (
          <div key={group} className="pb-1">
            <Typography
              id={`${baseId}-group-${group}`}
              variant="caption"
              color="textSecondary"
              component="div"
              className="px-3 pt-2 pb-1"
            >
              {t(`command.groups.${group}`)}
            </Typography>
            <div role="group" aria-labelledby={`${baseId}-group-${group}`}>
              {commands.map((command) => {
                const isActive = command === active;
                return (
                  // Keyboard lives in the combobox input (aria-activedescendant), so options are
                  // never focused themselves; a pointer picks one directly.
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
                  <div
                    key={command.id}
                    id={optionId(command)}
                    role="option"
                    aria-selected={isActive}
                    onMouseMove={() => {
                      if (!isActive) {
                        setActiveIndex(ordered.indexOf(command));
                      }
                    }}
                    onClick={() => {
                      run(command);
                    }}
                    className={cn(
                      'flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 py-1.5 text-text-secondary',
                      isActive && 'bg-primary/10 text-primary',
                    )}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center">
                      {command.leading}
                    </span>
                    <Typography
                      variant="body2"
                      color="textPrimary"
                      className="min-w-0 flex-1 truncate"
                    >
                      {command.label}
                    </Typography>
                    {command.hint && (
                      <Typography variant="caption" color="textSecondary" className="shrink-0">
                        {command.hint}
                      </Typography>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="hidden items-center gap-4 border-t border-divider px-4 py-2 sm:flex">
        {(['navigate', 'open', 'close'] as const).map((key) => (
          <Typography key={key} variant="caption" color="textSecondary">
            {t(`command.keys.${key}`)}
          </Typography>
        ))}
      </div>
    </Dialog>
  );
}
