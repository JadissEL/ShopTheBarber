/**
 * Load server/.env from the server directory so STRIPE_API_KEY and other
 * vars are available regardless of process cwd (e.g. when running from repo root).
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
