/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_OFFLINE_MODE: string|undefined
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
