import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { SITE } from '@/content/site';

/**
 * The 1200 × 630 share image, drawn as SVG and rendered to PNG at build time (social networks
 * do not accept SVG). Text uses the build machine's sans-serif.
 */
const WIDTH = 1200;
const HEIGHT = 630;
const FONT = "'Inter', 'Helvetica Neue', Arial, sans-serif";

const statusRow = (
  y: number,
  name: string,
  detail: string,
  status: string,
  fill: string,
  text: string,
) => `
  <g transform="translate(760 ${y})">
    <rect width="360" height="64" rx="14" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.1"/>
    <circle cx="36" cy="32" r="16" fill="${fill}" fill-opacity="0.9"/>
    <text x="64" y="28" font-family="${FONT}" font-size="17" font-weight="600" fill="#eef4f7">${name}</text>
    <text x="64" y="48" font-family="${FONT}" font-size="14" fill="#9fb3c2">${detail}</text>
    <rect x="${360 - 16 - status.length * 9 - 26}" y="20" width="${status.length * 9 + 26}" height="24" rx="12" fill="${fill}" fill-opacity="0.22"/>
    <text x="${360 - 16 - (status.length * 9 + 26) / 2}" y="37" text-anchor="middle" font-family="${FONT}" font-size="13" font-weight="600" fill="${text}">${status}</text>
  </g>`;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#14262f"/>
      <stop offset="1" stop-color="#0c1820"/>
    </linearGradient>
    <radialGradient id="glow-a" cx="0.15" cy="0" r="0.7">
      <stop offset="0" stop-color="#5fb6cc" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#5fb6cc" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow-b" cx="0.95" cy="0.1" r="0.6">
      <stop offset="0" stop-color="#6f6fe0" stop-opacity="0.3"/>
      <stop offset="1" stop-color="#6f6fe0" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2A4A60"/>
      <stop offset="1" stop-color="#1F3A4D"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow-a)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow-b)"/>

  <g transform="translate(80 80)">
    <rect width="64" height="64" rx="16" fill="url(#mark)" stroke="#ffffff" stroke-opacity="0.12"/>
    <path transform="scale(1.3333)" d="M9 14h6l3.9 14.6L23 14h2l4.1 14.6L33 14h6l-7.4 21h-5L24 25.8 21.4 35h-5z" fill="#7CC4D6"/>
    <text x="84" y="44" font-family="${FONT}" font-size="34" font-weight="700" fill="#ffffff">${SITE.name}</text>
  </g>

  <text font-family="${FONT}" font-size="56" font-weight="700" letter-spacing="-1.5" fill="#ffffff">
    <tspan x="80" y="250">People, time off</tspan>
    <tspan x="80" y="316">and reviews.</tspan>
    <tspan x="80" y="382" fill="#8fd0e0">In one app.</tspan>
  </text>
  <text font-family="${FONT}" font-size="24" fill="#a9bccb">
    <tspan x="80" y="452">Employee records, salary reviews, time off,</tspan>
    <tspan x="80" y="486">a shared calendar and yearly reports.</tspan>
  </text>

  ${statusRow(190, 'Ava Thompson', 'Vacation · 5 days', 'Pending', '#e0a53a', '#f4d9a0')}
  ${statusRow(270, 'Liam Foster', 'Sick day · Today', 'Approved', '#3fae7a', '#a8e6c6')}
  ${statusRow(350, 'Noah Bennett', 'Day off · Mar 14', 'Approved', '#3fae7a', '#a8e6c6')}

  <text x="80" y="560" font-family="${FONT}" font-size="20" font-weight="600" fill="#7CC4D6">demo-workus.osdb.io</text>
</svg>`;

export const GET: APIRoute = async () => {
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
