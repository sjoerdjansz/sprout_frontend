/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Sprout API, including the version prefix (e.g. http://localhost:8001/api/v1). */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
