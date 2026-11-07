/** "Chrome on macOS" from a user-agent string — enough to recognise one's own devices. */
export interface DeviceSummary {
  browser: string | null;
  os: string | null;
  mobile: boolean;
}

const BROWSERS: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Windows/, 'Windows'],
  [/CrOS/, 'ChromeOS'],
  [/Linux/, 'Linux'],
];

export const describeUserAgent = (userAgent: string | null): DeviceSummary => {
  const text = userAgent ?? '';
  return {
    browser: BROWSERS.find(([pattern]) => pattern.test(text))?.[1] ?? null,
    os: SYSTEMS.find(([pattern]) => pattern.test(text))?.[1] ?? null,
    mobile: /Mobi|iPhone|Android/.test(text),
  };
};
