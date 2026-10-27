// Load .env.local then .env for scripts (Next loads these itself for the app).
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var ${name}. Fill it in .env.local (see .env.example).`);
    process.exit(1);
  }
  return v;
}
