import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CommandPalette } from './CommandPalette';

/** A search-box look: hairline, the page's background, muted text. */
const SearchBox = styled(ButtonBase)(({ theme }) => {
  const { palette } = theme.vars ?? theme;
  return {
    height: 40,
    gap: theme.spacing(1.5),
    padding: theme.spacing(0, 1, 0, 1.5),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${palette.divider}`,
    backgroundColor: palette.background.default,
    color: palette.text.secondary,
    transition: theme.transitions.create('border-color', {
      duration: theme.transitions.duration.shortest,
    }),
    '&:hover': { borderColor: palette.text.disabled },
  };
});

const isApple = (): boolean => /Mac|iPhone|iPad/.test(navigator.userAgent);

/**
 * Opens the command menu: a search box in the top bar (an icon on phones) and ⌘K / Ctrl+K
 * anywhere. Each opening mounts a fresh menu (empty query).
 */
export function CommandPaletteButton() {
  const { t } = useTranslation('shell');
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(0);
  const shortcut = isApple() ? '⌘K' : 'Ctrl K';

  const show = (): void => {
    setOpening((count) => count + 1);
    setOpen(true);
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpening((count) => count + 1);
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <>
      <SearchBox
        onClick={show}
        aria-label={t('command.open', { shortcut })}
        aria-haspopup="dialog"
        className="hidden w-72 sm:inline-flex"
      >
        <SearchOutlined aria-hidden fontSize="small" />
        <Typography variant="body2" component="span" className="flex-1 text-left">
          {t('command.trigger')}
        </Typography>
        <Typography
          variant="caption"
          component="kbd"
          className="rounded-sm border border-divider bg-background-paper px-1.5"
        >
          {shortcut}
        </Typography>
      </SearchBox>
      <IconButton
        onClick={show}
        aria-label={t('command.open', { shortcut })}
        aria-haspopup="dialog"
        className="sm:hidden"
      >
        <SearchOutlined aria-hidden />
      </IconButton>
      <CommandPalette
        key={opening}
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      />
    </>
  );
}
