import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, startKeepAlive, stopKeepAlive } from '../lib/supabase'

const AuthContext = createContext(null)

// Build app user object from Supabase session + profile row
async function buildUser(supabaseUser) {
    try {
        const { data } = await supabase
            .from('profiles')
            .select('username, email, group')
            .eq('id', supabaseUser.id)
            .single()
        if (data) return { id: supabaseUser.id, username: data.username, email: data.email || supabaseUser.email, group: data.group }
    } catch (_) { /* offline */ }
    return {
        id: supabaseUser.id,
        username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0],
        email: supabaseUser.email,
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession()
            .then(async ({ data: { session }, error }) => {
                if (error || !session) {
                    // Session is invalid / expired / signed with old key
                    // Force a clean slate so the user isn't stuck loading
                    if (error) {
                        console.warn('[Auth] stale session detected, clearing:', error.message)
                        await supabase.auth.signOut().catch(() => {})
                        localStorage.removeItem('supabase.auth.token')
                    }
                    setUser(null)
                    setLoading(false)
                    return
                }
                // Valid session — try to refresh it proactively
                const { data: refreshed, error: refreshErr } =
                    await supabase.auth.refreshSession()
                if (refreshErr) {
                    console.warn('[Auth] session refresh failed, signing out:', refreshErr.message)
                    await supabase.auth.signOut().catch(() => {})
                    localStorage.removeItem('supabase.auth.token')
                    setUser(null)
                    setLoading(false)
                    return
                }
                const activeUser = refreshed?.session?.user ?? session.user
                const profile = await buildUser(activeUser)
                setUser(profile)
                startKeepAlive()
                setLoading(false)
            })
            .catch(() => {
                setUser(null)
                setLoading(false)
            })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
                setUser(null)
                return
            }
            if (session?.user) {
                const profile = await buildUser(session.user)
                setUser(profile)
            }
        })
        return () => subscription.unsubscribe()
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
            // Await the insert so we can surface errors properly
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({ id: uid, username, email, group: group })
            if (profileError) {
                console.error('[Auth] profile insert FAILED:', profileError.message, profileError.details)
            }
            const gs = { userId: uid, currentDay: 1, xp: 0, streak: 0, lastCompletedDay: null, completedDays: {}, notificationTime: '08:00', notificationsEnabled: true }
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
        await supabase.auth.signOut()
        setUser(null)
        // Clear local session
        localStorage.removeItem('supabase.auth.token')
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

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}
