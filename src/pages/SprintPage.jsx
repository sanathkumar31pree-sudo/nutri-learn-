import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import { useAuth } from '../contexts/AuthContext'
import { gsap } from 'gsap'
import { getTodayResponse, getStudyDay, submitQuizResponse, checkWeeklyLogSubmitted } from '../lib/quizService'
import { CheckCircle2, XCircle, Clock, Zap, ChevronRight, Home, Award, Loader2 } from 'lucide-react'

const QUESTION_TIME = 30

// ─── Orange Glow Timer Bar ────────────────────────────────────────────────
function TimerBar({ timeLeft, total = QUESTION_TIME }) {
    const pct = (timeLeft / total) * 100
    const isDanger = timeLeft <= 5
    return (
        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${isDanger ? 'timer-bar-glow timer-bar-warning' : 'timer-bar-glow'}`}
                style={{ width: `${pct}%` }}
            />
        </div>
    )
}

// ─── Results / Locked Screen ──────────────────────────────────────────────
function ResultsScreen({ results, questions, xpEarned, day, onHome }) {
    const correct = results.filter(r => r.correct).length
    const resRef = useRef(null)

    useEffect(() => {
        if (!resRef.current) return
        gsap.fromTo(
            resRef.current.querySelectorAll('.res-item'),
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, stagger: 0.1, duration: 0.45, ease: 'power3.out' }
        )
    }, [])

    return (
        <div ref={resRef} className="max-w-xl mx-auto space-y-4 pb-16">
            {/* Summary card */}
            <div className="res-item glass-card rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />
                <Award size={44} className="mx-auto mb-3" style={{ color: '#FF8C00' }} />
                <h2 className="font-caveat text-3xl sm:text-4xl font-bold text-white mb-1">Sprint Complete!</h2>
                <p className="font-caveat italic text-xl text-white/60 mb-5">Day {day} of 90</p>
                <div className="flex justify-center gap-8">
                    <div className="text-center">
                        <p className="font-mono text-3xl font-bold text-white">{correct}/5</p>
                        <p className="font-mono text-xs text-white/40 uppercase tracking-widest mt-1">Correct</p>
                    </div>
                    <div className="w-px bg-white/15" />
                    <div className="text-center">
                        <p className="font-mono text-3xl font-bold" style={{ color: '#FF8C00' }}>+{xpEarned}</p>
                        <p className="font-mono text-xs text-white/40 uppercase tracking-widest mt-1">XP Earned</p>
                    </div>
                </div>
                <p className="font-outfit text-sm text-white/40 mt-4">
                    Come back tomorrow for Day {day + 1}!
                </p>
            </div>

            {/* Per-question fact checks — synced to current day's questions */}
            {questions.map((q, i) => {
                const r = results[i]
                const isCorrect = r?.correct
                return (
                    <div key={q.id} className="res-item glass-card rounded-2xl p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5" style={{ color: isCorrect ? '#4ade80' : '#FF8C00' }}>
                                {isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-outfit text-sm font-semibold text-white leading-snug">{q.question}</p>
                                {r?.timeExpired && (
                                    <p className="font-mono text-xs mt-1" style={{ color: '#FF8C00' }}>⏱ Time expired</p>
                                )}
                                {!r?.timeExpired && !isCorrect && r?.selected != null && (
                                    <p className="font-mono text-xs text-white/50 mt-1">Your answer: {q.options[r.selected]}</p>
                                )}
                                <p className="font-mono text-xs mt-1 text-emerald-300">✓ {q.options[q.answer]}</p>
                                <p className="text-xs text-white/40 mt-1.5 leading-relaxed italic font-outfit">{q.explanation}</p>
                            </div>
                        </div>
                    </div>
                )
            })}

            <div className="res-item flex justify-center pt-2 pb-8">
                <button onClick={onHome}
                    className="flex items-center gap-2 bg-white/20 border border-white/30 text-white rounded-full px-6 py-3 font-outfit font-semibold btn-magnetic hover:bg-white/30 text-sm sm:text-base">
                    <Home size={18} /> Return to Dashboard
                </button>
            </div>
        </div>
    )
}

// ─── Main Sprint Page ─────────────────────────────────────────────────────
export default function SprintPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { gameState, completeDay, getQuestionsForDay } = useGame()

    // ── State ────────────────────────────────────────────────────────────────
    const [initialLoading, setInitialLoading] = useState(true)  // DB check in progress
    const [submitLoading, setSubmitLoading] = useState(false)    // Awaiting DB write
    const [submitError, setSubmitError] = useState(null)
    const [loadError, setLoadError] = useState(null)           // Question loading error

    const [studyDay, setStudyDay] = useState(1)           // DB-derived current study day
    const [alreadyDone, setAlreadyDone] = useState(false) // Has user submitted today?
    const [isWeeklyDay, setIsWeeklyDay] = useState(false) // Is this a journal day?

    const [phase, setPhase] = useState('intro')           // intro | question | results
    const [qIndex, setQIndex] = useState(0)
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
    const [selected, setSelected] = useState(null)
    const [confirmed, setConfirmed] = useState(false)
    const [results, setResults] = useState([])
    const [questions, setQuestions] = useState([])
    const [tier, setTier] = useState('easy')
    const [xpEarned, setXpEarned] = useState(0)

    const cardRef = useRef(null)
    const optionsRef = useRef(null)
    const timerRef = useRef(null)

    // ── Load questions helper ────────────────────────────────────────────────
    const loadQuestions = async (day) => {
        const { questions: qs, tier: t } = await getQuestionsForDay(day)
        if (!qs || qs.length === 0) {
            throw new Error('No questions available for today. Please check your database.')
        }
        setQuestions(qs)
        setTier(t)
        setLoadError(null)
        return { questions: qs, tier: t }
    }

    // ── On Mount: Check daily limit + derive study day ───────────────────────
    useEffect(() => {
        if (!user?.id) return

        async function checkDailyStatus() {
            const today = new Date().toISOString().split('T')[0]
            const localDoneKey = `nutrilearn_sprint_done_${user.id}`

            // ── Check local stamp first (works offline) ──────────────────
            if (localStorage.getItem(localDoneKey) === today) {
                setStudyDay(gameState?.currentDay ?? 1)
                setAlreadyDone(true)
                setInitialLoading(false)
                return
            }

            try {
                const [serverDay, todayResponse] = await Promise.all([
                    getStudyDay(user.id),
                    getTodayResponse(user.id),
                ])

                const day = Math.max(serverDay, gameState?.currentDay ?? 1)
                setStudyDay(day)

                // If it's a weekly day (7, 14, 21...) redirect to Growth Journal
                if (day % 7 === 0) {
                    const weeklyDone = await checkWeeklyLogSubmitted(user.id)
                    if (!weeklyDone) {
                        setIsWeeklyDay(true)
                        setInitialLoading(false)
                        return
                    }
                }

                // Load correct question set for this study day
                try {
                    await loadQuestions(day)
                } catch (qErr) {
                    console.error('[SprintPage] Question load error:', qErr)
                    setLoadError(qErr.message || 'Failed to load questions')
                }

                if (todayResponse) {
                    setAlreadyDone(true)
                }
            } catch (err) {
                console.error('[SprintPage] init error:', err)
                // Fallback to GameContext day if Supabase is unreachable
                const fallbackDay = gameState?.currentDay ?? 1
                setStudyDay(fallbackDay)
                try {
                    await loadQuestions(fallbackDay)
                } catch (e) {
                    console.error('Even fallback failed', e)
                    setLoadError(e.message || 'Failed to load questions')
                }
            } finally {
                setInitialLoading(false)
            }
        }

        checkDailyStatus()
    }, [user?.id, gameState?.currentDay])

    // ── GSAP: Animate question card when phase/index changes ─────────────────
    useEffect(() => {
        if (phase !== 'question' || !cardRef.current) return
        gsap.fromTo(cardRef.current,
            { opacity: 0, y: 20, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' }
        )
        if (optionsRef.current) {
            gsap.fromTo(
                optionsRef.current.querySelectorAll('.option-btn'),
                { opacity: 0, x: -14 },
                { opacity: 1, x: 0, stagger: 0.07, duration: 0.35, ease: 'power2.out', delay: 0.15 }
            )
        }
    }, [phase, qIndex])

    // ── Timer countdown ───────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'question' || confirmed) return
        if (timeLeft <= 0) { handleTimeout(); return }
        timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
        return () => clearTimeout(timerRef.current)
    }, [phase, timeLeft, confirmed])

    const handleTimeout = useCallback(() => {
        clearTimeout(timerRef.current)
        advance({ questionId: questions[qIndex]?.id, correct: false, timeExpired: true, selected: null })
    }, [questions, qIndex])

    const handleSelect = (idx) => { if (!confirmed) setSelected(idx) }

    const handleConfirm = () => {
        if (selected === null || confirmed) return
        clearTimeout(timerRef.current)
        const q = questions[qIndex]
        const isCorrect = selected === q.answer
        setConfirmed(true)
        setTimeout(() => advance({ questionId: q.id, correct: isCorrect, timeExpired: false, selected }), 900)
    }

    // ── Advance to next question OR submit to Supabase on final ──────────────
    const advance = async (result) => {
        const newResults = [...results, result]
        const isLast = qIndex + 1 >= questions.length

        if (isLast) {
            // ── Final question: save locally first, try Supabase in background ──
            const score = newResults.filter(r => r.correct).length
            const earned = score * 10
            setXpEarned(earned)
            setResults(newResults)
            setSubmitLoading(true)

            // Always save locally first — never block on DB
            completeDay(studyDay, newResults)

            // Write local date stamp so daily lock works even offline
            const today = new Date().toISOString().split('T')[0]
            localStorage.setItem(`nutrilearn_sprint_done_${user.id}`, today)

            // Attempt Supabase in background (non-blocking)
            submitQuizResponse({
                userId: user.id,
                dayNumber: studyDay,
                score,
                answers: newResults,
            }).catch((err) => {
                console.warn('[SprintPage] Supabase sync failed:', err?.message)
                setSubmitError('⚠️ Saved locally — database sync failed. Your score is recorded.')
            })

            // Show results immediately
            setAlreadyDone(true)
            setPhase('results')
            setSubmitLoading(false)
        } else {
            setResults(newResults)
            setQIndex(i => i + 1)
            setSelected(null)
            setConfirmed(false)
            setTimeLeft(QUESTION_TIME)
        }
    }

    const currentQuestion = questions[qIndex]
    const tierBadge = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }[tier] ?? 'Easy'

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="glass-card rounded-2xl px-8 py-6 flex items-center gap-3">
                    <Loader2 size={20} className="text-white/60 animate-spin" />
                    <p className="font-outfit text-sm text-white/60">Loading your sprint…</p>
                </div>
            </div>
        )
    }

    // ── Error loading questions ──────────────────────────────────────────────
    if (loadError || (questions.length === 0 && !alreadyDone && phase !== 'results')) {
        const handleRetry = async () => {
            setLoadError(null)
            setInitialLoading(true)
            try {
                await loadQuestions(studyDay)
            } catch (e) {
                console.error('[SprintPage] Retry failed:', e)
                setLoadError(e.message || 'Failed to load questions')
            } finally {
                setInitialLoading(false)
            }
        }

        return (
            <div className="min-h-screen flex items-center justify-center px-4 pt-20">
                <div className="glass-card rounded-3xl p-8 sm:p-10 max-w-sm w-full text-center">
                    <XCircle size={48} className="mx-auto mb-4 text-[#FF8C00]" />
                    <h2 className="font-caveat text-3xl font-bold text-white mb-2">
                        Couldn&apos;t Load Questions
                    </h2>
                    <p className="font-outfit text-sm text-white/50 mb-6">
                        {loadError || 'No questions were found for today. This could be a temporary issue.'}
                    </p>
                    <button onClick={handleRetry}
                        className="w-full flex items-center justify-center gap-2 text-white rounded-full px-6 py-3 font-outfit font-semibold btn-magnetic border border-white/20 text-sm mb-3"
                        style={{ background: 'linear-gradient(135deg, #FF8C00, #FFB347)', boxShadow: '0 0 24px rgba(255,140,0,0.4)' }}>
                        🔄 Retry Loading
                    </button>
                    <button onClick={() => navigate('/dashboard')}
                        className="w-full bg-white/20 border border-white/30 text-white rounded-full px-6 py-3 font-outfit font-semibold btn-magnetic hover:bg-white/30 text-sm">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    // ── Weekly day → redirect to Growth Journal ─────────────────────────────
    if (isWeeklyDay) {
        navigate('/weekly-log', { replace: true })
        return null
    }

    // ── Already done today — LOCKED ──────────────────────────────────────────
    if (alreadyDone && phase !== 'results') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 pt-20">
                <div className="glass-card rounded-3xl p-8 sm:p-10 max-w-sm w-full text-center">
                    <Award size={48} className="mx-auto mb-4" style={{ color: '#FF8C00' }} />
                    <h2 className="font-caveat text-3xl font-bold text-white mb-2">
                        Today&apos;s sprint is complete.
                    </h2>
                    <p className="font-caveat italic text-xl text-white/60 mb-1">Well done.</p>
                    <p className="font-outfit text-sm text-white/50 mb-6">
                        Come back tomorrow for Day {studyDay + 1}!
                    </p>
                    <button onClick={() => navigate('/dashboard')}
                        className="bg-white/20 border border-white/30 text-white rounded-full px-6 py-3 font-outfit font-semibold btn-magnetic hover:bg-white/30 w-full text-sm">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    // ── Intro screen ─────────────────────────────────────────────────────────
    if (phase === 'intro') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-8">
                <div className="glass-card rounded-3xl p-7 sm:p-10 max-w-sm w-full text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 font-mono text-xs bg-white/15 border border-white/25 text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8C00] animate-pulse" />
                            {tierBadge} Tier · Day {studyDay}
                        </div>
                        <h2 className="font-caveat text-4xl font-bold text-white mb-1">Daily Sprint</h2>
                        <p className="font-caveat italic text-xl text-white/60 mb-1">5 questions · 30 seconds each</p>
                        <p className="font-mono text-xs text-white/40 mb-7">+10 XP per correct · Hard timer cutoff</p>

                        <div className="grid grid-cols-3 gap-2 mb-7">
                            {[
                                { label: 'Questions', value: '5', icon: '📋' },
                                { label: 'Time Each', value: '30s', icon: '⏱' },
                                { label: 'XP Max', value: '50', icon: '⚡' },
                            ].map(item => (
                                <div key={item.label} className="bg-white/10 border border-white/15 rounded-xl p-2.5 text-center">
                                    <div className="text-xl mb-0.5">{item.icon}</div>
                                    <div className="font-mono text-base font-bold text-white">{item.value}</div>
                                    <div className="font-mono text-[9px] text-white/40 uppercase tracking-wider">{item.label}</div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => { setPhase('question'); setTimeLeft(QUESTION_TIME) }}
                            className="w-full text-white rounded-full py-4 font-outfit font-bold text-base btn-magnetic flex items-center justify-center gap-2 border border-white/20 touch-target"
                            style={{ background: 'linear-gradient(135deg, #FF8C00, #FFB347)', boxShadow: '0 0 24px rgba(255,140,0,0.4)' }}
                        >
                            Begin Sprint <ChevronRight size={20} />
                        </button>
                        <button onClick={() => navigate('/dashboard')}
                            className="mt-3 w-full text-white/40 hover:text-white text-sm py-2 transition-colors font-outfit">
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ── Results screen ────────────────────────────────────────────────────────
    if (phase === 'results') {
        return (
            <div className="min-h-screen pt-20 pb-4 px-4">
                <ResultsScreen
                    results={results}
                    questions={questions}
                    xpEarned={xpEarned}
                    day={studyDay}
                    onHome={() => navigate('/dashboard')}
                />
            </div>
        )
    }

    // ── Question screen ───────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col items-center justify-start pt-20 pb-6 px-4">
            <div ref={cardRef} className="w-full max-w-2xl">

                {/* Progress + Timer header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: 5 }, (_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i < results.length ? (results[i].correct ? 'bg-emerald-400 w-7' : 'bg-[#FF8C00] w-7') : i === qIndex ? 'bg-white/50 w-7' : 'bg-white/15 w-5'}`} />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap size={13} style={{ color: '#FF8C00' }} />
                        <span className="font-mono text-xs text-white/60">{results.filter(r => r.correct).length * 10} XP</span>
                        <span className="text-white/20 mx-0.5 text-xs">·</span>
                        <Clock size={13} className={timeLeft <= 5 ? 'text-red-400' : 'text-white/40'} />
                        <span className={`font-mono text-sm font-bold ${timeLeft <= 5 ? 'countdown-danger' : timeLeft <= 10 ? 'text-[#FF8C00]' : 'text-white/60'}`}>
                            {timeLeft}s
                        </span>
                    </div>
                </div>

                {/* Timer bar */}
                <div className="mb-5"><TimerBar timeLeft={timeLeft} /></div>

                {/* Question card */}
                <div className="glass-card rounded-3xl p-5 sm:p-8">
                    <div className="flex items-center justify-between mb-5">
                        <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                            Q{qIndex + 1} of 5
                        </span>
                        <span className="font-mono text-[11px] uppercase px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white">
                            {tierBadge} · Day {studyDay}
                        </span>
                    </div>

                    {currentQuestion && (
                        <>
                            <h2 className="font-caveat text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug mb-6">
                                {currentQuestion.question}
                            </h2>

                            <div ref={optionsRef} className="space-y-2.5">
                                {currentQuestion.options.map((opt, idx) => {
                                    let cls = 'border-white/15 bg-white/8 hover:border-white/35 hover:bg-white/15'
                                    if (confirmed) {
                                        if (idx === currentQuestion.answer) cls = 'border-emerald-400/60 bg-emerald-400/15 text-emerald-200'
                                        else if (idx === selected && idx !== currentQuestion.answer) cls = 'border-[#FF8C00]/60 bg-[#FF8C00]/15 text-[#FF8C00]'
                                        else cls = 'border-white/10 bg-white/5 opacity-40'
                                    } else if (selected === idx) {
                                        cls = 'border-white/50 bg-white/20'
                                    }
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelect(idx)}
                                            disabled={confirmed || submitLoading}
                                            className={`option-btn w-full text-left rounded-xl border-2 px-4 py-3.5 font-outfit text-sm font-medium transition-all duration-200 text-white cursor-pointer active:scale-98 ${cls}`}
                                            style={{ minHeight: '48px' }}
                                        >
                                            <span className="font-mono text-xs text-white/30 mr-2">{String.fromCharCode(65 + idx)}.</span>
                                            {opt}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Submit error */}
                            {submitError && (
                                <div className="mt-4 rounded-xl px-4 py-3 bg-[#FF8C00]/15 border border-[#FF8C00]/30 text-[#FF8C00] text-sm font-outfit">
                                    {submitError}
                                </div>
                            )}

                            <div className="mt-5 flex justify-end">
                                {submitLoading ? (
                                    <div className="flex items-center gap-2 text-white/50 font-mono text-sm">
                                        <Loader2 size={16} className="animate-spin" />
                                        Saving your response…
                                    </div>
                                ) : !confirmed ? (
                                    <button
                                        onClick={handleConfirm}
                                        disabled={selected === null}
                                        className="flex items-center gap-2 text-white rounded-full px-5 py-3 font-outfit font-semibold btn-magnetic disabled:opacity-30 disabled:cursor-not-allowed border border-white/20 text-sm"
                                        style={{ background: selected !== null ? 'linear-gradient(135deg,#FF8C00,#FFB347)' : 'rgba(255,255,255,0.1)' }}
                                    >
                                        {qIndex + 1 === 5 ? 'Submit Sprint' : 'Confirm Answer'} <ChevronRight size={16} />
                                    </button>
                                ) : (
                                    <p className="text-sm font-mono text-white/40 animate-pulse">Moving on…</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
