import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await resetPassword(email.trim())
            setSent(true)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-12">
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 border border-white/30 shadow-xl mb-4">
                        <Mail className="text-white" size={24} />
                    </div>
                    <h1 className="font-caveat text-4xl font-bold text-white tracking-tight">Forgot Password?</h1>
                    <p className="font-caveat italic text-xl text-white/60 mt-1">We'll send you a reset link</p>
                </div>

                {/* Card */}
                <div className="glass-card rounded-3xl p-8 shadow-xl">

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 bg-white/10 border border-[#FF8C00]/40 rounded-xl px-4 py-3 mb-6 text-[#FF8C00] text-sm font-outfit">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {/* Success state */}
                    {sent ? (
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/20 border border-green-400/30 mb-2">
                                <CheckCircle2 className="text-green-400" size={28} />
                            </div>
                            <p className="font-outfit text-white font-semibold text-lg">Check your inbox!</p>
                            <p className="font-outfit text-white/60 text-sm leading-relaxed">
                                We've sent a password reset link to <span className="text-white font-medium">{email}</span>. Click the link in the email to set a new password.
                            </p>
                            <p className="font-outfit text-white/40 text-xs mt-2">
                                Didn't receive it? Check your spam folder or{' '}
                                <button onClick={() => setSent(false)} className="text-[#FF8C00] hover:underline">try again</button>.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-1.5">
                                    Your Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@jssaher.edu.in"
                                    className="glass-input"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-glass py-3.5 rounded-full font-outfit font-semibold text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed bg-white/20 border border-white/30 hover:bg-white/30"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link →'}
                            </button>
                        </form>
                    )}

                    <p className="text-center text-sm text-white/50 mt-6 font-outfit">
                        Remembered it?{' '}
                        <Link to="/login" className="text-[#FF8C00] font-semibold hover:underline">Back to Login</Link>
                    </p>
                </div>

                <p className="text-center text-xs font-mono text-white/30 mt-6 tracking-wider uppercase">
                    NutriLearn
                </p>
            </div>
        </div>
    )
}
