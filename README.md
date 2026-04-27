# Athlete Recruitment Automation Platform

Internal tool for identifying and evaluating junior tennis players (≤18) and matching them to US college programs.

## Architecture

```
Frontend (React + Vite, :5173)
        ↓
API Layer (Express, :3001)
        ↓
Service Layer
  ├── normalizationService  — UTR / ITF / ATP → unified 0-1 score
  ├── scoringEngine         — deterministic Fit Score (0-100)
  ├── dataService           — college pool (local + optional Scorecard API)
  └── aiService             — OpenAI outreach/reasoning (fallback mode if no key)
```

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — add OPENAI_API_KEY if you want AI-generated reasoning/outreach
npm run dev
# → http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Open **http://localhost:5173** in your browser.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port (default 3001) |
| `OPENAI_API_KEY` | No | Enables AI reasoning + outreach. Falls back to deterministic text if absent. |
| `COLLEGE_SCORECARD_API_KEY` | No | Enriches tuition/SAT from US Dept of Education API. Not required. |

## API Reference

### `POST /api/match-athlete`

```json
{
  "athlete_profile": {
    "name": "Lucas Moreau",
    "age": 17,
    "utr": 12.4,
    "itf_rank": 180,
    "atp_rank": null,
    "nationality": "France",
    "gpa": 3.6,
    "sat": 1290
  },
  "preferences": {
    "division": ["D1", "D2"],
    "locations": ["Florida", "California"],
    "max_tuition": 50000
  }
}
```

Returns ranked school matches with fit scores, categories, scholarship probability, and reasoning.

### `POST /api/generate-outreach`

```json
{
  "athlete": { "name": "...", "utr": 12.4, "nationality": "France", ... },
  "school": "University of Florida"
}
```

Returns `{ subject, body }` — a draft email ready for review.

## Scoring Model

**Player Strength Score** (0–1):
```
score = (UTR/16 × 0.5) + (ITFscore × 0.3) + (ATPscore × 0.2)
```
Missing rankings are excluded and weights redistributed proportionally.

**Fit Score** (0–100):
```
= (Athletic Match × 0.4)
+ (Academic Match × 0.3)
+ (Affordability  × 0.2)
+ (Division Fit   × 0.1)
```

**Categories:** Target ≥85 · Reach 70–84 · Safety <70

## College Dataset

20 curated programs across D1/D2/D3 with real-world benchmark UTR values, tuition, and SAT ranges. Located in `backend/src/data/colleges.js`.

## Mock Player Dataset

8 global junior profiles in `backend/src/data/mockPlayers.js` — usable for API testing.
