import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const connectionString = process.env.VITE_SUPABASE_URL 
  ? process.env.VITE_SUPABASE_URL.replace('https://', 'postgres://postgres:').replace('.supabase.co', '.supabase.co:5432/postgres') // This is a guess, usually we have a DATABASE_URL
  : '';

// Let's just find DATABASE_URL in .env
console.log("DB URL:", process.env.DATABASE_URL || "Not found");
