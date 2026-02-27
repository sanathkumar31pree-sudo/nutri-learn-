import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import questionsData from '../data/questions.json'

const GameContext = createContext(null)

const TIER_MAP = {
    easy: { min: 1, max: 30 },
    medium: { min: 31, max: 60 },
    hard: { min: 61, max: 90 },
}

export function getQuestionsForDay(day) {
    let tier = 'easy'
    if (day >= 31 && day <= 60) tier = 'medium'
    else if (day >= 61 && day <= 90) tier = 'hard'

    const pool = questionsData[tier]
    // Day within the tier (1-indexed within each tier)
    const tierDay = tier === 'easy' ? day - 1
        : tier === 'medium' ? day - 31
            : day - 61

    // Use deterministic slice of 5 questions per day (cycling within 30 questions)
    const start = (tierDay * 5) % pool.length
    const questions = []
    for (let i = 0; i < 5; i++) {
        questions.push(pool[(start + i) % pool.length])
    }
    return { questions, tier }
}

export function GameProvider({ children }) {
    const { user } = useAuth()
    const [gameState, setGameState] = useState(null)

    const storageKey = user ? `nutrilearn_game_${user.id}` : null

    useEffect(() => {
        if (!storageKey) { setGameState(null); return }
        const stored = localStorage.getItem(storageKey)
        if (stored) {
            setGameState(JSON.parse(stored))
        } else {
            // Initialize fresh game state
            const fresh = {
                userId: user.id,
                currentDay: 1,
                xp: 0,
                streak: 0,
                lastCompletedDay: null,
                completedDays: {},
                notificationTime: '08:00',
                notificationsEnabled: true,
            }
            localStorage.setItem(storageKey, JSON.stringify(fresh))
            setGameState(fresh)
        }
    }, [storageKey])

    const saveState = useCallback((updates) => {
        setGameState(prev => {
            const next = { ...prev, ...updates }
            localStorage.setItem(storageKey, JSON.stringify(next))
            return next
        })
    }, [storageKey])

    const completeDay = useCallback((dayNumber, results) => {
        // results: array of { questionId, correct, timeExpired }
        const correctCount = results.filter(r => r.correct).length
        const xpEarned = correctCount * 10

        setGameState(prev => {
            const today = new Date().toISOString().split('T')[0]
            const completedDays = { ...prev.completedDays, [dayNumber]: { results, xpEarned, completedAt: today } }

            // Streak logic
            let streak = prev.streak
            const lastDay = prev.lastCompletedDay
            if (lastDay === null || dayNumber === lastDay + 1) {
                streak += 1
            } else if (dayNumber > lastDay + 1) {
                streak = 1 // broken streak
            }

            const next = {
                ...prev,
                xp: prev.xp + xpEarned,
                streak,
                lastCompletedDay: dayNumber,
                currentDay: Math.min(90, Math.max(prev.currentDay, dayNumber + 1)),
                completedDays,
            }
            localStorage.setItem(storageKey, JSON.stringify(next))
            return next
        })
    }, [storageKey])

    const buyBack = useCallback((dayNumber) => {
        setGameState(prev => {
            if (prev.xp < 100) throw new Error('Insufficient XP for buyback.')
            const completedDays = {
                ...prev.completedDays,
                [dayNumber]: { ...prev.completedDays[dayNumber], boughtBack: true }
            }
            const next = { ...prev, xp: prev.xp - 100, completedDays }
            localStorage.setItem(storageKey, JSON.stringify(next))
            return next
        })
    }, [storageKey])

    const updateNotifications = useCallback((time, enabled) => {
        saveState({ notificationTime: time, notificationsEnabled: enabled })
    }, [saveState])

    return (
        <GameContext.Provider value={{ gameState, completeDay, buyBack, updateNotifications, getQuestionsForDay }}>
            {children}
        </GameContext.Provider>
    )
}

export const useGame = () => {
    const ctx = useContext(GameContext)
    if (!ctx) throw new Error('useGame must be used inside GameProvider')
    return ctx
}
