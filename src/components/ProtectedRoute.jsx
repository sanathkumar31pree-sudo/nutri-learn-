import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()
    const [showEscape, setShowEscape] = useState(false)

    useEffect(() => {
        if (!loading) return
        // After 10 s show a manual escape link so users are never truly stuck
        const t = setTimeout(() => setShowEscape(true), 10000)
        return () => clearTimeout(t)
    }, [loading])

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-[#FF8C00] animate-spin" />
                <p className="font-mono text-xs text-white/40 tracking-widest uppercase animate-pulse">
                    Loading session…
                </p>
                {showEscape && (
                    <a
                        href="/login"
                        className="mt-2 text-[#FF8C00] font-outfit text-sm underline underline-offset-4 hover:text-white transition-colors"
                    >
                        Taking too long? Tap here to go to Login →
                    </a>
                )}
            </div>
        )
    }
    return user ? children : <Navigate to="/login" replace />
}
