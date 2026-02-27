import { useGame } from '../contexts/GameContext'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Shield, Calendar, Zap, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

function ShopItem({ icon, title, description, cost, available, onBuy, children }) {
    const [toast, setToast] = useState(null)

    const handleBuy = () => {
        try {
            onBuy()
            setToast({ type: 'success', msg: 'Purchase successful!' })
        } catch (e) {
            setToast({ type: 'error', msg: e.message })
        }
        setTimeout(() => setToast(null), 2500)
    }

    return (
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                        {icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-caveat text-2xl font-bold text-white">{title}</h3>
                        <p className="text-sm text-white/55 mt-0.5 leading-relaxed font-outfit">{description}</p>
                    </div>
                </div>

                {children}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                        <Zap size={15} style={{ color: '#FF8C00' }} />
                        <span className="font-mono text-sm font-bold text-white">{cost} XP</span>
                    </div>
                    <button
                        onClick={handleBuy}
                        disabled={!available}
                        className="text-white rounded-full px-5 py-2.5 font-outfit text-sm font-semibold btn-magnetic border border-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: available ? 'linear-gradient(135deg,#FF8C00,#FFB347)' : 'rgba(255,255,255,0.1)' }}
                    >
                        Redeem
                    </button>
                </div>

                {toast && (
                    <div className={`mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-outfit ${toast.type === 'success' ? 'bg-emerald-400/15 border border-emerald-400/30 text-emerald-300' : 'bg-[#FF8C00]/15 border border-[#FF8C00]/30 text-[#FF8C00]'
                        }`}>
                        {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                        {toast.msg}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ShopPage() {
    const { gameState, buyBack } = useGame()
    const navigate = useNavigate()
    const [buybackDay, setBuybackDay] = useState('')

    if (!gameState) return null
    const { xp, currentDay, completedDays, streak } = gameState
    const missedDays = Array.from({ length: currentDay - 1 }, (_, i) => i + 1).filter(d => !completedDays[d])

    return (
        <div className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-3xl mx-auto space-y-8">

                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <ShoppingBag size={22} style={{ color: '#FF8C00' }} />
                        <h1 className="font-caveat text-4xl font-bold text-white">Point Shop</h1>
                    </div>
                    <p className="font-caveat italic text-xl text-white/50">Redeem your XP to protect your progress</p>
                </div>

                {/* XP Balance */}
                <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                        <Zap size={22} style={{ color: '#FF8C00' }} />
                    </div>
                    <div>
                        <p className="font-mono text-[11px] text-white/40 uppercase tracking-widest">Available Balance</p>
                        <p className="font-caveat text-4xl font-bold text-white">{xp} <span className="text-base text-white/40 font-mono font-normal">XP</span></p>
                    </div>
                    <div className="ml-auto text-right hidden sm:block">
                        <p className="font-mono text-xs text-white/30 uppercase tracking-widest">Day Streak</p>
                        <p className="font-caveat text-3xl font-bold text-white">{streak} 🔥</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                    <ShopItem
                        icon={<Shield size={22} style={{ color: '#FF8C00' }} />}
                        title="Streak Shield"
                        description="Protect your current streak for one day if you miss tomorrow."
                        cost={80}
                        available={xp >= 80}
                        onBuy={() => { if (xp < 80) throw new Error('Not enough XP. Earn more by completing daily sprints.') }}
                    />

                    <ShopItem
                        icon={<Calendar size={22} style={{ color: '#FF8C00' }} />}
                        title="Day Buyback"
                        description="Missed a day? Spend 100 XP to restore it and protect your streak."
                        cost={100}
                        available={xp >= 100 && missedDays.length > 0}
                        onBuy={() => {
                            const day = parseInt(buybackDay)
                            if (!day || !missedDays.includes(day)) throw new Error('Please select a valid missed day first.')
                            buyBack(day)
                            setBuybackDay('')
                        }}
                    >
                        {missedDays.length > 0 ? (
                            <div className="mt-2">
                                <label className="block font-mono text-[11px] text-white/40 uppercase tracking-widest mb-1.5">Select Day to Buyback</label>
                                <select
                                    value={buybackDay}
                                    onChange={e => setBuybackDay(e.target.value)}
                                    className="w-full glass-input"
                                >
                                    <option value="" className="bg-purple-900">Choose a missed day…</option>
                                    {missedDays.map(d => (
                                        <option key={d} value={d} className="bg-purple-900">Day {d}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="mt-2 flex items-center gap-2 text-emerald-300 text-xs font-mono">
                                <CheckCircle2 size={14} /> No missed days — great work!
                            </div>
                        )}
                    </ShopItem>
                </div>

                {/* Earn more */}
                <div className="glass-card rounded-2xl p-5 border border-white/15">
                    <h3 className="font-caveat text-xl font-bold text-white mb-3">How to Earn XP</h3>
                    <div className="space-y-2">
                        {[
                            { act: 'Correct answer in Daily Sprint', pts: '+10 XP' },
                            { act: 'Perfect Sprint (5/5 correct)', pts: '+50 XP' },
                            { act: 'Maintain a 7-day streak', pts: 'Bonus ×1.1' },
                        ].map(({ act, pts }) => (
                            <div key={act} className="flex items-center justify-between text-sm">
                                <span className="text-white/60 font-outfit">{act}</span>
                                <span className="font-mono text-xs font-semibold" style={{ color: '#FF8C00' }}>{pts}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center">
                    <button onClick={() => navigate('/dashboard')}
                        className="text-white/40 hover:text-white text-sm font-mono transition-colors py-2">
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    )
}
