# PHASE 21 — AUDIT REPORT: LEARNING QUALITY, CONTENT INTEGRITY & FAMILY SAFETY

## 1. Architecture Overview

Tutr Kidz is a production Expo/React Native web & mobile application built around two core philosophies:
- *'One question. One screen. One simple interaction.'*
- *'The parent owns the account. The child owns the learning experience.'*

The architecture is strictly local-first with seamless cloud synchronization via Supabase PostgreSQL, designed to remain calm, private, non-gamified, and accessible.

### Core Systems Audited:
1. **Curriculum & Question Bank:**
   - 185 total questions distributed across 5 levels: Toddler (20), Class 1 (35), Class 2 (40), Class 3 (45), Class 4 (45).
   - Structured in `data/questionBank.ts`, `data/curriculum.ts`, and individual level directories (`data/toddler/`, `data/class1/` ... `data/class4/`).
2. **Quiz Engine:**
   - Managed by `features/quiz/useQuiz.ts` and `app/quiz/[level].tsx`.
   - Result recording via `app/quiz/result.tsx` and `features/progress/progressRepository.ts`.
3. **Progress & Persistence:**
   - Child-isolated local storage (`tutr_kidz_progress_<childId>`).
   - Cloud persistence via Supabase tables `topic_progress` and `quiz_attempts`.
4. **Offline Queue & Sync Engine:**
   - Offline queue via `features/sync/syncQueue.ts` and `features/sync/syncService.ts`.
   - Supports child records, preferences, topic progress, quiz attempts, family settings, learning plans, and feedback.
5. **Parent Controls & Safety:**
   - In-memory session unlock guarded by arithmetic challenge (`features/settings/parentLock.ts`).
   - Confirmation on destructive operations (`components/settings/DestructiveAction.tsx`).
6. **Observability & Analytics:**
   - Non-blocking error buffer (`lib/observability/`) and privacy-sanitized telemetry (`lib/analytics/`).

---

## 2. Learning & Question Flow

```
Home Screen (/)
  │
  ├── Child Selection (activeChildId)
  │     │
  │     ├── Toddler Activity (/toddler)
  │     │     └── 4 Visual Activities (colours, shapes, numbers, matching)
  │     │
  │     └── Class 1–4 Curriculum (/level/[level])
  │           └── Topic Selector (/level/[level]/topics)
  │
  └── Quiz Session (/quiz/[level]?topic=...)
        ├── Question 1..N (useQuiz: deterministic session slice)
        ├── Immediate Feedback (OptionVisualState: correct/incorrect/locked)
        └── Quiz Results (/quiz/result)
              ├── Local Progress Record (progressRepository.ts)
              ├── Cloud Sync Upsert (if authenticated & online)
              └── Offline Queue Enqueue (if offline)
```

---

## 3. Discovered Integrity Weaknesses & Edge Cases

### A. Toddler Result Screen Numerical Pressure (Identified Defect)
- **Finding:** In `app/quiz/result.tsx`, toddler quizzes were displaying numeric score boxes (`score / total`) and `Best for this topic: X / Y`.
- **Impact:** Contradicts the toddler learning philosophy (*'Never display percentages, accuracy scores, rankings, or performance pressure'*). Toddler sessions must remain purely qualitative and exploratory.
- **Remediation:** Remove score numbers and comparative best scores for Toddler quizzes. Render qualitative discovery cards (*'Nice exploring! 🌟'*, *'You discovered something new.'*, *'Ready for another?'*).

### B. Progress Record Input Boundary Validation (Hardening Opportunity)
- **Finding:** `recordQuizResult` in `features/progress/progressRepository.ts` accepted `RecordQuizParams` directly without validating whether `score` is negative or exceeds `total`, or if `total` is non-positive.
- **Impact:** Malformed parameters or unexpected direct URL access on `/quiz/result?score=10&total=5` could record impossible ratios or negative incorrect answer counts.
- **Remediation:** Introduce a deterministic `validateQuizAttempt` and `validateProgressRecord` guard that sanitizes scores (zsh \le 	ext{score} \le 	ext{total}$) and rejects corrupted attempts.

### C. Orphaned Learning Plan Records on Learner Deletion (Hardening Opportunity)
- **Finding:** In `features/family/familyRepository.ts`, `removeChild(id)` cleanly removed `tutr_kidz_progress_<id>` and PostgreSQL child rows, but did not remove `tutr_kidz_plan_<id>`.
- **Impact:** If a learner is deleted and re-created later, a stale learning plan key might linger locally.
- **Remediation:** Explicitly call `planStorageAdapter.removePlan(id)` during `removeChild` and `resetFamily`.

### D. Destructive Action Double-Submission Prevention (Hardening Opportunity)
- **Finding:** In `components/settings/DestructiveAction.tsx`, the trigger handler invoked async `onPress()` without a pending state.
- **Impact:** Fast double-tapping during network requests (e.g. account deletion or data reset) could initiate redundant requests.
- **Remediation:** Add `isPending` disabled state and visual busy indicator during execution.

### E. Question & Curriculum Deterministic Validation Utilities (Step 2 & 3 Requirement)
- **Finding:** Question integrity checks were spread between `features/quiz/validateQuestions.ts` and test scripts.
- **Remediation:** Create dedicated `features/curriculum/questionIntegrity.ts` and `features/curriculum/curriculumIntegrity.ts` with comprehensive structured error reporting.

---

## 4. Existing Safety & Security Verification

1. **Child Data Isolation:**
   - All progress keys strictly child-scoped: `tutr_kidz_progress_<childId>`.
   - All plan keys strictly child-scoped: `tutr_kidz_plan_<childId>`.
   - Active child is preserved across navigation and cannot be modified by read operations.
2. **Parent Lock:**
   - Parent lock challenges are dynamically generated from verified arithmetic problems.
   - Verification resets on app reload and session expiration.
3. **Telemetry Sanitization:**
   - Zero child names, learner IDs, parent emails, passwords, tokens, or raw feedback messages are ever sent to analytics or observability logs.
4. **Secret Leakage:**
   - Zero `service_role` keys or raw database URLs exist in client bundles or repositories.
