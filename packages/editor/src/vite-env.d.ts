/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 构建时注入的全局常量
declare const __BUILD_TIME__: string;
declare const __BUILD_DATE__: string;
declare const __VERSION__: string;
