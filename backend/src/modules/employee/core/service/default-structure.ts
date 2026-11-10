/**
 * The structure a new company starts with (registration, and the dev seed): departments in this
 * order, each with its positions. The company then shapes it in Settings → Company structure.
 */
export const DEFAULT_STRUCTURE: readonly { name: string; positions: readonly string[] }[] = [
  {
    name: 'Developers',
    positions: [
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'Mobile Developer',
    ],
  },
  {
    name: 'AI Engineers',
    positions: ['Machine Learning Engineer', 'AI Engineer', 'Data Scientist'],
  },
  { name: 'Designers', positions: ['Product Designer', 'UI/UX Designer'] },
  { name: 'Project Managers', positions: ['Project Manager', 'Delivery Manager'] },
  { name: 'QA', positions: ['QA Engineer', 'QA Automation Engineer'] },
];
