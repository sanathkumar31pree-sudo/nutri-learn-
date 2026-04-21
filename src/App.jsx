import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { GameProvider } from './contexts/GameContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import SprintPage from './pages/SprintPage'
import ShopPage from './pages/ShopPage'
import NotificationsPage from './pages/NotificationsPage'
import WeeklyLogPage from './pages/WeeklyLogPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function Layout({ children }) {
    return (
        <div className="flex flex-col min-h-screen" style={{ minHeight: '100dvh' }}>
            <Navbar />
            <main className="flex-1">{children}</main>
        </div>
    )
}

function AuthGuard({ children }) {
    const { user, loading } = useAuth()
    const [showEscape, setShowEscape] = useState(false)

    useEffect(() => {
        if (!loading) return
        const t = setTimeout(() => setShowEscape(true), 10000)
        return () => clearTimeout(t)
    }, [loading])

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-white/20 border-t-[#FF8C00] rounded-full animate-spin"></div>
            <p className="text-white/50 font-mono text-sm uppercase tracking-widest animate-pulse">Connecting securely...</p>
            {showEscape && (
                <a href="/login" className="mt-2 text-[#FF8C00] font-outfit text-sm underline underline-offset-4 hover:text-white transition-colors">
                    Taking too long? Go to Login →
                </a>
            )}
        </div>
    )
    return user ? <Navigate to="/dashboard" replace /> : children
}

function AppRoutes() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthGuard><LoginPage /></AuthGuard>} />
                <Route path="/signup" element={<AuthGuard><SignupPage /></AuthGuard>} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/sprint" element={<ProtectedRoute><SprintPage /></ProtectedRoute>} />
                <Route path="/shop" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/weekly-log" element={<ProtectedRoute><WeeklyLogPage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <GameProvider>
                    <AppRoutes />
                </GameProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
