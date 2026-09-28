# PHASE 22 — LEARNING INTELLIGENCE & CONTENT SYSTEM AUDIT

## 1. Executive Summary

This audit assesses the existing curriculum, question banks, progress tracking, learning continuity, learning plans, and recommendation systems in Tutr Kidz to establish a foundation for Phase 22: Learning Intelligence & Content System.

Tutr Kidz operates strictly on:
- *"One question. One screen. One simple interaction."*
- *"The parent owns the account. The child owns the learning experience."*

The platform remains deterministic, offline-first, child-led, and completely free from gamification (no streaks, leaderboards, points, coins, badges, rankings, or performance pressure).

---

## 2. Curriculum & Question Bank Structure

### A. Level Hierarchy
- **Toddler (Early Learning):** 4 topics (Colours, Shapes, Numbers, Matching) · 20 questions
- **Class 1 (Mathematics):** 5 topics (Numbers, Addition, Subtraction, Shapes, Measurement) · 35 questions
- **Class 2 (Mathematics):** 7 topics (Numbers, Addition, Subtraction, Multiplication, Division, Time, Shapes) · 40 questions
- **Class 3 (Mathematics):** 8 topics (Numbers, Addition, Subtraction, Multiplication, Division, Fractions, Geometry, Measurement) · 45 questions
- **Class 4 (Mathematics):** 8 topics (Numbers, Addition, Subtraction, Multiplication, Division, Fractions, Geometry, Measurement) · 45 questions
- **Total Registered Questions:** 185 across 32 topics.

### B. Current Topic Model (`data/curriculum.ts`)
Topics are configured with:
- `id`: Unique topic slug (e.g., `addition`, `shapes`)
- `level`: Associated curriculum level
- `subject`: `early-learning` or `mathematics`
- `title` & `description`: User-facing labels
- `symbol`: Emoji / visual indicator

### C. Current Progress Model (`features/progress/types.ts`)
- **OverallProgress:** `totalQuestionsAnswered`, `totalCorrectAnswers`, `totalIncorrectAnswers`, `quizzesCompleted`, `lastPlayedAt`.
- **TopicProgress (per topic):** `attempts`, `questionsAnswered`, `correctAnswers`, `incorrectAnswers`, `bestScore`, `bestTotal`, `lastScore`, `lastTotal`, `lastPlayedAt`.

---

## 3. Existing Recommendation & Continuity Logic

### A. Daily Recommendation (`features/dailyLearning/dailyLearningUtils.ts`)
Current implementation in Phase 12 used 3 basic heuristics:
1. Brand-new learner $\rightarrow$ first topic in level.
2. Accuracy $< 70\%$ with $\ge 5$ questions $\rightarrow$ practice suggestion.
3. Most recently practiced topic $\rightarrow$ continue practicing.
*Weakness:* Using accuracy $< 70\%$ as the primary driver can feel deficit-oriented and doesn't answer the child's question (*"What should I explore next?"*) or honor natural curiosity.

### B. Continuity & Parent Guidance (`features/insights/continuityUtils.ts`)
Phase 18 & 19 introduced:
- Trend calculation (comparing 7-day windows).
- Intentional guidance mapping based on parent learning plans (`Explore new topics`, `Practice when ready`, `Focus on mathematics`, etc.).
- Topic history sorting into *Recently Explored* vs *Earlier*.

---

## 4. Key Opportunities for Phase 22 Improvement

1. **Content Concept Hierarchy & Prerequisite Graphs:**
   - Define a deterministic content model linking Level $\rightarrow$ Subject $\rightarrow$ Topic $\rightarrow$ Learning Concepts.
   - Establish natural pedagogical prerequisites (e.g., *Numbers $\rightarrow$ Addition $\rightarrow$ Multiplication $\rightarrow$ Division*, *Fractions requires Division basics*).

2. **Deterministic Topic Familiarity Model:**
   - Formalize 4 clear familiarity states with exact thresholds:
     - `not-explored` (0 attempts)
     - `explored` (1–2 attempts, $< 15$ questions)
     - `familiar` ($\ge 15$ questions answered)
     - `revisit-suggested` (familiar or explored, but no practice in $\ge 5$ days or incomplete exploration)

3. **Curiosity-Driven Child Recommendation Engine:**
   - Answers: *"What should I explore next?"*
   - Shows at most **one** clear, welcoming recommendation card at a time.
   - Respects parent plan without rigid sequences.
   - Purely qualitative for Toddler (*"Ready to explore Colours?"*).

4. **Calm Parent Learning Intelligence:**
   - Answers: *"What has my child been exploring, and what might be useful to revisit?"*
   - Surfaces:
     - *Exploring now*
     - *Could revisit*
     - *Recently explored*
     - *Suggested next*
   - Uses zero deficit language (*never* "weak in", "underperforming", or "falling behind").

5. **Adaptive Question Selection & Repetition Avoidance:**
   - In `useQuiz` or question selector, prevent immediately repeating identical questions across successive quiz sessions when alternatives exist in the question bank.
   - Deterministic and testable.
