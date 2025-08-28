const { query } = require('../dbClient')
const jwt = require('jsonwebtoken')

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 500

function sanitizeInteger(value) {
  const v = parseInt(value, 10)
  return isNaN(v) ? null : v
}

/**
 * Netlify Function to fetch questions from database.
 * Supports optional filters: section, category, difficulty, amount.
 */
exports.handler = async (event, context) => {
  // CORS preflight support
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: ''
    }
  }
  // Only GET allowed
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        Allow: 'GET,OPTIONS',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }
  // Auth validation
  const authHeader = event.headers.authorization || event.headers.Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }
  const token = authHeader.split(' ')[1]
  try {
    jwt.verify(token, process.env.JWT_SECRET)
  } catch (err) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  console.log('FetchQuestionsFunction invoked with query:', event.queryStringParameters)
  const params = event.queryStringParameters || {}
  const sectionFilter = sanitizeInteger(params.section)
  const amountFilter = sanitizeInteger(params.amount)
  // Validate numeric parameters
  if ((params.section !== undefined && sectionFilter === null) ||
      (params.amount !== undefined && amountFilter === null)) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({ error: 'Invalid query parameters' })
    }
  }
  const categoryFilter = params.category ? params.category.trim() : null
  const difficultyFilter = params.difficulty ? params.difficulty.trim() : null

  const whereClauses = []
  const values = []
  let idx = 1
  if (sectionFilter !== null) {
    whereClauses.push(`section = $${idx++}`)
    values.push(sectionFilter)
  }
  if (categoryFilter) {
    whereClauses.push(`category = $${idx++}`)
    values.push(categoryFilter)
  }
  if (difficultyFilter) {
    whereClauses.push(`difficulty = $${idx++}`)
    values.push(difficultyFilter)
  }
  const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : ''
  const limitSQL = amountFilter !== null ? `LIMIT ${amountFilter}` : ''
  const sql = `
    SELECT id, section, question_text AS text, options, media_url, difficulty, category
    FROM questions
    ${whereSQL}
    ORDER BY id
    ${limitSQL}
  `

  let rows
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await query(sql, values)
      rows = res.rows
      break
    } catch (err) {
      console.error('DB query error attempt', attempt, err)
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)))
        continue
      } else {
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          },
          body: JSON.stringify({ error: 'Internal Server Error' })
        }
      }
    }
  }

  const sectionsMap = {}
  rows.forEach(row => {
    const key = row.section
    if (!sectionsMap[key]) {
      sectionsMap[key] = { section: key, questions: [] }
    }
    sectionsMap[key].questions.push({
      id: row.id,
      text: row.text,
      options: row.options,
      media_url: row.media_url,
      difficulty: row.difficulty,
      category: row.category
    })
  })
  const sections = Object.values(sectionsMap)

  console.log(`Fetched ${rows.length} questions across ${sections.length} sections`)
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: JSON.stringify({ sections })
  }
}