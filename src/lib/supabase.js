import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
}

// Custom lock bypasses the Web Locks API (Navigator LockManager).
// The default implementation times out when multiple tabs are open
// with the same session, causing "timed out waiting 10000ms" errors.
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        lock: (_name, _acquireTimeout, fn) => fn(),
    },
})


