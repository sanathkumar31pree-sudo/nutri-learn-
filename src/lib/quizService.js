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

    // Calculate which "week" and day within the tier this is to get a deterministic slice
    // Assuming 'quizzes' table has columns: question, option_a, option_b, option_c, option_d, correct_answer, difficulty
    // We fetch all questions for the tier and slice, or we can order them and paginate.
    // Let's fetch all for the tier, sort by id, and pick 5 to match the old logic.
    const { data: allTierQuestions, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('difficulty', tier)
        .order('id', { ascending: true }) // ensure deterministic order

    if (error) {
        console.error('[quizService] fetchQuestionsForDay error:', error.message)
        throw error
    }

    if (!allTierQuestions || allTierQuestions.length === 0) {
        console.warn(`[quizService] No questions found for tier: ${tier}`)
        return { questions: [], tier }
    }

    // Day within the tier (1-indexed within each tier)
    const tierDay = tier === 'easy' ? day - 1
        : tier === 'medium' ? day - 31
            : day - 61

    // Use deterministic slice of 5 questions per day
    const start = (tierDay * 5) % allTierQuestions.length
    const questions = []

    // Format the database rows to match the expected format in GameContext/Quiz components
    for (let i = 0; i < 5; i++) {
        const qRow = allTierQuestions[(start + i) % allTierQuestions.length]

        let answerIndex = 0;
        if (qRow.correct_answer === qRow.option_b) answerIndex = 1;
        if (qRow.correct_answer === qRow.option_c) answerIndex = 2;
        if (qRow.correct_answer === qRow.option_d) answerIndex = 3;

        questions.push({
            id: qRow.id,
            question: qRow.question,
            options: [qRow.option_a, qRow.option_b, qRow.option_c, qRow.option_d],
            answer: answerIndex,
            explanation: `Correct answer: ${qRow.correct_answer}.` // fallback explanation since db doesn't have it
        })
    }

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
