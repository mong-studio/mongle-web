/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GODOT_EXPORT_PATH?: string;
  readonly VITE_AI_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
