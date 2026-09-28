# PHASE 22 — LEARNING INTELLIGENCE & CONTENT SYSTEM ARCHITECTURE

## 1. Core Educational Philosophy
Tutr Kidz operates strictly on two foundational principles:
- **"One question. One screen. One simple interaction."**
- **"The parent owns the account. The child owns the learning experience."**

Tutr Kidz feels:
- calm
- simple
- curious
- supportive
- child-led
- parent-informed
- offline-first
- deterministic
- privacy-conscious

The child is never ranked, scored competitively, or pressured. The platform strictly rejects streaks, points, leaderboards, public profiles, badges, or addictive reward loops.

---

## 2. Answers to the Two Fundamental Questions

### For the Child:
> **"What should I explore next?"**
The child sees at most **ONE clear next-action recommendation** at a time:
- "Ready to explore Colours?" (Toddler initial state)
- "Continue exploring Shapes" (Toddler qualitative continuation)
- "Ready to explore Numbers" (Class 1-4 new topic)
- "Continue exploring Addition" (Class 1-4 partially explored topic)
- "Revisit Subtraction" (Class 1-4 topic quiet for 5+ days)
- "Try Multiplication next" (Pedagogical progression in sequence)

Action button: "Explore" or "Try Next" (>= 48px touch target).

### For the Parent:
> **"What has my child been exploring, and what might be useful to revisit?"**
Parent dashboard & insights display calm qualitative intelligence:
- **Exploring now:** Topics currently active.
- **Could revisit:** Topics practiced previously that can be gently revisited to keep ideas fresh.
- **Suggested next:** Clear recommendation based on progress, curriculum sequence, and parent intention.
- **Recently explored:** Chronological learning timeline.

---

## 3. Content Architecture & Model Hardening

Defined in `features/curriculum/contentTypes.ts`:
```
CurriculumLevel
  └── Subject / Domain
        └── TopicContentModel
              ├── id, level, subject, title, description, symbol
              ├── prerequisites (e.g. addition -> subtraction)
              ├── relatedTopics (e.g. geometry -> measurement)
              ├── nextTopicId (deterministic pedagogical chain)
              └── concepts: LearningConcept[]
```

Retrieval helpers:
- `getTopicContentModel(level, topicId)`
- `getTopicPrerequisites(level, topicId)`
- `getRelatedTopics(level, topicId)`
- `getNextExplorationTopic(level, topicId)`

---

## 4. Deterministic Topic Familiarity

Defined in `features/learning/recommendationUtils.ts`:
| State | Rule / Threshold |
|---|---|
| `not-explored` | 0 attempts or no progress record |
| `explored` | 1+ attempts, < 15 questions answered, practiced within 5 days |
| `familiar` | $\ge 15$ questions answered, practiced within 5 days |
| `revisit-suggested` | Attempted previously, but $\ge 5$ calendar days elapsed since last practice |

Pure deterministic derivations from existing progress records; no secondary database or sync table is introduced.

---

## 5. Deterministic Recommendation Engine

Defined in `features/learning/recommendationUtils.ts`:
1. **Toddler Branch:**
   - 0 questions answered: Recommend Colours.
   - Unattempted activities: Recommend next unexplored activity.
   - All attempted: Recommend continuing most recently explored activity.
   - Purely qualitative text; zero numerical scores, counts, or percentages.
2. **Classes 1 to 4 Branch:**
   - **Step 1 (Parent Plan):** If parent enabled an intention with selected topics not yet familiar, prioritize that topic gently.
   - **Step 2 (Revisit):** If any topic is `revisit-suggested`, suggest revisiting.
   - **Step 3 (Continue Explored):** If any topic is in progress (`explored`), suggest continuing.
   - **Step 4 (Next in Sequence):** Check the most recently practiced topic's `nextTopicId`. If valid, suggest natural progression.
   - **Step 5 (Explore New):** Suggest the first unstarted topic.
   - **Fallback:** Return the first topic in the level.

---

## 6. Adaptive Question Selection & Repetition Avoidance

Defined in `features/learning/questionSelector.ts`:
- **Repetition Avoidance:** Tracks exposed question IDs per child/topic locally (`tutr_kidz_recent_q_${childId}_${topicId}`). Questions not in recent history are prioritized.
- **Gradual Progression (Class 1-4):** Selected questions are ordered `easy` -> `medium` -> `hard` to avoid abrupt difficulty spikes.
- **Exploratory Variety (Toddler):** Questions are selected to vary visual categories (colours, shapes, matching).
- **Graceful Boundary Handling:** When question bank has $\le$ configured session count (e.g. single question), all valid questions are retained without crashing.
- **Determinism:** Accepts an optional seed for seeded PRNG (Mulberry32) ensuring repeatable sequences in testing and sessions.

---

## 7. Child & Parent Experience Integration

- **Home (`app/index.tsx`):**
  - Displays at most ONE calm recommendation card (`DailyPracticeCard`).
  - Toddlers are protected from numerical goal counts (TodayProgress is suppressed).
- **Quiz Screen (`app/quiz/[level].tsx`):**
  - Uses `selectAdaptiveQuestions` to serve fresh questions.
  - Automatically records exposed questions upon quiz completion.
- **Parent Dashboard (`app/parent/index.tsx`):**
  - Displays "Suggested Next" card with calm guidance.
  - Topics worth revisiting clearly marked.
- **Learner Insights (`app/parent/family/[childId]/insights.tsx`):**
  - Structured into: "Suggested Next", "Exploring Now", "Could Revisit", "Recently Explored".
  - Strictly multi-child isolated (Child A's data never touches Child B).

---

## 8. Verification & Test Architecture

- Test suite: `test_phase22.js` covering 15 distinct requirements (A through O), passing 65/65 tests.
- Full regression suite: Phases 10 through 21 running cleanly with 0 regressions.
- Purely offline-compatible, no external AI API calls, zero PII collection.
