/**
 * Names for React <ViewTransition> shared elements: the same name in the old and the new page
 * morphs one element into the other (the avatar flies from the employees table into the profile).
 * Unique per person; letters, digits and dashes only.
 */
export const personAvatarTransition = (employeeId: string): string =>
  `person-avatar-${employeeId.replace(/[^a-zA-Z0-9-]/g, '')}`;
