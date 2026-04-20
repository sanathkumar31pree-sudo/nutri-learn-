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

// ── Keep-alive ping ────────────────────────────────────────────────────────
// The free-tier GoTrue container idles after ~5 min of inactivity,
// causing 1-2s cold-start delays on the next auth request.
// This lightweight ping keeps it warm while the app is open.
const KEEP_ALIVE_INTERVAL = 4 * 60 * 1000 // 4 minutes
let keepAliveTimer = null

export function startKeepAlive() {
    if (keepAliveTimer) return
    keepAliveTimer = setInterval(() => {
        fetch(`${supabaseUrl}/auth/v1/health`, {
            headers: { apikey: supabaseKey },
        }).catch(() => {}) // swallow errors — this is best-effort
    }, KEEP_ALIVE_INTERVAL)
}

export function stopKeepAlive() {
    if (keepAliveTimer) {
        clearInterval(keepAliveTimer)
        keepAliveTimer = null
    }
}
