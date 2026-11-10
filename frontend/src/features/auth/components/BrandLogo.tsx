import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@/shared/components/BrandMark';
import { cn } from '@/shared/lib/cn';
import { LANDING_PATH } from '../landing';

export interface BrandLogoProps {
  /** The mark and name lead to the landing page (signed-out screens). */
  linkHome?: boolean;
}

/** Workus mark + wordmark + tagline. */
export function BrandLogo({ linkHome = false }: BrandLogoProps) {
  const { t } = useTranslation();
  const name = (
    <>
      <BrandMark
        className={cn(
          linkHome &&
            'transition-[transform,filter] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:drop-shadow-[0_8px_14px_color-mix(in_oklch,var(--mui-palette-primary-main)_35%,transparent)] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0',
        )}
      />
      <Typography
        variant="h2"
        component="span"
        className={cn(
          'text-secondary dark:text-text-primary',
          linkHome &&
            'transition-colors duration-300 group-hover:text-primary dark:group-hover:text-primary',
        )}
      >
        {t('app.name')}
      </Typography>
    </>
  );
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {linkHome ? (
        // A full page load: the server answers a signed-out `/` with the landing page.
        <a
          href={LANDING_PATH}
          aria-label={t('app.home')}
          className="group rounded-2xl -m-2 flex items-center gap-3 p-2 no-underline"
        >
          {name}
        </a>
      ) : (
        <p className="m-0 flex items-center gap-3">{name}</p>
      )}
      <Typography variant="subtitle1" component="p" color="textSecondary">
        {t('app.tagline')}
      </Typography>
    </div>
  );
}
