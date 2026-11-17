import type { ReactElement } from 'react';

import { ResponsibleStack } from '@/shared/components/responsible-stack';

import type { TimeOffPerson } from '../types';

/** The request's responsible people as overlapping avatars; all names on hover. */
export function ResponsibleSummary({ people }: { people: TimeOffPerson[] }): ReactElement {
    return <ResponsibleStack people={people} />;
}
