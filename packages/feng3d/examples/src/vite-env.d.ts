/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly BASE_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
    glob: (pattern: string, options?: { eager?: boolean; as?: 'url' }) => Record<string, () => Promise<any>>
    globEager: (pattern: string) => Record<string, any>
}
