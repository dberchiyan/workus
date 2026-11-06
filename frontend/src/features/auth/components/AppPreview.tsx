import { domAnimation, LazyMotion, m, useReducedMotion } from 'motion/react';

const ROWS = ['row-1', 'row-2', 'row-3', 'row-4'] as const;
const MENU = ['menu-1', 'menu-2', 'menu-3', 'menu-4'] as const;

/** Decorative product preview beside the sign-in card (desktop only). */
export function AppPreview() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        aria-hidden
        initial={shouldReduceMotion ? false : { opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="hidden w-full max-w-2xl rounded-lg border border-divider bg-background-paper p-3 shadow-sm lg:flex"
      >
        <div className="flex flex-1 overflow-hidden rounded-md">
          <div className="flex w-1/5 flex-col gap-3 bg-secondary p-4">
            <div className="h-2 w-2/3 rounded-sm bg-primary-light" />
            {MENU.map((id) => (
              <div key={id} className="mt-2 h-2 w-full rounded-sm bg-secondary-light" />
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-4 bg-background p-5">
            <div className="flex items-center justify-between">
              <div className="h-3 w-1/3 rounded-sm bg-divider" />
              <div className="size-6 rounded-full bg-primary-light" />
            </div>
            <div className="flex flex-1 flex-col gap-3 rounded-md bg-background-paper p-4">
              {ROWS.map((id) => (
                <div key={id} className="flex items-center gap-4">
                  <div className="h-2 w-1/4 rounded-sm bg-text-secondary opacity-40" />
                  <div className="h-2 w-1/4 rounded-sm bg-divider" />
                  <div className="h-2 flex-1 rounded-sm bg-divider" />
                  <div className="size-5 rounded-full bg-primary-light" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </m.div>
    </LazyMotion>
  );
}
