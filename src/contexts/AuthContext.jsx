import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// ─── localStorage helpers (offline fallback) ──────────────────────────────
const LS_USERS = 'nutrilearn_users'
const LS_SESSION = 'nutrilearn_user'

function lsGetUsers() { return JSON.parse(localStorage.getItem(LS_USERS) || '[]') }
function lsSaveUsers(u) { localStorage.setItem(LS_USERS, JSON.stringify(u)) }
function lsGetSession() { const s = localStorage.getItem(LS_SESSION); return s ? JSON.parse(s) : null }
function lsSaveSession(u) { localStorage.setItem(LS_SESSION, JSON.stringify(u)) }
function lsClearSession() { localStorage.removeItem(LS_SESSION) }

// Detect network-level failures vs auth errors
function isNetworkError(err) {
    return err?.message?.toLowerCase().includes('failed to fetch') ||
        err?.message?.toLowerCase().includes('networkerror') ||
        err?.message?.toLowerCase().includes('network request failed') ||
        err?.name === 'TypeError'
}

// Build app user object from Supabase session + profile row
async function buildUser(supabaseUser) {
    try {
        const { data } = await supabase
            .from('profiles')
            .select('username, email')
            .eq('id', supabaseUser.id)
            .single()
        if (data) return { id: supabaseUser.id, username: data.username, email: data.email || supabaseUser.email }
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
        // Try Supabase session first, fall back to localStorage
        supabase.auth.getSession()
            .then(async ({ data: { session } }) => {
                if (session?.user) {
                    const profile = await buildUser(session.user)
                    setUser(profile)
                } else {
                    const local = lsGetSession()
                    if (local) setUser(local)
                }
                setLoading(false)
            })
            .catch(() => {
                // Supabase unreachable — use localStorage session
                const local = lsGetSession()
                if (local) setUser(local)
                setLoading(false)
            })

        // Listen for Supabase auth events (when online)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const profile = await buildUser(session.user)
                setUser(profile)
            }
        })
        return () => subscription.unsubscribe()
    }, [])

    // ── Sign Up ──────────────────────────────────────────────────────────────
    const signUp = async (username, email, password) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email, password,
                options: { data: { username } },
            })
            if (error) throw error

            const uid = data.user?.id
            if (uid) {
                // Insert profile row (non-blocking)
                supabase.from('profiles').insert({ id: uid, username, email }).catch(e =>
                    console.warn('[Auth] profile insert:', e.message)
                )
                // Init game state
                const gs = { userId: uid, currentDay: 1, xp: 0, streak: 0, lastCompletedDay: null, completedDays: {}, notificationTime: '08:00', notificationsEnabled: true }
                localStorage.setItem(`nutrilearn_game_${uid}`, JSON.stringify(gs))
            }
            const sessionUser = { id: uid, username, email }
            lsSaveSession(sessionUser)
            setUser(sessionUser)
            return sessionUser
        } catch (err) {
            if (isNetworkError(err)) {
                // Offline fallback: register in localStorage
                const users = lsGetUsers()
                if (users.find(u => u.email === email)) throw new Error('An account with this email already exists.')
                const newUser = { id: crypto.randomUUID(), username, email, password, createdAt: new Date().toISOString(), localOnly: true }
                users.push(newUser)
                lsSaveUsers(users)
                const gs = { userId: newUser.id, currentDay: 1, xp: 0, streak: 0, lastCompletedDay: null, completedDays: {}, notificationTime: '08:00', notificationsEnabled: true }
                localStorage.setItem(`nutrilearn_game_${newUser.id}`, JSON.stringify(gs))
                const sessionUser = { id: newUser.id, username, email }
                lsSaveSession(sessionUser)
                setUser(sessionUser)
                return sessionUser
            }
            throw err
        }
    }

    // ── Sign In ──────────────────────────────────────────────────────────────
    const signIn = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
            return data.user
        } catch (err) {
            if (isNetworkError(err)) {
                // Offline fallback: check localStorage
                const users = lsGetUsers()
                const found = users.find(u => u.email === email && u.password === password)
                if (!found) throw new Error('Invalid email or password.')
                const sessionUser = { id: found.id, username: found.username, email: found.email }
                lsSaveSession(sessionUser)
                setUser(sessionUser)
                return found
            }
            throw err
        }
    }

    // ── Sign Out ─────────────────────────────────────────────────────────────
    const signOut = async () => {
        try { await supabase.auth.signOut() } catch (_) { /* offline ok */ }
        lsClearSession()
        setUser(null)
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
