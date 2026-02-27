import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-moss border-t-transparent animate-spin" />
                    <p className="font-mono text-xs text-charcoal/40 tracking-widest uppercase">Loading session…</p>
                </div>
            </div>
        )
    }
    return user ? children : <Navigate to="/login" replace />
}
