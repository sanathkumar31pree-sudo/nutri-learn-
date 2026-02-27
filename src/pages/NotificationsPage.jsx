import { useState } from 'react'
import { useGame } from '../contexts/GameContext'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff, Clock, CheckCircle2 } from 'lucide-react'

export default function NotificationsPage() {
    const { gameState, updateNotifications } = useGame()
    const navigate = useNavigate()

    const [time, setTime] = useState(gameState?.notificationTime ?? '08:00')
    const [enabled, setEnabled] = useState(gameState?.notificationsEnabled ?? true)
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        updateNotifications(time, enabled)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const presets = ['07:00', '08:00', '09:00', '12:00', '18:00', '20:00']

    return (
        <div className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-lg mx-auto space-y-6">

                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Bell size={22} className="text-white" />
                        <h1 className="font-caveat text-4xl font-bold text-white">Daily Reminders</h1>
                    </div>
                    <p className="font-caveat italic text-xl text-white/50">Never miss your daily sprint</p>
                </div>

                {/* Toggle */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 ${enabled ? 'bg-white/20' : 'bg-white/8'}`}>
                                {enabled ? <Bell size={18} className="text-white" /> : <BellOff size={18} className="text-white/30" />}
                            </div>
                            <div>
                                <p className="font-outfit text-sm font-semibold text-white">Daily Notification</p>
                                <p className="font-mono text-xs text-white/40">{enabled ? 'Reminders are active' : 'Reminders are paused'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEnabled(e => !e)}
                            className={`relative w-12 h-6 rounded-full transition-all duration-300 btn-magnetic border border-white/20 ${enabled ? 'bg-[#FF8C00]' : 'bg-white/15'}`}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${enabled ? 'left-6' : 'left-0.5'}`} />
                        </button>
                    </div>
                </div>

                {/* Time picker */}
                <div className={`glass-card rounded-2xl p-6 space-y-4 transition-opacity duration-300 ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-white/70" />
                        <h3 className="font-outfit text-sm font-semibold text-white">Reminder Time</h3>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="time"
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            className="flex-1 glass-input text-lg"
                        />
                        <div className="text-center">
                            <p className="font-mono text-xs text-white/30 uppercase tracking-widest">Selected</p>
                            <p className="font-mono text-xl font-bold text-white">{time}</p>
                        </div>
                    </div>

                    <div>
                        <p className="font-mono text-[11px] text-white/40 uppercase tracking-widest mb-2">Quick Presets</p>
                        <div className="flex flex-wrap gap-2">
                            {presets.map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => setTime(preset)}
                                    className={`px-3 py-1.5 rounded-full font-mono text-xs btn-magnetic transition-all border ${time === preset
                                            ? 'text-white border-white/30'
                                            : 'bg-white/10 border-white/15 text-white/60 hover:bg-white/20 hover:text-white'
                                        }`}
                                    style={time === preset ? { background: 'linear-gradient(135deg,#FF8C00,#FFB347)' } : {}}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div className="bg-white/8 border border-white/15 rounded-2xl px-5 py-4">
                    <p className="text-xs text-white/50 leading-relaxed font-outfit">
                        <span className="font-semibold text-white">Note:</span> Browser notifications require permission to be granted in your browser settings to receive daily sprint reminders.
                    </p>
                </div>

                {/* Save */}
                <button
                    onClick={handleSave}
                    className="w-full text-white rounded-full py-4 font-outfit font-semibold btn-magnetic flex items-center justify-center gap-2 border border-white/20"
                    style={{ background: saved ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.2)' }}
                >
                    {saved ? <><CheckCircle2 size={18} className="text-emerald-300" /> Settings Saved!</> : 'Save Reminder Settings'}
                </button>

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
