import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase, startKeepAlive, stopKeepAlive } from '../lib/supabase'

const AuthContext = createContext(null)

// Build app user object from Supabase session + profile row.
// Wrapped with a 4-second timeout so a slow network never hangs init.
async function buildUser(supabaseUser) {
    try {
        const profilePromise = supabase
            .from('profiles')
            .select('username, email, group')
            .eq('id', supabaseUser.id)
            .single()
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('profile timeout')), 4000)
        )
        const { data } = await Promise.race([profilePromise, timeoutPromise])
        if (data) return {
            id: supabaseUser.id,
            username: data.username,
            email: data.email || supabaseUser.email,
            group: data.group,
        }
    } catch (_) { /* offline or timeout — fall through */ }
    return {
        id: supabaseUser.id,
        username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0],
        email: supabaseUser.email,
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    // Track whether init has finished so the auth listener doesn't conflict
    const initDone = useRef(false)

    useEffect(() => {
        let cancelled = false // prevents state updates after unmount

        async function initAuth() {
            // ── Watchdog: never stay on the spinner more than 8 s ────────────
            const watchdog = setTimeout(() => {
                if (!cancelled && !initDone.current) {
                    console.warn('[Auth] init timed out — forcing unauthenticated state')
                    initDone.current = true
                    setUser(null)
                    setLoading(false)
                }
            }, 8000)

            try {
                const { data: { session }, error } = await supabase.auth.getSession()

                if (cancelled) return
                clearTimeout(watchdog)

                if (error || !session) {
                    if (error) {
                        console.warn('[Auth] stale/bad session:', error.message)
                        supabase.auth.signOut().catch(() => {})
                        clearSupabaseStorage()
                    }
                    initDone.current = true
                    setUser(null)
                    setLoading(false)
                    return
                }

                // Try to refresh, but fall back to existing session on timeout/failure
                let activeUser = session.user
                try {
                    const refreshResult = await Promise.race([
                        supabase.auth.refreshSession(),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('refresh timeout')), 5000)
                        ),
                    ])
                    if (refreshResult?.data?.session?.user) {
                        activeUser = refreshResult.data.session.user
                    }
                } catch {
                    console.warn('[Auth] refresh timed out — using cached session')
                }

                if (cancelled) return

                const profile = await buildUser(activeUser)
                if (cancelled) return

                initDone.current = true
                setUser(profile)
                startKeepAlive()
                setLoading(false)
            } catch (err) {
                if (cancelled) return
                clearTimeout(watchdog)
                console.warn('[Auth] init error:', err?.message)
                initDone.current = true
                setUser(null)
                setLoading(false)
            }
        }

        initAuth()

        // ── Auth state listener (only acts after init is complete) ───────────
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Skip events that happen during the initial session check to avoid conflicts
            if (!initDone.current) return

            if (event === 'SIGNED_OUT') {
                setUser(null)
                return
            }
            if (event === 'TOKEN_REFRESHED' && !session) {
                setUser(null)
                return
            }
            if (session?.user) {
                const profile = await buildUser(session.user)
                setUser(profile)
            }
        })

        return () => {
            cancelled = true
            subscription.unsubscribe()
        }
    }, [])

    // ── Sign Up ──────────────────────────────────────────────────────────────
    const signUp = async (username, email, password, group = 'volunteer') => {
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { username, group } },
        })
        if (error) throw error

        const uid = data.user?.id
        if (uid) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({ id: uid, username, email, group })
            if (profileError) {
                console.error('[Auth] profile insert FAILED:', profileError.message)
            }
            const gs = {
                userId: uid, currentDay: 1, xp: 0, streak: 0,
                lastCompletedDay: null, completedDays: {},
                notificationTime: '08:00', notificationsEnabled: true,
            }
            localStorage.setItem(`nutrilearn_game_${uid}`, JSON.stringify(gs))
        }
        const sessionUser = { id: uid, username, email }
        setUser(sessionUser)
        return sessionUser
    }

    // ── Sign In ──────────────────────────────────────────────────────────────
    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data.user
    }

    // ── Sign Out ─────────────────────────────────────────────────────────────
    const signOut = async () => {
        stopKeepAlive()
        // Update UI immediately — don't wait for the network
        setUser(null)
        // Best-effort network sign-out (3 s max)
        await Promise.race([
            supabase.auth.signOut().catch(() => {}),
            new Promise(res => setTimeout(res, 3000)),
        ])
        clearSupabaseStorage()
    }

    // ── Reset Password ───────────────────────────────────────────────────────
    const resetPassword = async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
    }

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, resetPassword }}>
            {children}
        </AuthContext.Provider>
    )
}

// Helper: wipe all Supabase-owned localStorage keys
function clearSupabaseStorage() {
    Object.keys(localStorage)
        .filter(k => k.startsWith('sb-') || k.startsWith('supabase'))
        .forEach(k => localStorage.removeItem(k))
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}
