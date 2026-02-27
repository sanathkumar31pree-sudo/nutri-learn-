import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Zap, Flame, Calendar, ArrowRight, Award, BookOpen, Clock } from 'lucide-react'

const features = [
    { icon: <Calendar size={22} className="text-[#FF8C00]" />, title: '90-Day Structure', desc: 'Three escalating tiers — Easy, Medium, Hard — mirroring real dietary learning curves.' },
    { icon: <Zap size={22} className="text-[#FF8C00]" />, title: 'XP Point Economy', desc: 'Earn 10 XP per correct answer. Spend XP to protect streaks or buyback missed days.' },
    { icon: <Clock size={22} className="text-[#FF8C00]" />, title: '30-Second Sprints', desc: 'Each question has a hard 30-second cutoff. Five focused questions per day — nothing more.' },
    { icon: <Flame size={22} className="text-[#FF8C00]" />, title: 'Streak Mechanics', desc: 'Daily streaks drive behaviour change. Miss a day? Buyback your streak with earned XP.' },
    { icon: <BookOpen size={22} className="text-[#FF8C00]" />, title: 'Research-Grade Content', desc: 'Questions authored to validated academic standards across three difficulty tiers.' },
    { icon: <Award size={22} className="text-[#FF8C00]" />, title: 'Intervention Design', desc: "Built as a dissertation instrument for a Master's research study in Nutrition & Dietetics." },
]

export default function LandingPage() {
    const heroRef = useRef(null)

    useEffect(() => {
        if (!heroRef.current) return
        gsap.fromTo(
            heroRef.current.querySelectorAll('.hero-el'),
            { opacity: 0, y: 32 },
            { opacity: 1, y: 0, stagger: 0.14, duration: 0.7, ease: 'power3.out', delay: 0.2 }
        )
    }, [])

    return (
        <div className="min-h-screen overflow-hidden">
            {/* ── Hero ─────────────────────────────────────────── */}
            <section className="relative pt-36 pb-24 px-4 text-center" ref={heroRef}>
                {/* Decorative orbs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/8 rounded-full blur-3xl pointer-events-none -z-0" />
                <div className="absolute top-20 right-10 w-64 h-64 bg-[#FF8C00]/10 rounded-full blur-3xl pointer-events-none -z-0" />

                <div className="relative z-10 max-w-3xl mx-auto">
                    <div className="hero-el inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                        <span className="font-mono text-xs text-white/70 uppercase tracking-widest">NutriLearn · Recruitment Active</span>
                    </div>

                    <h1 className="hero-el font-caveat text-6xl md:text-8xl font-bold text-white leading-tight tracking-tight">
                        Nutri<span style={{ color: '#FF8C00' }}>Learn</span>
                    </h1>

                    <p className="hero-el font-caveat italic text-3xl md:text-4xl text-white/60 mt-3">
                        A 90-Day Nutrition Intervention
                    </p>

                    <p className="hero-el font-outfit text-base md:text-lg text-white/55 mt-5 max-w-xl mx-auto leading-relaxed">
                        A gamified educational platform for a 90-day nutrition intervention study. Five daily questions. Escalating difficulty. Real behaviour change.
                    </p>

                    <div className="hero-el flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
                        <Link to="/signup"
                            className="flex items-center gap-2 text-white rounded-full px-8 py-4 font-outfit font-bold text-base btn-magnetic border border-white/20"
                            style={{ background: 'linear-gradient(135deg,#FF8C00,#FFB347)', boxShadow: '0 0 32px rgba(255,140,0,0.35)' }}>
                            Enrol in the Study <ArrowRight size={20} />
                        </Link>
                        <Link to="/login"
                            className="flex items-center gap-2 bg-white/15 border border-white/25 text-white rounded-full px-8 py-4 font-outfit font-semibold text-base btn-magnetic hover:bg-white/25">
                            Sign In
                        </Link>
                    </div>

                    {/* Stats row */}
                    <div className="hero-el flex flex-wrap items-center justify-center gap-8 mt-14">
                        {[
                            { num: '90', label: 'Days' },
                            { num: '450', label: 'Questions' },
                            { num: '3', label: 'Difficulty Tiers' },
                            { num: '50', label: 'XP / Day Max' },
                        ].map(({ num, label }) => (
                            <div key={label} className="text-center">
                                <p className="font-caveat text-4xl font-bold" style={{ color: '#FF8C00' }}>{num}</p>
                                <p className="font-mono text-xs text-white/40 uppercase tracking-widest mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ─────────────────────────────────────── */}
            <section className="px-4 pb-20 max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <p className="font-mono text-xs text-[#FF8C00] uppercase tracking-widest mb-2">Core Mechanics</p>
                    <h2 className="font-caveat text-4xl font-bold text-white">Built for Behaviour Change</h2>
                    <p className="font-caveat italic text-2xl text-white/50 mt-1">Every element is intentional.</p>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {features.map((f, i) => (
                        <div key={i} className="glass-card rounded-2xl p-6 btn-magnetic hover:bg-white/20 transition-all duration-300">
                            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-4 border border-white/20">
                                {f.icon}
                            </div>
                            <h3 className="font-caveat text-2xl font-bold text-white mb-2">{f.title}</h3>
                            <p className="text-sm text-white/55 leading-relaxed font-outfit">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────── */}
            <section className="px-4 pb-24">
                <div className="max-w-2xl mx-auto">
                    <div className="glass-card rounded-3xl p-10 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                        <div className="relative z-10">
                            <p className="font-caveat italic text-2xl text-white/60 mb-2">Ready to begin?</p>
                            <h2 className="font-caveat text-4xl font-bold text-white mb-6">Day 1 of 90 Awaits</h2>
                            <Link to="/signup"
                                className="inline-flex items-center gap-2 text-white rounded-full px-8 py-4 font-outfit font-bold text-base btn-magnetic border border-white/20"
                                style={{ background: 'linear-gradient(135deg,#FF8C00,#FFB347)', boxShadow: '0 0 24px rgba(255,140,0,0.35)' }}>
                                Create Account <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
