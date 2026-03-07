import { supabase } from './supabase'

/**
 * Get today's quiz response for this user.
 * Returns: { id, day_number, score, answers } or null if not submitted today.
 */
export async function getTodayResponse(userId) {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    const { data, error } = await supabase
        .from('quiz_responses')
        .select('id, day_number, score, answers')
        .eq('user_id', userId)
        .eq('study_date', today)
        .maybeSingle()

    if (error) {
        console.error('[quizService] getTodayResponse error:', error.message)
        return null
    }
    return data // null = not submitted today, object = already done
}

/**
 * Fetch questions from the Supabase 'quizzes' table for a specific day.
 * It determines the tier based on the day (1-30: easy, 31-60: medium, 61-90: hard)
 * and fetches 5 questions for that day.
 */
export async function fetchQuestionsForDay(day) {
    let tier = 'easy'
    if (day >= 31 && day <= 60) tier = 'medium'
    else if (day >= 61 && day <= 90) tier = 'hard'

    console.log(`[quizService] Fetching questions for day ${day}, tier: ${tier}`)

    // Try fetching with difficulty filter first (case-insensitive via ilike)
    let allTierQuestions = null
    let error = null

    // Try exact match first
    const res1 = await supabase
        .from('quizzes')
        .select('*')
        .eq('difficulty', tier)
        .order('week', { ascending: true })
        .order('question', { ascending: true })

    if (res1.error) {
        console.warn('[quizService] exact difficulty match error:', res1.error.message)
    } else {
        allTierQuestions = res1.data
    }

    // If exact match returned nothing, try case-insensitive match
    if (!allTierQuestions || allTierQuestions.length === 0) {
        console.log('[quizService] No results with exact match, trying case-insensitive...')
        const res2 = await supabase
            .from('quizzes')
            .select('*')
            .ilike('difficulty', tier)
            .order('week', { ascending: true })
            .order('question', { ascending: true })

        if (!res2.error && res2.data && res2.data.length > 0) {
            allTierQuestions = res2.data
            console.log(`[quizService] Found ${allTierQuestions.length} questions with ilike`)
        }
    }

    // If still nothing, fetch ALL questions without difficulty filter
    if (!allTierQuestions || allTierQuestions.length === 0) {
        console.log('[quizService] No tier-filtered results, fetching ALL questions as fallback...')
        const res3 = await supabase
            .from('quizzes')
            .select('*')
            .order('week', { ascending: true })
            .order('question', { ascending: true })

        if (res3.error) {
            console.error('[quizService] fetchQuestionsForDay error:', res3.error.message)
            throw res3.error
        }

        allTierQuestions = res3.data
        console.log(`[quizService] Fetched ${allTierQuestions?.length ?? 0} total questions (no tier filter)`)
    }

    if (!allTierQuestions || allTierQuestions.length === 0) {
        console.warn(`[quizService] No questions found at all in the quizzes table`)
        return { questions: [], tier }
    }

    // Day within the tier (0-indexed within each tier)
    const tierDay = tier === 'easy' ? day - 1
        : tier === 'medium' ? day - 31
            : day - 61

    // Use deterministic slice of 5 questions per day
    const start = (tierDay * 5) % allTierQuestions.length
    const questions = []

    // Format the database rows to match the expected format in GameContext/Quiz components
    for (let i = 0; i < 5; i++) {
        const qRow = allTierQuestions[(start + i) % allTierQuestions.length]

        // Determine which option matches the correct answer
        let answerIndex = 0
        const correctAns = (qRow.correct_answer || '').trim().toLowerCase()
        if (correctAns === (qRow.option_b || '').trim().toLowerCase()) answerIndex = 1
        else if (correctAns === (qRow.option_c || '').trim().toLowerCase()) answerIndex = 2
        else if (correctAns === (qRow.option_d || '').trim().toLowerCase()) answerIndex = 3

        questions.push({
            id: `q_${start + i}`,
            question: qRow.question,
            options: [qRow.option_a, qRow.option_b, qRow.option_c, qRow.option_d],
            answer: answerIndex,
            explanation: qRow.explanation || `Correct answer: ${qRow.correct_answer}.`
        })
    }

    console.log(`[quizService] Returning ${questions.length} questions for day ${day}`)
    return { questions, tier }
}

/**
 * Get the current study day for this user.
 * = max day_number they have submitted + 1
 */
export async function getStudyDay(userId) {
    const { data, error } = await supabase
        .from('quiz_responses')
        .select('day_number')
        .eq('user_id', userId)
        .order('day_number', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
        console.error('[quizService] getStudyDay error:', error.message)
        return 1 // fallback to day 1
    }
    return Math.min((data?.day_number ?? 0) + 1, 90) // cap at day 90
}

/**
 * Submit the completed quiz response to Supabase.
 * Throws on DB error so the caller can handle it.
 */
export async function submitQuizResponse({ userId, dayNumber, score, answers }) {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('quiz_responses')
        .insert({
            user_id: userId,
            day_number: dayNumber,
            score,
            answers, // JSONB — array of { questionId, correct, selected, timeExpired }
            study_date: today,
        })
        .select()
        .single()

    if (error) {
        console.error('[quizService] submitQuizResponse error:', error.message)
        throw error
    }
    return data
}

// ─── Weekly Log ───────────────────────────────────────────────────────────────

/**
 * Check if the user has already submitted a weekly log this week.
 * Returns the row or null.
 */
export async function checkWeeklyLogSubmitted(userId) {
    // Get start of current ISO week (Monday)
    const now = new Date()
    const day = now.getDay() // 0=Sun
    const diff = (day === 0 ? -6 : 1 - day)
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    const weekStart = monday.toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('weekly_behavioral_logs')
        .select('id, week_start_date')
        .eq('user_id', userId)
        .eq('week_start_date', weekStart)
        .maybeSingle()

    if (error) {
        console.error('[quizService] checkWeeklyLogSubmitted error:', error.message)
        return null
    }
    return data
}

/**
 * Submit the weekly behavioral log to Supabase.
 */
export async function submitWeeklyLog({ userId, water, fruits, processed, sleep, activity, eating_outside }) {
    const now = new Date()
    const day = now.getDay()
    const diff = (day === 0 ? -6 : 1 - day)
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    const weekStart = monday.toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('weekly_behavioral_logs')
        .insert({
            user_id: userId,
            week_start_date: weekStart,
            water,
            fruits,
            processed,
            sleep,
            activity,
            eating_outside,
        })
        .select()
        .single()

    if (error) {
        console.error('[quizService] submitWeeklyLog error:', error.message)
        throw error
    }
    return data
}
