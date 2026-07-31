// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    PORT: string;
    DB_STRING: string;
    JWT_SECRET: string;
  }
}
