import './_node-shim.js';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const config = JSON.parse(readFileSync('mushy.config.json', 'utf8'));
const URL = config.supabase.url;
const ANON = config.supabase.anonKey;
const TOKEN = process.env.VITE_DEV_TOKEN;
const SLUG = config.slug;
const SCHEMA = `app_${SLUG.replace(/-/g, '_')}_dev`;

const sb = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: `Bearer ${TOKEN}` } },
  db: { schema: SCHEMA }
});

async function run() {
  console.log("Checking schema:", SCHEMA);
  const { data, error } = await sb.from('user_profiles').select('*').limit(1);
  if (error) {
    console.error("❌ Connection or query error:", error);
  } else {
    console.log("✅ Success! Profiles:", data);
  }
}
run();
