'use strict'
const { query } = require('../dbClient')

const MAX_RETRIES = 3
const BASE_DELAY_MS = 100

/**
 * @typedef Question
 * @property {number} section_id - Numeric ID of the section.
 * @property {string} question_text - Text of the question.
 * @property {string[]} answers - Array of answer texts.
 * @property {number} correct_answer - Index of the correct answer.
 */

/**
 * Netlify Function to upload questions to the database.
 *
 * Expects:
 *  - Authorization header: Bearer <UPLOAD_SECRET>
 *  - JSON body: Array<Question>
 *
 * Success (200):
 *  { message: string, count: number, ids: number[] }
 *
 * Errors:
 *  400: Invalid request
 *  401: Unauthorized
 *  405: Method Not Allowed
 *  500: Internal Server Error or configuration missing
 */
async function retryQuery(text, params = []) {
  let lastError
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await query(text, params)
      return res
    } catch (err) {
      lastError = err
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1)
      console.warn(`Query attempt ${attempt} failed; retrying in ${delay}ms`, { text, params, error: err.message })
      await new Promise(r => setTimeout(r, delay))
    }
  }
  console.error('All query attempts failed', lastError)
  throw lastError
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  }

  // Validate required environment variables
  const missingEnv = []
  if (!process.env.DATABASE_URL) missingEnv.push('DATABASE_URL')
  if (!process.env.NETLIFY_ENV) missingEnv.push('NETLIFY_ENV')
  if (!process.env.NODE_ENV) missingEnv.push('NODE_ENV')
  if (missingEnv.length > 0) {
    console.error('Server configuration error: missing env vars', missingEnv)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error' })
    }
  }

  console.info('uploadQuestionsFunction invoked', { method: event.httpMethod })

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers }
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  const authHeader = event.headers.authorization || event.headers.Authorization
  if (!authHeader || authHeader !== `Bearer ${process.env.UPLOAD_SECRET}`) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  let payload
  try {
    payload = JSON.parse(event.body)
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON payload' })
    }
  }

  if (!Array.isArray(payload) || payload.length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Payload must be a non-empty array' })
    }
  }

  const requiredFields = ['section_id', 'question_text', 'answers', 'correct_answer']
  for (let i = 0; i < payload.length; i++) {
    const q = payload[i]
    for (const field of requiredFields) {
      if (!(field in q)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Question at index ${i} missing field ${field}` })
        }
      }
    }
    if (!Array.isArray(q.answers) || q.answers.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Question at index ${i} must have at least two answers` })
      }
    }
    if (typeof q.section_id !== 'number') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `section_id must be a number at index ${i}` })
      }
    }
    if (typeof q.question_text !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `question_text must be a string at index ${i}` })
      }
    }
    if (typeof q.correct_answer !== 'number' || q.correct_answer < 0 || q.correct_answer >= q.answers.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `correct_answer index out of range at index ${i}` })
      }
    }
  }

  try {
    console.info('Beginning transaction')
    await retryQuery('BEGIN')

    const insertedIds = []
    for (const q of payload) {
      const { section_id, question_text, correct_answer, answers } = q
      console.info('Inserting question', { section_id, question_text })
      const res = await retryQuery(
        'INSERT INTO questions (section_id, question_text, correct_answer) VALUES ($1, $2, $3) RETURNING id',
        [section_id, question_text, correct_answer]
      )
      const questionId = res.rows[0].id
      insertedIds.push(questionId)
      for (let idx = 0; idx < answers.length; idx++) {
        const answerText = answers[idx]
        console.info('Inserting answer', { questionId, answerText, is_correct: idx === correct_answer })
        await retryQuery(
          'INSERT INTO answers (question_id, answer_text, is_correct) VALUES ($1, $2, $3)',
          [questionId, answerText, idx === correct_answer]
        )
      }
    }

    console.info('Committing transaction')
    await retryQuery('COMMIT')

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Questions uploaded successfully',
        count: insertedIds.length,
        ids: insertedIds
      })
    }
  } catch (err) {
    console.error('UploadQuestionsFunction error:', err)
    try {
      console.info('Rolling back transaction')
      await retryQuery('ROLLBACK')
    } catch (e) {
      console.error('Rollback failed:', e)
    }
    await disconnect()
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    }
  }
}