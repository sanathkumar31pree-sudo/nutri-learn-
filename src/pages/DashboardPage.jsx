import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useGame } from '../contexts/GameContext'
import { Zap, Flame, Calendar, PlayCircle, ShoppingBag, Bell, TrendingUp, Award, LogOut } from 'lucide-react'

// SVG circular progress ring
function ProgressRing({ day, total = 90, size = 180, stroke = 10 }) {
    const r = (size - stroke) / 2
    const circ = 2 * Math.PI * r
    const pct = Math.min(day / total, 1)
    const offset = circ * (1 - pct)

    // All tiers use orange accent on gradient bg
    const tierColor = day <= 30 ? '#FF8C00' : day <= 60 ? '#fff' : '#FFB347'
    const tier = day <= 30 ? 'Easy' : day <= 60 ? 'Medium' : 'Hard'

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none"
                    stroke={tierColor}
                    strokeWidth={stroke}
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="progress-ring-circle"
                    style={{ filter: `drop-shadow(0 0 8px ${tierColor}88)` }}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-bold text-white leading-none">{day}</span>
                <span className="font-mono text-xs text-white/40 tracking-widest mt-1">/ {total}</span>
                <span className="font-outfit text-[10px] font-semibold uppercase tracking-widest mt-1 px-2 py-0.5 rounded-full bg-white/15 text-white">
                    {tier}
                </span>
            </div>
        </div>
    )
}

function StatCard({ icon, label, value, sub, glowColor }) {
    return (
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4 btn-magnetic">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/15">
                <span style={{ color: glowColor || 'white' }}>{icon}</span>
            </div>
            <div>
                <p className="font-mono text-[11px] text-white/40 uppercase tracking-widest">{label}</p>
                <p className="font-caveat text-2xl font-bold text-white">{value}</p>
                {sub && <p className="font-mono text-xs text-white/40 mt-0.5">{sub}</p>}
            </div>
        </div>
    )
}

export default function DashboardPage() {
    const { user, signOut } = useAuth()
    const { gameState } = useGame()
    const navigate = useNavigate()

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    if (!gameState) {
        return (
            <div className="min-h-screen pt-24 pb-16 px-4 flex justify-center items-center">
                <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-[#FF8C00] animate-spin" />
            </div>
        )
    }

    const { currentDay, xp, streak, completedDays } = gameState
    const todayCompleted = !!completedDays[currentDay]
    const completedCount = Object.keys(completedDays).length
    const totalXpPossible = currentDay * 5 * 10

    const tierLabel = currentDay <= 30 ? 'Easy Tier — Days 1–30'
        : currentDay <= 60 ? 'Medium Tier — Days 31–60'
            : 'Hard Tier — Days 61–90'

    return (
        <div className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Hero */}
                <div className="glass-card rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 overflow-hidden relative">
                    <button
                        onClick={handleSignOut}
                        className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors p-2 rounded-full hover:bg-white/10 z-10"
                        title="Sign Out"
                    >
                        <LogOut size={20} />
                    </button>
                    <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex-shrink-0">
                        <ProgressRing day={currentDay} />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <p className="font-mono text-xs text-white/40 uppercase tracking-widest mb-2">{tierLabel}</p>
                        <h1 className="font-caveat text-4xl md:text-5xl font-bold text-white leading-tight">
                            Hello, <span className="text-[#FF8C00]">{user?.username}</span>
                        </h1>
                        <p className="font-caveat italic text-2xl text-white/60 mt-1">
                            {todayCompleted
                                ? "Today\u2019s sprint is complete. Well done."
                                : "Your daily sprint awaits. Stay sharp."}
                        </p>

                        <div className="mt-6 flex flex-col sm:flex-row items-center md:items-start gap-3">
                            {todayCompleted ? (
                                <div className="flex items-center gap-2 bg-white/15 border border-white/25 text-white rounded-full px-5 py-3 font-outfit font-semibold text-sm">
                                    <Award size={18} className="text-[#FF8C00]" /> Sprint Completed ✓
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate('/sprint')}
                                    className="flex items-center gap-2 bg-[#FF8C00] text-white rounded-full px-6 py-3 font-outfit font-bold text-base btn-magnetic shadow-lg border border-white/20"
                                    style={{ boxShadow: '0 0 24px rgba(255,140,0,0.45)' }}
                                >
                                    <PlayCircle size={20} /> Start Daily Sprint
                                </button>
                            )}
                            <Link to="/shop"
                                className="flex items-center gap-2 bg-white/15 border border-white/25 text-white rounded-full px-5 py-3 font-outfit font-semibold text-sm btn-magnetic hover:bg-white/25 transition-colors">
                                <ShoppingBag size={18} /> Point Shop
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<Zap size={20} />} label="Total XP" value={xp} sub="+10 per correct" glowColor="#FF8C00" />
                    <StatCard icon={<Flame size={20} />} label="Day Streak" value={`${streak}🔥`} sub={streak > 0 ? 'Keep going!' : 'Start today'} glowColor="#FF8C00" />
                    <StatCard icon={<Calendar size={20} />} label="Days Done" value={completedCount} sub="of 90 days" glowColor="white" />
                    <StatCard
                        icon={<TrendingUp size={20} />}
                        label="XP Rating"
                        value={totalXpPossible > 0 ? `${Math.round((xp / totalXpPossible) * 100)}%` : '—'}
                        sub="Accuracy index"
                        glowColor="white"
                    />
                </div>

                {/* 90-Day Progress Map */}
                <div className="glass-card rounded-3xl p-6 md:p-8">
                    <h2 className="font-caveat text-2xl font-bold text-white mb-1">90-Day Progress Map</h2>
                    <p className="font-mono text-xs text-white/40 mb-6 uppercase tracking-widest">Day-by-day completion overview</p>
                    <div className="grid grid-cols-10 gap-1.5">
                        {Array.from({ length: 90 }, (_, i) => {
                            const d = i + 1
                            const done = !!completedDays[d]
                            const isToday = d === currentDay
                            const isFuture = d > currentDay
                            let bg = 'bg-white/10'
                            if (done) bg = 'bg-[#FF8C00]/70'
                            if (isToday && !done) bg = 'bg-white/40 animate-pulse'
                            return (
                                <div
                                    key={d}
                                    title={`Day ${d}${done ? ' ✓' : isToday ? ' (today)' : ''}`}
                                    className={`aspect-square rounded-md ${bg} ${isFuture ? 'opacity-30' : ''} transition-all duration-200 cursor-default flex items-center justify-center`}
                                    style={done ? { boxShadow: '0 0 6px rgba(255,140,0,0.4)' } : {}}
                                >
                                    {isToday && !done && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-4">
                        {[
                            { color: 'bg-[#FF8C00]/70', label: 'Completed', glow: true },
                            { color: 'bg-white/40', label: 'Today' },
                            { color: 'bg-white/10', label: 'Upcoming' },
                        ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <span className={`w-3 h-3 rounded-sm ${color}`} />
                                <span className="font-mono text-[11px] text-white/50">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick links */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <Link to="/notifications"
                        className="glass-card rounded-2xl p-5 flex items-center gap-4 btn-magnetic hover:bg-white/20 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                            <Bell size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="font-outfit text-sm font-semibold text-white">Daily Reminders</p>
                            <p className="font-mono text-xs text-white/40">
                                Set to {gameState.notificationTime || '08:00'} · {gameState.notificationsEnabled ? 'On' : 'Off'}
                            </p>
                        </div>
                    </Link>
                    <Link to="/shop"
                        className="glass-card rounded-2xl p-5 flex items-center gap-4 btn-magnetic hover:bg-white/20 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                            <ShoppingBag size={18} className="text-[#FF8C00]" />
                        </div>
                        <div>
                            <p className="font-outfit text-sm font-semibold text-white">Point Shop</p>
                            <p className="font-mono text-xs text-white/40">Buyback missed days · {xp} XP available</p>
                        </div>
                    </Link>
                </div>

            </div>
        </div>
    )
}
