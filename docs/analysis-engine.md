# Deterministic Analysis Engine — Specification & Architecture

## Overview
The **Deterministic Analysis Engine** is a pure mathematical scoring module that evaluates public GitHub profiles using only observable signals.

**Core Philosophy:**
```text
Real GitHub REST Data → Normalization → Deterministic Analysis (Scores + Evidence) → Gemini Interpretation (Future Phase)
```

Gemini **never** calculates scores, invents facts, or adjusts numeric values. All scoring is transparent, reproducible, and explainable through itemized evidence.

---

## 1. Frozen Categories and Weights

| Category | Weight | Key Observable Signals |
| :--- | :---: | :--- |
| **Profile Presentation** | **20%** | Bio presence & depth, custom display name, uploaded avatar, website/portfolio link, location & company. |
| **Project Quality & Presentation** | **30%** | Original repo ratio (vs forks), substantive descriptions, unarchived projects, live demo links, topic tags. |
| **Documentation Signals** | **20%** | README presence on inspected repos, setup guides, usage examples, structure, licensing terms. |
| **Activity & Consistency** | **15%** | Recency of latest pushed repo, active repos in 180-day window, account tenure & continuity. |
| **Technical Signals** | **15%** | Primary language focus & concentration, language metadata coverage, technology topic indexing. |
| **Total** | **100%** | Clamped to [0, 100], deterministically rounded. |

---

## 2. Category Scoring Formulas

### Category 1: Profile Presentation (20%)
* **Bio Context (Max 30):**
  * Present: 20 pts
  * Detailed (> 25 characters communicating role/focus): +10 pts
  * Missing: 0 pts
* **Display Name (Max 20):**
  * Custom human name distinct from raw username: 20 pts
  * Raw username used as display name: 5 pts
* **Profile Avatar (Max 20):**
  * Uploaded photo/custom avatar: 20 pts
  * Default generated identicon: 5 pts
* **Portfolio / Website Link (Max 15):**
  * External blog, personal site, or portfolio URL present: 15 pts
  * None: 0 pts
* **Location & Affiliation (Max 15):**
  * Location: 10 pts; Organization/company: 5 pts (capped at 15 pts)

### Category 2: Project Quality & Presentation (30%)
*Evaluates original repositories over forks.*
* **Original Project Ratio (Max 30):**
  * $\ge 70\%$ original projects: 30 pts
  * $40\% - 69\%$ original: 20 pts
  * $1\% - 39\%$ original: 10 pts
  * $0\%$ original (all forks) or 0 repos: 0 pts
* **Description Coverage (Max 30):**
  * Pro-rated: $(\text{original repos with descriptions} / \text{original repos}) \times 30$
* **Active Projects (Max 20):**
  * Unarchived ratio: $(\text{unarchived} / \text{original repos}) \times 15$
  * Substantive project (size $> 50\text{ KB}$ or stars $> 0$): +5 pts
* **Demo Links & Topic Metadata (Max 20):**
  * Topic tagging coverage: up to 10 pts
  * At least 1 live demo / homepage URL: 10 pts

### Category 3: Documentation Signals (20%)
*Evaluated strictly across inspected candidate repositories (capped at 4).*
* **README Availability (Max 35):**
  * $(\text{inspected with README} / \text{inspected count}) \times 35$
* **Setup Instructions (Max 25):**
  * $(\text{inspected with installation/setup} / \text{inspected count}) \times 25$
* **Usage Examples (Max 20):**
  * $(\text{inspected with usage/API guides} / \text{inspected count}) \times 20$
* **Structure & Licensing (Max 20):**
  * License mentioned: up to 10 pts
  * Visuals, headings, demo media: up to 10 pts

### Category 4: Activity & Consistency (15%)
*Evaluates repository-level push recency and continuity.*
* **Most Recent Push Recency (Max 40):**
  * Within 30 days: 40 pts
  * Within 90 days: 30 pts
  * Within 180 days: 20 pts
  * Within 365 days: 10 pts
  * $> 365$ days or no repos: 0 pts
* **Active Projects in Window (Max 35):**
  * 3+ active original repos in last 180 days: 35 pts
  * 2 active repos: 25 pts
  * 1 active repo: 15 pts
  * 0 active repos: 0 pts
* **Account Continuity & Tenure (Max 25):**
  * Established account ($\ge 180$ days) maintaining active repos: 25 pts
  * New developer account ($< 180$ days) showing active push momentum: 25 pts *(anti-bias rule: never penalizes young developers)*
  * Periodic updates: 15–18 pts; Dormant: 8 pts

### Category 5: Technical Signals (15%)
*Evaluates observable language metadata and tech stack cohesion.*
* **Language Metadata Coverage (Max 40):**
  * $(\text{original repos with declared language} / \text{original repos}) \times 40$
* **Stack Focus & Cohesion (Max 35):**
  * Primary language represents $\ge 35\%$ of codebases: 25 pts
  * Cohesive breadth (2 to 5 complementary languages): +10 pts
  * Single language deep specialization: 20 pts total
  * Fragmented stack ($> 5$ languages): 18–23 pts
* **Technology Topic Tags (Max 25):**
  * $\ge 3$ repos with topics: 25 pts; 1–2 repos: 15 pts; 0 repos: 0 pts

---

## 3. Overall Score Calculation

$$\text{Overall} = \text{round}\left( \text{Profile} \times 0.20 + \text{Projects} \times 0.30 + \text{Documentation} \times 0.20 + \text{Activity} \times 0.15 + \text{Technical} \times 0.15 \right)$$

Clamped strictly to $[0, 100]$.

---

## 4. What Is Intentionally NOT Scored (Anti-Bias Rules)

1. **Followers and Stars are NOT equated to technical ability.** Stars and forks are supporting contextual metadata only.
2. **Account age is NOT equated to engineering seniority.** New accounts are awarded full continuity points if they demonstrate active momentum.
3. **Number of languages does NOT mean better programmer.** Having 15 languages is not rewarded over a cohesive stack in 2–3 languages.
4. **No code execution.** The application never executes downloaded code or tests.
5. **No commit scraping.** Activity reflects observable repository `pushed_at` dates, not commit counts or green-square heatmaps.

---

## 5. Critical Distinctions and Limitations

* **Technical Signals $\neq$ Programming Skill:** We evaluate metadata clarity, language coverage, and technology indexing. We cannot and do not judge raw algorithmic skill or internal code cleanliness.
* **Activity $\neq$ Commit Frequency:** We evaluate public repository push timestamps. We do not inspect private commit graphs, commit streaks, or lines of code changed.
* **Documentation Scope:** Evaluated across the top 4 candidate original repositories to respect GitHub REST API rate constraints.

---

## 6. Edge Case Handling

* **Zero Repositories:** All repository-dependent categories return 0 with transparent, non-judgmental evidence ("No public repositories found"). Overall score reflects profile presentation alone ($\le 20$).
* **100% Forks:** Forks are cleanly isolated; original repository components yield 0 without crashing.
* **Missing READMEs:** Does not throw errors; recorded with `status: 'not_found'` and factored into the documentation score.
* **Zero Languages Detected:** Safely handles empty strings and `Unspecified` languages without `NaN` or `undefined` properties.
