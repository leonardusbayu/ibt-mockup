import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'

export let retryFetchResults

const ResultsPage = () => {
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const fetchResults = () => {
    setIsLoading(true)
    setIsError(false)
    window.dispatchEvent(new CustomEvent('results:fetchRequest'))
    fetch('/.netlify/functions/fetchquestions?type=results')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok')
        return res.json()
      })
      .then(data => {
        setResults(data)
        setIsLoading(false)
        window.dispatchEvent(new CustomEvent('results:fetchSuccess', { detail: data }))
      })
      .catch(error => {
        setIsError(true)
        setIsLoading(false)
        window.dispatchEvent(new CustomEvent('results:fetchFailure', { detail: error }))
      })
  }

  // expose retry for tests/hooks
  retryFetchResults = fetchResults

  useEffect(() => {
    fetchResults()
  }, [])

  return (
    <>
      <Helmet>
        <title>TOEFL iBT Practice Test Results</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="View your TOEFL iBT practice test results and detailed analytics." />
        <link rel="canonical" href={window.location.href} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/styles/main.css" />
        <link rel="stylesheet" href="/styles/results.css" />
      </Helmet>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <section id="results-container" className={`two-column-grid ${isLoading ? 'is-loading' : ''} ${isError ? 'is-error' : ''}`}>
        {isLoading && <div className="loading" role="status" aria-live="polite">Loading results...</div>}
        {isError && <div id="error-message" className="error" role="alert" aria-live="assertive">Failed to load results. Please try again later.</div>}
        {results && (
          <main id="main-content">
            <header>
              <h1>Results Summary</h1>
            </header>
            <section aria-labelledby="overview-heading" className="results-overview">
              <h2 id="overview-heading">Overview</h2>
              <ul className="overview-cards" role="list">
                <li className="overview-card" data-testid="total-score-card">
                  <h3>Total Score</h3>
                  <p>{results.totalScore}</p>
                </li>
                {results.sectionScores.map(sec => (
                  <li key={sec.section} className="overview-card" data-testid={`overview-${sec.section}`}>
                    <h3>{sec.section}</h3>
                    <p>{sec.score}</p>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="breakdown-heading" className="results-breakdown">
              <h2 id="breakdown-heading">Section Breakdown</h2>
              <table id="results-table" role="table">
                <thead>
                  <tr>
                    <th scope="col">Section</th>
                    <th scope="col">Score</th>
                    <th scope="col">Time Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {results.sectionScores.map(sec => (
                    <tr key={sec.section} data-testid={`breakdown-${sec.section}`}>
                      <td>{sec.section}</td>
                      <td>{sec.score}</td>
                      <td>{sec.timeTaken}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section aria-labelledby="review-heading" className="answer-review-section">
              <h2 id="review-heading">Answer Review</h2>
              {results.sectionScores.map(sec => (
                <div key={sec.section} className="section-review">
                  <h3>{sec.section} Review</h3>
                  <ul className="questions-list" role="list">
                    {sec.questions.map((q, idx) => (
                      <li key={q.id} className="question-item" role="listitem" data-testid={`question-${q.id}`}>
                        <details>
                          <summary>
                            Question {idx + 1}: {q.questionText}
                          </summary>
                          <div className="answer-details">
                            <p><strong>Your Answer:</strong> {q.userAnswer}</p>
                            <p><strong>Correct Answer:</strong> {q.correctAnswer}</p>
                            <p><strong>Result:</strong> {q.isCorrect ? 'Correct' : 'Incorrect'}</p>
                          </div>
                        </details>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          </main>
        )}
      </section>
      <script defer src="/scripts/utils.js"></script>
      <script defer src="/scripts/resultspage.js"></script>
    </>
  )
}

export default ResultsPage