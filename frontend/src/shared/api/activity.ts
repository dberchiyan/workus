/**
 * When the API last answered — the server counts a session's idle time from its last request,
 * so the client can tell how long the session has left (the idle-timeout warning).
 */
let lastActivity = Date.now();

export const markApiActivity = (): void => {
  lastActivity = Date.now();
};

export const lastApiActivity = (): number => lastActivity;
