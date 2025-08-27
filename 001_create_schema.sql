-- Version: 1.0.0  
-- Author: IBT Preparation Test Team  
-- Date: 2025-08-25  
-- Description: Create initial schema and tables for IBT Preparation Test  

BEGIN;

CREATE SCHEMA IF NOT EXISTS ibt_prep AUTHORIZATION CURRENT_USER;
ALTER SCHEMA ibt_prep SET default_character_set = 'UTF8', default_collation = 'en_US.utf8';
SET search_path TO ibt_prep, public;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'test_taker',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS tests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  test_id INT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  section VARCHAR(50) NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS answers (
  id SERIAL PRIMARY KEY,
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id INT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  score_total NUMERIC(5,2),
  section_scores JSONB,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS result_answers (
  id SERIAL PRIMARY KEY,
  result_id INT NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_id INT REFERENCES answers(id),
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_test_id ON results(test_id);
CREATE INDEX IF NOT EXISTS idx_result_answers_result_id ON result_answers(result_id);
CREATE INDEX IF NOT EXISTS idx_result_answers_question_id ON result_answers(question_id);

GRANT USAGE ON SCHEMA ibt_prep TO public;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ibt_prep TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA ibt_prep GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO public;

BEGIN
  COMMIT;
EXCEPTION WHEN OTHERS THEN
  ROLLBACK;
  RAISE;
END;