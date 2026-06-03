const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(process.cwd(), "data", "interviewpilot.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    raw_text TEXT,
    parsed_skills TEXT,
    parsed_experience TEXT,
    parsed_education TEXT,
    parsed_projects TEXT,
    summary TEXT,
    experience_years REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS interview_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id TEXT REFERENCES resumes(id),
    interview_type TEXT NOT NULL,
    job_role TEXT,
    difficulty TEXT DEFAULT 'medium',
    total_questions INTEGER DEFAULT 10,
    status TEXT DEFAULT 'pending',
    overall_score REAL,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT,
    skill_tags TEXT,
    order_index INTEGER,
    expected_hints TEXT,
    is_answered INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS answers (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    word_count INTEGER,
    submitted_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY,
    answer_id TEXT NOT NULL UNIQUE REFERENCES answers(id) ON DELETE CASCADE,
    overall_score REAL,
    technical_score REAL,
    relevance_score REAL,
    communication_score REAL,
    structure_score REAL,
    strengths TEXT,
    weaknesses TEXT,
    suggested_answer TEXT,
    improvement_tips TEXT,
    ai_feedback TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS roadmaps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_role TEXT NOT NULL,
    missing_skills TEXT,
    readiness_score REAL,
    weekly_plan TEXT,
    estimated_weeks INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

console.log("✅ Database initialized at", dbPath);
db.close();