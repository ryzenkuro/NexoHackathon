import '../config/env.js';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
export const isSupabaseConfigured = Boolean(url && serviceKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] SUPABASE_URL atau SUPABASE_SERVICE_KEY belum di-set. ' +
    'Endpoint database membutuhkan Supabase agar data riset bisa dibaca.'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
