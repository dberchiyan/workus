/**
 * The public landing page. Same origin as the app: nginx serves it at a signed-out `/` (in local
 * Vite there is none, and `/` opens sign-in). Always a full page load, never a router link.
 */
export const LANDING_PATH = '/';
