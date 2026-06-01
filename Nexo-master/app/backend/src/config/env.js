import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const originalEnvKeys = new Set(Object.keys(process.env));

function loadEnvFile(filePath, { overrideFileValues = false } = {}) {
  if (!fs.existsSync(filePath)) return null;

  const parsed = dotenv.parse(fs.readFileSync(filePath));
  for (const [key, value] of Object.entries(parsed)) {
    if (originalEnvKeys.has(key)) continue;
    if (process.env[key] === undefined || overrideFileValues) {
      process.env[key] = value;
    }
  }

  return { filePath, keys: Object.keys(parsed) };
}

export function loadBackendEnv() {
  const appEnvPath = path.resolve(__dirname, '../../../.env');
  const backendEnvPath = path.resolve(__dirname, '../../.env');

  return [
    loadEnvFile(appEnvPath),
    loadEnvFile(backendEnvPath, { overrideFileValues: true }),
  ].filter(Boolean);
}

loadBackendEnv();
