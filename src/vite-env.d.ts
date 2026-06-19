/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base de l'API en production (ex. https://mon-back.onrender.com/api). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
