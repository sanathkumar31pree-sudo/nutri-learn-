const { createClient } = require('c:/Users/sanat/nutri learn/node_modules/@supabase/supabase-js/dist/main/index.cjs')
const fs = require('fs')

const envContent = fs.readFileSync('c:/Users/sanat/nutri learn/.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=')
    if (key && val.length) env[key.trim()] = val.join('=').trim()
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

async function run() {
    const { data, error } = await supabase.from('quizzes').select('*').limit(1)
    if (error) {
        console.log('ERROR:', error.message)
    } else if (!data || data.length === 0) {
        console.log('NO DATA in quizzes table')
    } else {
        console.log('COLUMNS:', Object.keys(data[0]).join(', '))
        console.log('SAMPLE:', JSON.stringify(data[0], null, 2))
    }
}
run()
