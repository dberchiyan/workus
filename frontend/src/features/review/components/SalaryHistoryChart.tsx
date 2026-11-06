import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { compareMoney, formatMoney, ratioBetween } from '@/shared/lib/money';
import { formatReviewDate } from '../format';
import type { SalaryPoint } from '../types';

/** Drawing space; the SVG scales uniformly to its container. */
const WIDTH = 320;
const HEIGHT = 96;
const PAD = 8;
const DAY_MS = 86_400_000;

export interface SalaryHistoryChartProps {
  history: readonly SalaryPoint[];
}

/**
 * Step line (salary changes on review dates and holds until the next), one series, so no legend;
 * 2 px line, 8 px markers with a surface ring, recessive baseline. Values are on hover/focus of
 * each marker and in the screen-reader table below.
 */
export function SalaryHistoryChart({ history }: SalaryHistoryChartProps) {
  const { t, i18n } = useTranslation('review');
  const locale = i18n.language;
  // "Now" for the right edge, fixed once per mount (render stays pure).
  const [nowMs] = useState(() => Date.now());
  const first = history[0];
  const last = history.at(-1);
  if (!first || !last || history.length < 2) {
    return null;
  }
  const min = history.reduce(
    (low, point) => (compareMoney(point.salary, low.salary) < 0 ? point : low),
    first,
  ).salary;
  const max = history.reduce(
    (high, point) => (compareMoney(point.salary, high.salary) > 0 ? point : high),
    first,
  ).salary;
  const startMs = Date.parse(`${first.date}T00:00:00Z`);
  const endMs = Math.max(nowMs, Date.parse(`${last.date}T00:00:00Z`) + DAY_MS);
  const x = (date: string) =>
    PAD + ((Date.parse(`${date}T00:00:00Z`) - startMs) / (endMs - startMs)) * (WIDTH - 2 * PAD);
  const y = (point: SalaryPoint) =>
    HEIGHT - PAD - ratioBetween(point.salary, min, max) * (HEIGHT - 2 * PAD);

  const points = history.map((point) => ({ point, cx: x(point.date), cy: y(point) }));
  const path = points
    .map(({ cx, cy }, index) => (index === 0 ? `M ${cx} ${cy}` : `H ${cx} V ${cy}`))
    .join(' ')
    .concat(` H ${WIDTH - PAD}`);

  return (
    <figure className="m-0 flex w-full min-w-0 flex-col gap-1">
      <figcaption>
        <Typography variant="caption" color="textSecondary">
          {t('salary.chartTitle')}
        </Typography>
      </figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={t('salary.chartSummary', {
          count: history.length,
          first: formatMoney(first.salary, locale),
          last: formatMoney(last.salary, locale),
        })}
      >
        <line
          x1={PAD}
          x2={WIDTH - PAD}
          y1={HEIGHT - 1}
          y2={HEIGHT - 1}
          className="stroke-divider"
          strokeWidth={1}
        />
        <path
          d={path}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {points.map(({ point, cx, cy }) => (
          <Tooltip
            key={point.date}
            title={`${formatReviewDate(point.date, locale)} · ${formatMoney(point.salary, locale)}`}
            placement="top"
          >
            <g className="cursor-default">
              {/* Hit target larger than the mark. */}
              <circle cx={cx} cy={cy} r={12} fill="transparent" />
              <circle
                cx={cx}
                cy={cy}
                r={4}
                className="fill-primary stroke-background-paper"
                strokeWidth={2}
              />
            </g>
          </Tooltip>
        ))}
      </svg>
      <div className="flex justify-between" aria-hidden>
        <Typography variant="caption" color="textSecondary" className="app-tabular">
          {formatReviewDate(first.date, locale, 'monthYear')}
        </Typography>
        <Typography variant="caption" color="textSecondary" className="app-tabular">
          {formatReviewDate(last.date, locale, 'monthYear')}
        </Typography>
      </div>
      <table className="sr-only">
        <caption>{t('salary.tableCaption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('salary.date')}</th>
            <th scope="col">{t('salary.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {history.map((point) => (
            <tr key={point.date}>
              <td>{formatReviewDate(point.date, locale)}</td>
              <td>{formatMoney(point.salary, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
