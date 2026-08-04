// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    PORT: string;
    DB_STRING: string;
    JWT_SECRET: string;
    /** Product read cache lifetime in seconds. Set to 0 to disable caching. */
    CACHE_TTL_SECONDS?: string;
    /** Maximum number of product cache entries retained per process. */
    CACHE_MAX_ENTRIES?: string;
    /** Winston minimum log level (default: info). */
    LOG_LEVEL?: string;
  }
}
