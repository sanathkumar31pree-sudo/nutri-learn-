import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY)

async function run() {
    const { data, error } = await supabase.from('quizzes').select('*').limit(1)
    if (error) {
        console.log('ERROR:', error.message)
    } else {
        console.log('COLUMNS:', Object.keys(data[0]))
        console.log('SAMPLE ROW:', JSON.stringify(data[0], null, 2))
    }
}
run()
