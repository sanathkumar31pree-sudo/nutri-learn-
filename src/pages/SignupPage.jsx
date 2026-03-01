import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Sparkles, AlertCircle, Shield, Star } from 'lucide-react'

export default function SignupPage() {
    const { signUp } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const group = searchParams.get('group') || 'volunteer' // default to volunteer if no param
    const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
    const [showPass, setShowPass] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (!form.username.trim()) return setError('Username is required.')
        if (!form.email.includes('@')) return setError('Enter a valid email address.')
        if (form.password.length < 6) return setError('Password must be at least 6 characters.')
        if (form.password !== form.confirm) return setError('Passwords do not match.')
        setLoading(true)
        try {
            await signUp(form.username.trim(), form.email.trim(), form.password, group)
            navigate('/dashboard')
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
                        <Sparkles className="text-white" size={24} />
                    </div>
                    <h1 className="font-caveat text-4xl font-bold text-white tracking-tight">Create your account</h1>
                    <p className="font-caveat italic text-xl text-white/60 mt-1">Begin your 90-day journey today</p>
                </div>

                {/* Card */}
                <div className="glass-card rounded-3xl p-8 shadow-xl">
                    {error && (
                        <div className="flex items-center gap-2 bg-white/10 border border-[#FF8C00]/40 rounded-xl px-4 py-3 mb-6 text-[#FF8C00] text-sm font-outfit">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-1.5">Username</label>
                            <input type="text" name="username" value={form.username} onChange={handleChange}
                                placeholder="e.g. sanat_researcher"
                                className="glass-input" required />
                        </div>

                        <div>
                            <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-1.5">Email ID</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange}
                                placeholder="you@example.com"
                                className="glass-input" required />
                        </div>

                        <div>
                            <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-1.5">Password</label>
                            <div className="relative">
                                <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                                    placeholder="At least 6 characters"
                                    className="glass-input pr-11" required />
                                <button type="button" onClick={() => setShowPass(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-1.5">Confirm Password</label>
                            <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
                                placeholder="Re-enter your password"
                                className="glass-input" required />
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full btn-glass py-3.5 rounded-full font-outfit font-semibold text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed bg-white/20 border border-white/30 hover:bg-white/30">
                            {loading ? 'Creating Account...' : 'Begin Intervention →'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-white/50 mt-6 font-outfit">
                        Already enrolled?{' '}
                        <Link to="/login" className="text-[#FF8C00] font-semibold hover:underline">Sign in here</Link>
                    </p>
                </div>

                <p className="text-center text-xs font-mono text-white/30 mt-6 tracking-wider uppercase">
                    NutriLearn
                </p>
            </div>
        </div>
    )
}
