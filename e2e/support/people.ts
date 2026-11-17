import { randomInt } from 'node:crypto';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const TAG_LENGTH = 6;

export interface Person {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
}

/** A short letters-only tag, so names stay human and every run creates people nobody else has. */
const tag = (): string => Array.from({ length: TAG_LENGTH }, () => LETTERS[randomInt(LETTERS.length)]).join('');

/** A new person with a unique name and email on the given domain. */
export const newPerson = (domain: string): Person => {
    const suffix = tag();
    const firstName = 'Robin';
    const lastName = `Tester ${suffix[0]?.toUpperCase() ?? ''}${suffix.slice(1)}`;
    return { firstName, lastName, fullName: `${firstName} ${lastName}`, email: `robin.${suffix}@${domain}` };
};

/** A new company name, unique per run. */
export const newCompanyName = (): string => `Northwind ${tag()}`;

/** A password that meets the product's password rules. */
export const STRONG_PASSWORD = 'Correct-Horse-42!';
