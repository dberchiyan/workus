let lastActivity = Date.now();

export const markApiActivity = (): void => {
    lastActivity = Date.now();
};

export const lastApiActivity = (): number => lastActivity;
