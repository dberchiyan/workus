/** Header tile (solid, white icon) and empty-state tile (light, coloured icon) per card. */
export const EVENT_TONES = {
  requests: { solid: 'bg-primary', light: 'bg-primary/10 text-primary' },
  reviews: { solid: 'bg-avatar-c7', light: 'bg-avatar-c7/15 text-avatar-c7' },
  birthdays: { solid: 'bg-avatar-c5', light: 'bg-avatar-c5/15 text-avatar-c5' },
} as const;
