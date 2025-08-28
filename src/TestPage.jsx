import React, { useEffect, useState, useCallback } from 'react'
import { Helmet } from 'react-helmet'
import TimerComponent from './TimerComponent'
import { useAuth } from './AuthContext.js'

export let retryFetchQuestions

export default function TestPage() {
  const { authState } = useAuth()
  const [sections, setSections] = useState([])
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isTestComplete, setIsTestComplete] = useState(false)

  const fetchData = async () => {
    document.dispatchEvent(new CustomEvent('questions:fetchRequest'))
    setIsLoading(true)
    setIsError(false)
    try {
      const res = await fetch('/.netlify/functions/fetchquestions')
      if (!res.ok) throw new Error('Network response was not ok')
      const data = await res.json()
      setSections(data.sections || [])
      setCurrentSectionIndex(0)
      setCurrentQuestionIndex(0)
      setIsLoading(false)
      document.dispatchEvent(new CustomEvent('questions:fetchSuccess'))
    } catch (err) {
      setIsError(true)
      setIsLoading(false)
      document.dispatchEvent(new CustomEvent('questions:fetchFailure'))
    }
  }

  const retryFetchQuestionsCallback = useCallback(() => {
    fetchData();
  }, []);

  useEffect(() => {
    retryFetchQuestions = retryFetchQuestionsCallback;
    fetchData();
    return () => {
      retryFetchQuestions = null;
    };
  }, [fetchData, retryFetchQuestionsCallback]);

  const handleNextQuestion = () => {
    const section = sections[currentSectionIndex]
    if (currentQuestionIndex < section.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1)
      setCurrentQuestionIndex(0)
    } else {
      setIsTestComplete(true)
    }
  }

  const handleTimerComplete = () => {
    document.dispatchEvent(new CustomEvent('timer:completed', { detail: { sectionIndex: currentSectionIndex } }))
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1)
      setCurrentQuestionIndex(0)
    } else {
      setIsTestComplete(true)
    }
  }

  if (!authState.user) return null

  return (
    <>
      <Helmet>
        <title>TOEFL iBT Practice Test</title>
        <meta name="description" content="Full-length TOEFL iBT practice test with authentic questions and timers." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://www.yoursite.com/test" />
        <link rel="preconnect" href="https://fonts.googleapis.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/css/testpage.css" />
      </Helmet>
      <a href="#test-container" className="skip-link">Skip to test content</a>
      <main>
        <section
          id="test-container"
          className={isLoading ? 'is-loading' : ''}
          role="region"
          aria-labelledby="section-title"
        >
          {isLoading && (
            <div role="status" aria-live="polite" className="loading-state">Loading test...</div>
          )}
          {isError && (
            <div id="error-message" role="alert" aria-live="assertive" className="error-state is-error">
              <p>Failed to load questions.</p>
              <button id="retry-button" onClick={retryFetchQuestions}>Retry</button>
            </div>
          )}
          {!isLoading && !isError && isTestComplete && (
            <div className="test-complete" role="region" aria-labelledby="test-complete-heading">
              <h2 id="test-complete-heading">Test Complete</h2>
              <p>Thank you for completing the test. Your responses have been recorded.</p>
            </div>
          )}
          {!isLoading && !isError && !isTestComplete && sections.length > 0 && (
            <div className="test-grid">
              <div className="questions-panel">
                <h1 id="section-title">{sections[currentSectionIndex].title}</h1>
                <ul className="questions-list" role="list">
                  {sections[currentSectionIndex].questions.map((question, qIndex) =>
                    qIndex === currentQuestionIndex && (
                      <li
                        key={question.id}
                        className="question-item"
                        role="listitem"
                        data-testid={`question-${qIndex}`}
                        id={`question-${currentSectionIndex}-${qIndex}`}
                      >
                        <fieldset className="question-block">
                          <legend>{question.text}</legend>
                          {question.options.map((option, oIndex) => (
                            <div key={option.id} className="option-block">
                              <input
                                type="radio"
                                id={`question-${currentSectionIndex}-${qIndex}-option-${oIndex}`}
                                name={`question-${currentSectionIndex}-${qIndex}`}
                                value={option.id}
                                data-question-id={question.id}
                                data-option-id={option.id}
                              />
                              <label htmlFor={`question-${currentSectionIndex}-${qIndex}-option-${oIndex}`}>
                                {option.text}
                              </label>
                            </div>
                          ))}
                        </fieldset>
                      </li>
                    )
                  )}
                </ul>
                <button
                  id="next-question"
                  aria-label="Next Question"
                  onClick={handleNextQuestion}
                >
                  Next
                </button>
              </div>
              <aside className="timer-panel" aria-labelledby="timer-heading">
                <h2 id="timer-heading">Time Remaining</h2>
                <TimerComponent
                  totalTime={sections[currentSectionIndex].timeLimit}
                  sectionIndex={currentSectionIndex}
                  onCompleted={handleTimerComplete}
                />
              </aside>
            </div>
          )}
        </section>
      </main>
    </>
  )
}