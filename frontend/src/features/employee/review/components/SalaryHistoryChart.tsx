import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { compareMoney, formatMoney, ratioBetween } from '@/shared/lib/money';
import { formatReviewDate } from '../format';
import type { SalaryPoint } from '../types';

/** Drawn in CSS pixels: the width follows the container; the height matches `h-28` (112 px). */
const HEIGHT = 112;
const PAD = 8;

/** Container width in CSS pixels (0 until measured). */
const useWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry?.contentRect.width ?? 0));
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
  return { ref, width };
};
const DAY_MS = 86_400_000;

/**
 * Monotone cubic curve through the points (Fritsch–Carlson): smooth, yet never overshoots —
 * between two reviews the line stays within their salaries, so it never shows a dip or a peak
 * that did not happen.
 */
const smoothPath = (points: readonly { cx: number; cy: number }[]): string => {
  const n = points.length;
  const slopes = points.slice(0, -1).map((p, i) => {
    const next = points[i + 1] ?? p;
    const dx = next.cx - p.cx;
    return dx === 0 ? 0 : (next.cy - p.cy) / dx;
  });
  const tangents = points.map((_, i) => {
    if (i === 0) {
      return slopes[0] ?? 0;
    }
    if (i === n - 1) {
      return slopes[n - 2] ?? 0;
    }
    const before = slopes[i - 1] ?? 0;
    const after = slopes[i] ?? 0;
    // Flat or turning point: horizontal tangent keeps the curve monotone.
    return before * after <= 0 ? 0 : (2 * before * after) / (before + after);
  });
  return points
    .map((p, i) => {
      if (i === 0) {
        return `M ${p.cx} ${p.cy}`;
      }
      const prev = points[i - 1] ?? p;
      const third = (p.cx - prev.cx) / 3;
      const c1y = prev.cy + (tangents[i - 1] ?? 0) * third;
      const c2y = p.cy - (tangents[i] ?? 0) * third;
      return `C ${prev.cx + third} ${c1y} ${p.cx - third} ${c2y} ${p.cx} ${p.cy}`;
    })
    .join(' ');
};

export interface SalaryHistoryChartProps {
  history: readonly SalaryPoint[];
}

/**
 * Smooth monotone line through the review dates, then flat to today; one series, so no legend;
 * 2 px line, 8 px markers with a surface ring, recessive baseline. Values are on hover/focus of
 * each marker and in the screen-reader table below.
 */
export function SalaryHistoryChart({ history }: SalaryHistoryChartProps) {
  const { t, i18n } = useTranslation('review');
  const locale = i18n.language;
  // "Now" for the right edge, fixed once per mount (render stays pure).
  const [nowMs] = useState(() => Date.now());
  const { ref, width } = useWidth();
  const WIDTH = Math.max(width, 2 * PAD + 1);
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
  // Markers sit PAD in from the edges; the tail and the baseline run edge to edge.
  const path = `${smoothPath(points)} H ${WIDTH}`;

  return (
    <figure className="m-0 flex w-full min-w-0 flex-col gap-1">
      <figcaption>
        <Typography variant="caption" color="textSecondary">
          {t('salary.chartTitle')}
        </Typography>
      </figcaption>
      {/* The box reserves the height before the first measurement, so nothing shifts. */}
      <div ref={ref} className="h-28 w-full">
        {width > 0 && (
          <svg
            width={WIDTH}
            height={HEIGHT}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="block overflow-visible"
            role="img"
            aria-label={t('salary.chartSummary', {
              count: history.length,
              first: formatMoney(first.salary, locale),
              last: formatMoney(last.salary, locale),
            })}
          >
            <line
              x1={0}
              x2={WIDTH}
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
              strokeLinecap="round"
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
        )}
      </div>
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
