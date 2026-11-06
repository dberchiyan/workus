/** History label, e.g. "Vacation, 2026-06-26 – 2026-06-30" (the history keeps it as written). */
export const timeOffLabel = (request: { type: string; startDate: Date; endDate: Date }): string => {
  const name = TYPE_NAMES[request.type] ?? request.type;
  const start = request.startDate.toISOString().slice(0, 10);
  const end = request.endDate.toISOString().slice(0, 10);
  return start === end ? `${name}, ${start}` : `${name}, ${start} – ${end}`;
};

const TYPE_NAMES: Readonly<Record<string, string>> = {
  VACATION: 'Vacation',
  SICK_DAY: 'Sick day',
  DAY_OFF: 'Day off',
};
