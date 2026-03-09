import { createClient } from '@supabase/supabase-js';
import { debugLog } from './debugLog.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// #region agent log
debugLog('supabase.js:env', 'env_check', { hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_ANON_KEY }, 'H1');
// #endregion

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase URL or anon key missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');

// #region agent log
debugLog('supabase.js:init', 'supabase_client_created', {}, 'H2');
// #endregion

