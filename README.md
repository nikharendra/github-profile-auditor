# GitHub Profile Auditor

A recruiter-readiness audit tool for developers that answers:
> **"What would a recruiter notice about my GitHub profile in the first 30 seconds, and what should I improve first?"**

Target audience: CS/MCA students, internship candidates, and early-career software engineers.

---

## Architecture Overview

```
React Frontend
      ↓ (HTTP /api/*)
Express Backend (server.ts)
      ↓
GitHub Service (Public REST API)
      ↓
Data Normalization Layer
      ↓
Deterministic Analysis Engine (5 Weighted Sub-scores + Evidence)
      ↓
Gemini Interpretation Layer (Recruiter Snapshot + Prioritized Action Plan)
      ↓
Validated Audit Result
      ↓
React Results Dashboard
```

### Core Architectural Principle
**Factual scores are mathematically calculated from real observable signals, not arbitrary AI prompts.**
- **The deterministic engine** evaluates 5 frozen categories (0–100) backed by itemized evidence logs.
- **Google Gemini** provides the qualitative recruiter perspective and synthesizes prioritized improvement steps grounded strictly on the deterministic findings.
- **Zero Mock Policy:** Real public data, real calculations, no fake statistics, no fake recruiter quotes.

---

## Scoring Categories & Frozen Weights

| Category | Weight | Key Observable Signals |
| :--- | :---: | :--- |
| **Profile Presentation** | **20%** | Bio presence & specificity, custom display name, portfolio/contact links, professional avatar. |
| **Project Quality & Presentation** | **30%** | Ratio of original projects vs forks, repo descriptions, live demo links, topic tagging. |
| **Documentation Signals** | **20%** | README availability on top original repos, setup guides, usage examples, licenses. |
| **Activity & Consistency** | **15%** | Recency of pushed code, continuous maintenance, active commit signals. |
| **Technical Signals** | **15%** | Core language concentration, depth vs superficial toy repos, tech stack clarity. |
| **Total** | **100%** | Mathematically combined overall score (0–100). |

---

## Phase 1 Implementation Status

- [x] **Express Backend Foundation:** Health check (`GET /api/health`), standard error hierarchy, 404 guard, and full-stack dev runner.
- [x] **Domain Types & Contracts:** Complete TypeScript models for raw GitHub payloads, normalized domain objects, scoring rules, evidence items, and error structures.
- [x] **Clean Frontend Shell:** Semantic HTML, accessible navigation, view controller (`Home`, `Privacy Policy`, `Terms & Conditions`), and live health check diagnostics.
- [x] **Zero Mock Data Enforced:** Username validation format checked with honest Phase 1 status notices.

---

## Getting Started

### Prerequisites
- Node.js 18+ / 20+
- npm

### Installation
```bash
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key variables:
- `PORT=3000`
- `GITHUB_TOKEN=""` (Optional in development, increases GitHub rate limits)
- `GEMINI_API_KEY=""` (Required in Phase 4 for AI interpretation layer)

### Development Server
```bash
npm run dev
```
Starts Express with Vite middleware at `http://localhost:3000`.

### Health Check Verification
```bash
curl http://localhost:3000/api/health
```
Returns:
```json
{
  "status": "ok",
  "service": "github-profile-auditor",
  "version": "1.0.0",
  "phase": "Phase 1: Project Foundation"
}
```

### Production Build & Start
```bash
npm run build
npm start
```
