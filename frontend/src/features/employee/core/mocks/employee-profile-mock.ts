export interface EmployeeProfileMock {
    level: string;
    laptopId: string;
    additionalInfo: string | null;
    fileCount: number;
}

const LEVELS = ['Junior Employee', 'Middle Employee', 'Senior Employee', 'Lead'] as const;
const NOTES = [null, 'Prefers remote work on Fridays.', null, 'Speaks at internal tech talks.'] as const;

/** Stable 32-bit hash of the id → a pseudo-random sequence. */
const seeded = (id: string): (() => number) => {
    let state = 0;
    for (const char of id) {
        state = (state * 31 + char.charCodeAt(0)) >>> 0;
    }
    return () => {
        state = (state * 1_103_515_245 + 12_345) >>> 0;
        return state / 0x1_0000_0000;
    };
};

const pick = <T>(items: readonly T[], next: () => number): T => items[Math.floor(next() * items.length)] as T;

export const mockEmployeeProfile = (employeeId: string): EmployeeProfileMock => {
    const next = seeded(employeeId);
    return {
        level: pick(LEVELS, next),
        laptopId: String(1000 + Math.floor(next() * 9000)),
        additionalInfo: pick(NOTES, next),
        fileCount: 0,
    };
};
