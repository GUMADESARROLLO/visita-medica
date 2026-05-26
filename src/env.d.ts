/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user?: import('./lib/auth/index').JWTPayload;
  }
}

declare global {
  interface Window {
    showToast: (message: string, type?: string) => void;
  }
}

interface ImportMetaEnv {
  readonly DB_HOST: string;
  readonly DB_PORT: string;
  readonly DB_USER: string;
  readonly DB_PASSWORD: string;
  readonly DB_NAME: string;
  readonly JWT_SECRET: string;
  readonly JWT_EXPIRES_IN: string;
  readonly UPLOAD_DIR: string;
  readonly MAX_FILE_SIZE: string;
  readonly APP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
