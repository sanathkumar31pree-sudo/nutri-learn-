import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { fetchQuestionsForDay } from '../lib/quizService'

const TIER_MAP = {
    easy: { min: 1, max: 30 },
    medium: { min: 31, max: 60 },
    hard: { min: 61, max: 90 },
}

// Ensure the signature stays the same for dependent components
export async function getQuestionsForDay(day) {
    return await fetchQuestionsForDay(day);
}

export function GameProvider({ children }) {
    const { user } = useAuth()
    const [gameState, setGameState] = useState(null)

    const storageKey = user ? `nutrilearn_game_${user.id}` : null

    useEffect(() => {
        if (!storageKey) { setGameState(null); return }
        const stored = localStorage.getItem(storageKey)
        if (stored) {
            let state = JSON.parse(stored)
            // Check if streak was broken before loading
            if (state.lastCompletedDay && state.completedDays && state.completedDays[state.lastCompletedDay]) {
                const lastDateStr = state.completedDays[state.lastCompletedDay].completedAt
                if (lastDateStr) {
                    const todayDate = new Date(new Date().toISOString().split('T')[0])
                    const lastDate = new Date(lastDateStr)
                    const diffTime = todayDate - lastDate
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
                    if (diffDays > 1 && state.streak > 0) {
                        state.streak = 0
                        localStorage.setItem(storageKey, JSON.stringify(state))
                    }
                }
            }
            setGameState(state)
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

            if (lastDay === null) {
                streak = 1
            } else {
                const lastDateStr = prev.completedDays[lastDay]?.completedAt
                if (lastDateStr) {
                    const todayDate = new Date(today)
                    const lastDate = new Date(lastDateStr)
                    const diffTime = todayDate - lastDate
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

                    if (diffDays === 1) {
                        streak += 1
                    } else if (diffDays === 0) {
                        // already submitted today (shouldn't happen, but just in case keeping streak same)
                    } else {
                        streak = 1
                    }
                } else {
                    // Fallback to old behavior if no completedAt
                    if (dayNumber === lastDay + 1) streak += 1
                    else streak = 1
                }
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
