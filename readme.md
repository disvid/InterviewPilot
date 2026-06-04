# 🚀 InterviewPilot

InterviewPilot is an AI-powered mock interview platform that helps users prepare for technical, behavioral, HR, and system design interviews through personalized AI-generated questions, voice-based interactions, resume analysis, confidence tracking, and career guidance.

The platform simulates a realistic interview environment by generating questions tailored to a user's resume and target role, evaluating responses, and providing actionable feedback for improvement.

---

## ✨ Features

###  AI Resume Parsing
- Upload resumes in PDF format
- Extract skills, projects, education, and experience
- Create structured candidate profiles

###  AI Resume Analysis
- ATS Score calculation
- Resume quality assessment
- Strength and weakness analysis
- Missing keyword detection
- ATS optimization recommendations

###  Personalized Interview Generation
- Resume-aware question generation
- Role-specific interview questions
- Multiple interview modes:
  - Technical
  - Behavioral
  - HR
  - System Design
  - Mixed

###  Voice-Based Interview Experience
- AI interviewer reads questions aloud
- Voice answer recording
- Speech-to-text transcription
- Real interview simulation

###  AI Answer Evaluation
- Overall score
- Technical score
- Relevance score
- Communication score
- Structure score
- Personalized feedback
- Model answers

###  Confidence Analysis
- Speaking pace analysis
- Filler word detection
- Hesitation detection
- Confidence scoring
- Speaking improvement recommendations

###  Analytics Dashboard
- Interview history
- Average score tracking
- Best score tracking
- Performance trends
- Category-wise analysis

###  Career Roadmap Generator
- Target role assessment
- Readiness score
- Missing skills identification
- Personalized learning roadmap
- Weekly learning plan

---

#  Tech Stack

## Frontend
- Next.js 16
- React
- TypeScript
- Tailwind CSS

## Backend
- Next.js API Routes
- Node.js

## Database
- SQLite
- Better-SQLite3

## Authentication
- JWT Authentication
- HTTP-Only Cookies
- bcrypt Password Hashing

## AI Services

### Groq AI
- Llama 3.3 70B
  - Resume Parsing
  - Resume Analysis
  - Question Generation
  - Answer Evaluation
  - Career Roadmap Generation

### Whisper Large v3
- Speech-to-Text Transcription

### PlayAI TTS
- AI Voice Interviewer
- Text-to-Speech Question Reading

## File Processing
- PDF Parse
- FFmpeg
- FFprobe

---

# 🔄 Application Flow

```text
Resume Upload
      │
      ▼
Resume Parsing (AI)
      │
      ▼
Structured Resume Profile
      │
      ▼
Interview Setup
      │
      ▼
AI Question Generation
      │
      ▼
Voice Interview Session
      │
      ▼
User Answer
      │
      ▼
Whisper Transcription
      │
      ▼
AI Evaluation
      │
      ├── Technical Score
      ├── Communication Score
      ├── Relevance Score
      ├── Structure Score
      ├── Confidence Analysis
      └── Model Answer
      │
      ▼
Results Dashboard
      │
      ▼
Analytics & Career Roadmap
```

---

# ⚙️ Setup Instructions

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/interviewpilot.git
cd interviewpilot
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Create Environment Variables

Create a `.env.local` file in the root directory.

```env
JWT_SECRET=your_jwt_secret

GROQ_API_KEY=your_groq_api_key

DATABASE_PATH=./data/interviewpilot.db
```

## 4. Initialize Database

```bash
node scripts/init-db.js
```

## 5. Start Development Server

```bash
npm run dev
```

Application will be available at:

```text
http://localhost:3000
```

---

#  Authentication Flow

```text
Register
   │
   ▼
Password Hashing
   │
   ▼
SQLite Database
   │
   ▼
Login
   │
   ▼
JWT Generation
   │
   ▼
HTTP-Only Cookie
   │
   ▼
Protected Routes
```

---

#  Evaluation Metrics

Each answer is evaluated across:

- Overall Score
- Technical Accuracy
- Relevance
- Communication
- Structure
- Confidence Score

Additional AI feedback includes:

- Strengths
- Weaknesses
- Suggested Improvements
- Model Answer

---

