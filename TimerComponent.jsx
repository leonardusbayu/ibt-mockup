import React, { useState, useEffect, useRef } from 'react';

function TimerComponent({ initialTime = 900, sectionId = 'default', sectionName = 'Section' }) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          window.dispatchEvent(new CustomEvent('timer:completed', { detail: { sectionId } }));
          return 0;
        }
        const next = prev - 1;
        window.dispatchEvent(new CustomEvent('timer:tick', { detail: { sectionId, timeLeft: next } }));
        return next;
      });
    };
    if (!isPaused) {
      timerRef.current = setInterval(tick, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isPaused, sectionId]);

  const handlePause = () => {
    setIsPaused(prev => !prev);
  };

  const formatTime = sec => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <section
      id={`timer-section-${sectionId}`}
      className={`timer-section${isPaused ? ' is-paused' : ''}`}
      data-section-id={sectionId}
      aria-labelledby={`timer-heading-${sectionId}`}
    >
      <a href="#test-container" className="skip-link">Skip to questions</a>
      <h2 id={`timer-heading-${sectionId}`} className="timer-heading">
        Time Remaining: {sectionName}
      </h2>
      <div className="timer-controls" role="group" aria-label={`Controls for ${sectionName} timer`}>
        <time
          id="section-timer"
          className="timer-display"
          dateTime={`PT${timeLeft}S`}
          aria-live="polite"
        >
          {formatTime(timeLeft)}
        </time>
        <button
          id="timer-pause"
          className="timer-pause-btn"
          onClick={handlePause}
          aria-pressed={isPaused}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>
    </section>
  );
}

export default TimerComponent;