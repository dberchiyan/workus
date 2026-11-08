import { ResponsibleStack } from '@/shared/components/ResponsibleStack';
import type { TimeOffPerson } from '../types';

/** The request's responsible people as overlapping avatars; all names on hover. */
export function ResponsibleSummary({ people }: { people: TimeOffPerson[] }) {
  return <ResponsibleStack people={people} />;
}
