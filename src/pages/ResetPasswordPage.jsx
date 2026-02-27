import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ password: '', confirm: '' })
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [done, setDone] = useState(false)

    const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }
        if (form.password !== form.confirm) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: form.password })
            if (error) throw error
            setDone(true)
            // Redirect to login after 2.5 seconds
            setTimeout(() => navigate('/login'), 2500)
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
                        <KeyRound className="text-white" size={24} />
                    </div>
                    <h1 className="font-caveat text-4xl font-bold text-white tracking-tight">Set New Password</h1>
                    <p className="font-caveat italic text-xl text-white/60 mt-1">Choose something memorable</p>
                </div>

                {/* Card */}
                <div className="glass-card rounded-3xl p-8 shadow-xl">

                    {error && (
                        <div className="flex items-center gap-2 bg-white/10 border border-[#FF8C00]/40 rounded-xl px-4 py-3 mb-6 text-[#FF8C00] text-sm font-outfit">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {done ? (
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/20 border border-green-400/30 mb-2">
                                <CheckCircle2 className="text-green-400" size={28} />
                            </div>
                            <p className="font-outfit text-white font-semibold text-lg">Password Updated!</p>
                            <p className="font-outfit text-white/60 text-sm">
                                Redirecting you to login...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* New password */}
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-1.5">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Min. 6 characters"
                                        className="glass-input pr-11"
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPass(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm password */}
                            <div>
                                <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-1.5">
                                    Confirm Password
                                </label>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    name="confirm"
                                    value={form.confirm}
                                    onChange={handleChange}
                                    placeholder="Re-enter your password"
                                    className="glass-input"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-glass py-3.5 rounded-full font-outfit font-semibold text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed bg-white/20 border border-white/30 hover:bg-white/30"
                            >
                                {loading ? 'Updating...' : 'Update Password →'}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs font-mono text-white/30 mt-6 tracking-wider uppercase">
                    NutriLearn
                </p>
            </div>
        </div>
    )
}
