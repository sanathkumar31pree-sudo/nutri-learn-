import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useGame } from '../contexts/GameContext'
import { gsap } from 'gsap'
import { submitWeeklyLog, checkWeeklyLogSubmitted } from '../lib/quizService'
import { Loader2, BookOpen, Leaf, CheckCircle2 } from 'lucide-react'

// ─── Question definitions ──────────────────────────────────────────────────
const QUESTIONS = [
    {
        id: 'water',
        emoji: '💧',
        label: 'Hydration',
        dbCol: 'water',
        question: 'How much water did you drink each day this week?',
        options: [
            { text: '0–2 glasses a day', positive: false },
            { text: '3–4 glasses a day', positive: false },
            { text: '5–6 glasses a day', positive: true },
            { text: '7+ glasses a day', positive: true },
        ],
        feedback: {
            low: 'Your inner garden is thirsty! Try carrying a bottle with you to lectures tomorrow.',
            high: "You're flowing perfectly! Stay hydrated to keep your focus sharp.",
        },
    },
    {
        id: 'fruits',
        emoji: '🥦',
        label: 'Fruit & Veggie Intake',
        dbCol: 'fruits',
        question: 'How many fruits or vegetables did you eat daily this week?',
        options: [
            { text: 'Rarely (0–1 servings/day)', positive: false },
            { text: 'Sometimes (2 servings/day)', positive: false },
            { text: 'Often (3–4 servings/day)', positive: true },
            { text: 'Every meal (5+ servings)', positive: true },
        ],
        feedback: {
            low: "The soil of your plate needs more colour! Add one fruit a day — it's a gentle beginning.",
            high: 'A rainbow on your plate every day! Your body is thriving on nature\'s finest recipes.',
        },
    },
    {
        id: 'processed',
        emoji: '🍟',
        label: 'Processed Food',
        dbCol: 'processed',
        question: 'How often did you eat processed or packaged food this week?',
        options: [
            { text: 'Every day, most meals', positive: false },
            { text: 'Most days (once daily)', positive: false },
            { text: 'Occasionally (2–3 times/week)', positive: true },
            { text: 'Rarely or never', positive: true },
        ],
        feedback: {
            low: 'The factory gnomes have been visiting too often! Try swapping one packet for a home-cooked meal.',
            high: 'A whole-foods champion! Your kitchen magic is keeping you nourished and strong.',
        },
    },
    {
        id: 'sleep',
        emoji: '🌙',
        label: 'Sleep Quality',
        dbCol: 'sleep',
        question: 'How many hours did you sleep on most nights this week?',
        options: [
            { text: 'Under 5 hours', positive: false },
            { text: '5–6 hours (some nights)', positive: false },
            { text: '6–7 hours consistently', positive: true },
            { text: '7–9 hours (well rested!)', positive: true },
        ],
        feedback: {
            low: 'Rest is where the magic happens. Try a screen-free hour before bed tonight to recharge.',
            high: 'Consistent rest is the foundation of high performance. Your mind must feel so clear!',
        },
    },
    {
        id: 'activity',
        emoji: '🌿',
        label: 'Physical Activity',
        dbCol: 'activity',
        question: 'How many days did you exercise or stay physically active?',
        options: [
            { text: 'No exercise at all', positive: false },
            { text: '1–2 days of light movement', positive: false },
            { text: '3–4 days active', positive: true },
            { text: '5+ days of movement', positive: true },
        ],
        feedback: {
            low: 'A small walk in the garden is a great start. Try five minutes of stretching today!',
            high: 'Full of vitality! Your body thrives on that movement and energy.',
        },
    },
    {
        id: 'eating_outside',
        emoji: '🏡',
        label: 'Dining Out',
        dbCol: 'eating_outside',
        question: 'How many meals did you eat outside or order delivery this week?',
        options: [
            { text: 'Every day (most meals)', positive: false },
            { text: '4–5 times a week', positive: false },
            { text: '2–3 times a week', positive: true },
            { text: 'Rarely or never', positive: true },
        ],
        feedback: {
            low: "The world's kitchens are tempting! Next time, try a 'steamed' or 'grilled' choice.",
            high: 'A master of the home hearth! Cooking for yourself is a beautiful act of self-care.',
        },
    },
]

// ─── Fruit basket (SVG + emoji fill animation) ───────────────────────────
const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🥝', '🍓']
function FruitBasket({ score }) {
    // score = 0–6 (number of positive answers)
    const fill = Math.round((score / 6) * 6)
    return (
        <div className="flex flex-col items-center gap-3 my-6">
            <div className="relative">
                {/* Basket outline */}
                <svg width="140" height="90" viewBox="0 0 140 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="70" cy="78" rx="54" ry="12" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                    <path d="M16 78 Q10 40 30 30 L110 30 Q130 40 124 78 Z" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M30 30 Q50 0 70 30" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M110 30 Q90 0 70 30" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    {/* Wicker lines */}
                    {[40, 52, 64, 76].map(y => (
                        <line key={y} x1="22" y1={y} x2="118" y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    ))}
                </svg>
                {/* Fruits floating above basket */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 flex-wrap justify-center w-32">
                    {FRUITS.slice(0, fill).map((f, i) => (
                        <span key={i} className="text-xl animate-bounce" style={{ animationDelay: `${i * 0.1}s`, animationDuration: '2s' }}>
                            {f}
                        </span>
                    ))}
                    {fill === 0 && <span className="text-2xl opacity-30">🧺</span>}
                </div>
            </div>
            <p className="font-patrick text-white/70 text-sm text-center">
                {fill === 6 ? 'Your harvest basket overflows! 🌟' :
                    fill >= 4 ? 'A bountiful week! Keep growing 🌱' :
                        fill >= 2 ? 'Good seeds planted this week 🌾' :
                            'Every journey starts with a single seed 🌱'}
            </p>
        </div>
    )
}

// ─── Feedback card ────────────────────────────────────────────────────────
function HarvestReport({ answers }) {
    const positiveCount = answers.filter(a => a.positive).length
    return (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <h2 className="font-patrick text-3xl text-white mb-1">Your Harvest Report</h2>
                <p className="font-quicksand text-white/60 text-sm">Week {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>

            <FruitBasket score={positiveCount} />

            <div className="space-y-3 mt-4">
                {QUESTIONS.map((q, i) => {
                    const ans = answers[i]
                    const isPositive = ans?.positive
                    return (
                        <div key={q.id}
                            className="rounded-2xl p-4 border"
                            style={{
                                background: isPositive ? 'rgba(134,239,172,0.12)' : 'rgba(255,140,0,0.10)',
                                borderColor: isPositive ? 'rgba(134,239,172,0.3)' : 'rgba(255,140,0,0.3)',
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-xl flex-shrink-0">{q.emoji}</span>
                                <div>
                                    <p className="font-quicksand text-xs font-semibold uppercase tracking-wider mb-1"
                                        style={{ color: isPositive ? '#86efac' : '#FF8C00' }}>
                                        {q.label}
                                    </p>
                                    <p className="font-patrick text-white/80 text-sm leading-relaxed">
                                        {isPositive ? q.feedback.high : q.feedback.low}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="glass-card rounded-2xl p-4 text-center border border-[#FF8C00]/30 mt-4"
                style={{ background: 'rgba(255,140,0,0.12)' }}>
                <p className="font-mono text-2xl font-bold text-white">+50 XP</p>
                <p className="font-quicksand text-white/60 text-sm mt-1">Growth Journal bonus earned 🌿</p>
            </div>
        </div>
    )
}

// ─── Main Weekly Log Page ─────────────────────────────────────────────────
export default function WeeklyLogPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { gameState, completeDay } = useGame()

    const [loading, setLoading] = useState(true)
    const [alreadySubmitted, setAlreadySubmitted] = useState(false)
    const [selections, setSelections] = useState(Array(6).fill(null))  // index of chosen option per question
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(null)
    const [submitted, setSubmitted] = useState(false)
    const [harvestAnswers, setHarvestAnswers] = useState([])

    const bookRef = useRef(null)
    const cardsRef = useRef(null)

    // ── Check if already submitted this week ──────────────────────────────
    useEffect(() => {
        if (!user?.id) return

        // Check local stamp first (works offline)
        const now = new Date()
        const dayOfWeek = now.getDay()
        const diff = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek)
        const monday = new Date(now)
        monday.setDate(now.getDate() + diff)
        const weekStart = monday.toISOString().split('T')[0]
        const localKey = `nutrilearn_journal_done_${user.id}`

        if (localStorage.getItem(localKey) === weekStart) {
            setAlreadySubmitted(true)
            setLoading(false)
            return
        }

        // Also check Supabase (if online)
        checkWeeklyLogSubmitted(user.id)
            .then(row => {
                setAlreadySubmitted(!!row)
                setLoading(false)
            })
            .catch(() => {
                // Supabase offline — local stamp already checked above
                setLoading(false)
            })
    }, [user?.id])

    // ── GSAP sketchbook-opening animation ────────────────────────────────
    useEffect(() => {
        if (loading || alreadySubmitted || !bookRef.current) return
        const tl = gsap.timeline()
        tl.fromTo(bookRef.current,
            { rotateY: -90, opacity: 0, transformOrigin: 'left center' },
            { rotateY: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
        )
        if (cardsRef.current) {
            tl.fromTo(
                cardsRef.current.querySelectorAll('.q-card'),
                { opacity: 0, y: 28 },
                { opacity: 1, y: 0, stagger: 0.1, duration: 0.45, ease: 'power2.out' },
                '-=0.3'
            )
        }
    }, [loading, alreadySubmitted])

    const handleSelect = (qIdx, optIdx) => {
        setSelections(prev => {
            const next = [...prev]
            next[qIdx] = optIdx
            return next
        })
    }

    const allAnswered = selections.every(s => s !== null)

    const handleSubmit = async () => {
        if (!allAnswered || submitting) return
        setSubmitting(true)
        setSubmitError(null)

        const getVal = (qIdx) => QUESTIONS[qIdx].options[selections[qIdx]].text
        const getPositive = (qIdx) => QUESTIONS[qIdx].options[selections[qIdx]].positive

        // Grant +50 XP locally immediately
        try {
            const storageKey = `nutrilearn_game_${user.id}`
            const state = JSON.parse(localStorage.getItem(storageKey) || '{}')
            state.xp = (state.xp ?? 0) + 50
            localStorage.setItem(storageKey, JSON.stringify(state))
        } catch (_) { /* non-critical */ }

        // Write local week stamp so "already submitted" check works offline
        const now = new Date()
        const dayOfWeek = now.getDay()
        const diff = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek)
        const monday = new Date(now)
        monday.setDate(now.getDate() + diff)
        const weekStart = monday.toISOString().split('T')[0]
        localStorage.setItem(`nutrilearn_journal_done_${user.id}`, weekStart)

        // Attempt Supabase in background (non-blocking)
        submitWeeklyLog({
            userId: user.id,
            water: getVal(0),
            fruits: getVal(1),
            processed: getVal(2),
            sleep: getVal(3),
            activity: getVal(4),
            eating_outside: getVal(5),
        }).catch((err) => {
            console.warn('[WeeklyLog] Supabase sync failed:', err?.message)
            setSubmitError('⚠️ Saved locally — database sync failed. Your journal is recorded.')
        })

        // Show harvest report immediately
        const answers = QUESTIONS.map((_, i) => ({
            ...QUESTIONS[i],
            positive: getPositive(i),
            selectedText: getVal(i),
        }))
        setHarvestAnswers(answers)
        setSubmitted(true)
        setSubmitting(false)
    }

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="glass-card rounded-2xl px-8 py-6 flex items-center gap-3">
                    <Loader2 size={20} className="text-white/60 animate-spin" />
                    <p className="font-quicksand text-sm text-white/60">Opening your journal…</p>
                </div>
            </div>
        )
    }

    // ── Already submitted ────────────────────────────────────────────────────
    if (alreadySubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-8">
                <div className="glass-card rounded-3xl p-8 max-w-sm w-full text-center">
                    <CheckCircle2 size={44} className="mx-auto mb-4" style={{ color: '#86efac' }} />
                    <h2 className="font-patrick text-3xl text-white mb-2">Journal Complete!</h2>
                    <p className="font-quicksand text-white/60 text-sm mb-6">
                        You have already written your Growth Journal for this week. See you next week! 🌿
                    </p>
                    <button onClick={() => navigate('/dashboard')}
                        className="w-full bg-white/20 border border-white/30 text-white rounded-full py-3 font-quicksand font-semibold btn-magnetic hover:bg-white/30 text-sm">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    // ── Harvest Report (post-submit) ─────────────────────────────────────────
    if (submitted) {
        return (
            <div className="min-h-screen pt-20 pb-12 px-4"
                style={{ background: 'linear-gradient(160deg, #2d5a27 0%, #1a3320 30%, #7B61FF 100%)', backgroundAttachment: 'fixed' }}>
                <div className="max-w-xl mx-auto">
                    <HarvestReport answers={harvestAnswers} />
                    <div className="mt-6 flex justify-center">
                        <button onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 bg-white/20 border border-white/30 text-white rounded-full px-7 py-3 font-quicksand font-semibold btn-magnetic hover:bg-white/30 text-sm">
                            <Leaf size={16} /> Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ── Main Form ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen pt-20 pb-12 px-4"
            style={{ background: 'linear-gradient(160deg, #1a3a2a 0%, #2d4a3a 30%, #7B61FF 100%)', backgroundAttachment: 'fixed' }}>
            <div className="max-w-xl mx-auto" ref={bookRef} style={{ perspective: '1000px' }}>

                {/* Journal Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
                        <BookOpen size={14} className="text-emerald-300" />
                        <span className="font-mono text-xs text-white/60 uppercase tracking-widest">Weekly Growth Journal</span>
                    </div>
                    <h1 className="font-patrick text-4xl sm:text-5xl text-white mb-2 drop-shadow-lg">
                        The Growth Journal 🌿
                    </h1>
                    <p className="font-quicksand text-white/60 text-base italic">
                        A gentle check-in for your body, mind, and habits.
                    </p>
                </div>

                {/* Question cards */}
                <div ref={cardsRef} className="space-y-5">
                    {QUESTIONS.map((q, qIdx) => (
                        <div key={q.id} className="q-card glass-card rounded-3xl p-5 sm:p-6 relative overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.10)' }}>
                            {/* Subtle blob decoration */}
                            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 pointer-events-none"
                                style={{ background: `radial-gradient(circle, ${['#86efac', '#fde68a', '#f9a8d4', '#93c5fd', '#6ee7b7', '#fca5a1'][qIdx]}, transparent)` }} />

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-2xl">{q.emoji}</span>
                                    <span className="font-mono text-[11px] text-white/40 uppercase tracking-widest">{q.label}</span>
                                </div>
                                <p className="font-patrick text-lg sm:text-xl text-white mb-4 leading-snug">{q.question}</p>

                                <div className="space-y-2">
                                    {q.options.map((opt, optIdx) => {
                                        const isSelected = selections[qIdx] === optIdx
                                        return (
                                            <button
                                                key={optIdx}
                                                onClick={() => handleSelect(qIdx, optIdx)}
                                                className="w-full text-left rounded-2xl px-4 py-3 font-quicksand text-sm font-medium transition-all duration-200 btn-magnetic border"
                                                style={{
                                                    minHeight: '48px',
                                                    background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.07)',
                                                    borderColor: isSelected ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
                                                    color: isSelected ? 'white' : 'rgba(255,255,255,0.65)',
                                                    boxShadow: isSelected ? '0 0 12px rgba(255,255,255,0.15)' : 'none',
                                                }}
                                            >
                                                <span className="mr-2 font-mono text-xs opacity-50">{String.fromCharCode(65 + optIdx)}.</span>
                                                {opt.text}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Progress indicator */}
                <div className="mt-5 mb-2 flex items-center justify-between px-1">
                    <span className="font-mono text-xs text-white/40">{selections.filter(s => s !== null).length} / 6 answered</span>
                    <div className="flex gap-1">
                        {selections.map((s, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all ${s !== null ? 'bg-emerald-400' : 'bg-white/20'}`} />
                        ))}
                    </div>
                </div>

                {/* Error */}
                {submitError && (
                    <div className="mt-4 px-4 py-3 rounded-xl bg-[#FF8C00]/15 border border-[#FF8C00]/30 text-[#FF8C00] text-sm font-quicksand">
                        {submitError}
                    </div>
                )}

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={!allAnswered || submitting}
                    className="w-full mt-5 text-white rounded-full py-4 font-quicksand font-bold text-base btn-magnetic flex items-center justify-center gap-2 border border-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                        background: allAnswered && !submitting
                            ? 'linear-gradient(135deg, #2d7a3f, #4ade80)'
                            : 'rgba(255,255,255,0.1)',
                        boxShadow: allAnswered ? '0 0 24px rgba(74,222,128,0.3)' : 'none',
                    }}
                >
                    {submitting
                        ? <><Loader2 size={18} className="animate-spin" /> Saving your journal…</>
                        : <><Leaf size={18} /> Complete My Growth Journal</>
                    }
                </button>


            </div>
        </div>
    )
}
