import { ResponsibleStack } from '@/shared/components/responsible-stack';
import type { Review } from '../types';

/** One person: avatar and name; more: overlapping avatars, all names on hover. */
export function ReviewPeople({ people }: { people: Review['responsibles'] }) {
    return <ResponsibleStack people={people} showSoleName />;
}
