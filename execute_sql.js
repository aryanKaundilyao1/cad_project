import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/aryankaundilya/Downloads/jas connect/.env' });

async function run() {
  const sql = fs.readFileSync(process.argv[2], 'utf8');
  
  // Extract postgres url from .env
  let connectionString = process.env.DATABASE_URL; 
  if (!connectionString) {
    // try to construct from VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY if needed? No, usually DATABASE_URL is in .env
    console.log("Needs DATABASE_URL in .env");
  }
  
  const client = new Client({ connectionString });
  await client.connect();
  
  try {
    await client.query(sql);
    console.log('Migration applied successfully');
  } catch (e) {
    console.error('Error applying migration:', e);
  } finally {
    await client.end();
  }
}
run();
