import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const { signIn } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [showPass, setShowPass] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await signIn(form.email.trim(), form.password)
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
                    <h1 className="font-caveat text-4xl font-bold text-white tracking-tight">Welcome back</h1>
                    <p className="font-caveat italic text-xl text-white/60 mt-1">Continue your intervention</p>
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
                            <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-1.5">Institutional Email</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange}
                                placeholder="you@jssaher.edu.in"
                                className="glass-input" required />
                        </div>

                        <div>
                            <label className="block text-xs font-mono uppercase tracking-widest text-white/50 mb-1.5">Password</label>
                            <div className="relative">
                                <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                                    placeholder="Enter your password"
                                    className="glass-input pr-11" required />
                                <button type="button" onClick={() => setShowPass(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="text-right mt-1.5">
                                <Link to="/forgot-password" className="text-xs font-outfit text-white/40 hover:text-[#FF8C00] transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full btn-glass py-3.5 rounded-full font-outfit font-semibold text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed bg-white/20 border border-white/30 hover:bg-white/30">
                            {loading ? 'Signing In...' : 'Enter Dashboard →'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-white/50 mt-6 font-outfit">
                        New to the study?{' '}
                        <Link to="/signup" className="text-[#FF8C00] font-semibold hover:underline">Enrol here</Link>
                    </p>
                </div>

                <p className="text-center text-xs font-mono text-white/30 mt-6 tracking-wider uppercase">
                    NutriLearn
                </p>
            </div>
        </div>
    )
}
