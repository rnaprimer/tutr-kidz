# PHASE 21 — LEARNING QUALITY & CONTENT INTEGRITY

## 1. Executive Summary

This document specifies the validation contracts, mathematical invariants, and content integrity standards established and verified during Phase 21 for Tutr Kidz.

Every learning question, curriculum topic, quiz interaction, and progress record in the system has been systematically audited, validated, and hardened against corruption, state mutation, and learner performance pressure.

---

## 2. Question Bank Integrity

### A. Registry Statistics
- **Total Registered Questions:** 185
- **Toddler Early Learning:** 20 questions (4 activities × 5 questions)
- **Class 1 Mathematics:** 35 questions (5 topics)
- **Class 2 Mathematics:** 40 questions (7 topics)
- **Class 3 Mathematics:** 45 questions (8 topics)
- **Class 4 Mathematics:** 45 questions (8 topics)

### B. Validation Criteria & Invariants
Every question in `data/questionBank.ts` satisfies the following deterministic invariants:
1. **Unique Question IDs:** No duplicate question IDs exist across any levels or sets.
2. **Four Valid Options:** Every question possesses exactly four distinct options.
3. **Valid Correct Option:** Every question declares a `correctOptionId` that maps to one of its four options.
4. **Accessible Visual Options:** Any option utilizing a visual representation without a text label provides an `accessibilityLabel` for screen readers.
5. **Non-Empty Text:** Every question possesses meaningful, age-appropriate question text.
6. **Unique Answer Values:** No question contains duplicate choices among its four options.
7. **Mathematical Accuracy:** Every arithmetic problem (addition, subtraction, multiplication, division, fractions, geometry) has been verified for correct calculation.

### C. Validation Tooling
Implemented in `features/curriculum/questionIntegrity.ts`:
- `validateQuestion(question)`: Analyzes a single question and returns structured error codes.
- `validateQuestionBank(questions)`: Audits an entire question collection.
- `findDuplicateQuestionIds()`: Scans for identifier collisions.
- `findInvalidQuestions()`: Identifies any malformed or incomplete question objects.
- `findBrokenReferences()`: Verifies references to levels, topics, and visual assets.

---

## 3. Curriculum Structure & Consistency

### A. Levels & Subject Mappings
- **Levels (5):** Toddler, Class 1, Class 2, Class 3, Class 4
- **Subjects (2):** Early Learning, Mathematics
- **Topics (32):**
  - **Toddler (4):** Colours, Shapes, Numbers, Matching
  - **Class 1 (5):** Numbers, Addition, Subtraction, Shapes, Measurement
  - **Class 2 (7):** Numbers, Addition, Subtraction, Multiplication, Division, Time, Shapes
  - **Class 3 (8):** Numbers, Addition, Subtraction, Multiplication, Division, Fractions, Geometry, Measurement
  - **Class 4 (8):** Numbers, Addition, Subtraction, Multiplication, Division, Fractions, Geometry, Measurement

### B. Curriculum Invariants
1. **Zero Orphaned Topics:** Every topic in `TOPICS_BY_LEVEL` has active questions in the question bank.
2. **Zero Orphaned Questions:** Every question belongs to a recognized, registered topic for its level.
3. **No Terminology Conflicts:** Consistent naming across toddler activities and grade levels.
4. **Deterministic Validation Utility:** Implemented in `features/curriculum/curriculumIntegrity.ts` (`validateCurriculum()`, `validateLevel()`, `findOrphanedTopics()`, `findOrphanedQuestions()`).

---

## 4. Quiz Engine Hardening

### A. Interaction Contracts (`features/quiz/useQuiz.ts`)
1. **Option Locking:** Once an option is selected, the state is locked to prevent mutating answers or double-submitting.
2. **Enforced Progression:** The `nextQuestion()` trigger cannot advance until an option has been selected.
3. **Double-Click Prevention:** In `app/quiz/[level].tsx`, an `isTransitioning` lock prevents duplicate navigation transitions when finishing a quiz.
4. **Single Result Recording:** In `app/quiz/result.tsx`, `hasRecordedRef` ensures quiz attempts and topic progress are recorded exactly once per session.

### B. Toddler Exploratory Experience
To honor the core product philosophy (*'The parent owns the account. The child owns the learning experience'* and *'Never display percentages, accuracy scores, rankings, or performance pressure'*):
- Numeric score indicators (`score / total`) are completely omitted for Toddler activities.
- Best score comparisons (`Best for this topic: X / Y`) are omitted.
- Qualitative discovery messaging is rendered:
  - Heading: *"Nice exploring! 🌟"*
  - Card Text: *"You discovered something new."*
  - Action Prompt: *"Ready to explore another one?"*
  - Actions: *"Explore Again"*, *"Explore Another"*, *"Home"*.

---

## 5. Progress Data Integrity

### A. Mathematical Invariants
Implemented in `features/progress/progressIntegrity.ts`:
1. **Non-Negative Bounds:** `attempts >= 0`, `questionsAnswered >= 0`, `correctAnswers >= 0`, `incorrectAnswers >= 0`.
2. **Conservation of Answers:** `correctAnswers + incorrectAnswers === questionsAnswered`.
3. **Valid Score Ratios:** `0 <= score <= total` and `0 <= bestScore <= bestTotal`.
4. **Pre-Save Sanitization:** `sanitizeQuizAttempt()` clamps incoming scores to `[0, total]` before writing to storage or Supabase.
