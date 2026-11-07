/// <reference types="vite/client" />

/** Raw values — read them through `@/shared/config/env`, which checks them. */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string | undefined;
  readonly VITE_DEFAULT_LOCALE: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
