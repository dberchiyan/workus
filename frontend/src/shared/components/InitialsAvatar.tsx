import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { cn } from '@/shared/lib/cn';

/** Muted theme tones (theme/tokens.ts → avatar); literal class names so Tailwind sees them. */
const AVATAR_TONES = [
  'bg-avatar-c1',
  'bg-avatar-c2',
  'bg-avatar-c3',
  'bg-avatar-c4',
  'bg-avatar-c5',
  'bg-avatar-c6',
  'bg-avatar-c7',
  'bg-avatar-c8',
] as const;

const SIZE_CLASS = { sm: 'size-7', md: 'size-8', lg: 'size-16' } as const;

/** Same person → same tone, on every screen and every load. */
const toneFor = (id: string): string => {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length] ?? AVATAR_TONES[0];
};

export interface InitialsAvatarProps {
  /** Stable person id — picks the colour. */
  id: string;
  firstName: string;
  lastName: string;
  /** `sm` responsibles in tables, `md` a person's own row, `lg` a profile header. */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Initials on a per-person tone; decorative — the name is always shown or labelled nearby. */
export function InitialsAvatar({
  id,
  firstName,
  lastName,
  size = 'md',
  className,
}: InitialsAvatarProps) {
  return (
    <Avatar
      aria-hidden
      className={cn(toneFor(id), 'text-avatar-text', SIZE_CLASS[size], className)}
    >
      <Typography
        variant={size === 'lg' ? 'h5' : 'caption'}
        component="span"
        className="app-tabular"
      >
        {`${firstName.charAt(0)}${lastName.charAt(0)}`}
      </Typography>
    </Avatar>
  );
}
