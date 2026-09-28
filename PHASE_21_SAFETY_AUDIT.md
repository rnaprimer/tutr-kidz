# PHASE 21 — FAMILY SAFETY, ISOLATION & PRIVACY AUDIT

## 1. Executive Summary

Tutr Kidz is built on family trust, privacy minimization, and multi-child safety. This document audits and records the mechanisms implemented across the platform to safeguard children and families.

---

## 2. Multi-Child Data Isolation

### A. Strict Child Scoping
1. **Local Storage Keys:**
   - Every child's progress is persisted under a discrete storage key: `tutr_kidz_progress_<childId>`.
   - Every child's gentle learning plan is persisted under: `tutr_kidz_plan_<childId>`.
   - The active child ID is stored globally under `tutr_kidz_family`.
2. **Active Child Stability:**
   - Viewing, querying, or analyzing another child in the Parent Dashboard never silently mutates `activeChildId`.
   - Switching active learners requires an explicit call to `setActiveChild(childId)`.
3. **Cascading Child Deletion:**
   - Removing a learner via `removeChild(childId)` cleans:
     - Local progress cache (`tutr_kidz_progress_<childId>`)
     - Local learning plan cache (`tutr_kidz_plan_<childId>`)
     - Cloud database records (cascaded in PostgreSQL via foreign keys)
   - Other learners in the family remain completely unaffected.

---

## 3. Parent Controls & Destructive Actions

### A. Parent Lock Challenge
- Protects parent areas (`/parent`, `/parent/settings`, `/parent/family`, etc.) from accidental child navigation.
- Generates dynamic, age-appropriate arithmetic challenges (e.g. *"What is 8 + 6?"*).
- An incorrect response displays gentle feedback (*"That's not quite right. Let's try this one:"*) and dynamically regenerates a new challenge.
- Correct completion unlocks the parent session in memory for the active browser session.
- Session unlock is cleared immediately upon app reload or when the parent locks the session.

### B. Destructive Action Safety
Implemented in `components/settings/DestructiveAction.tsx`:
1. **Clear Explanations:** Explains the exact consequences of deleting data or accounts before proceeding.
2. **Intentional Confirmation:** Requires confirmation via native platform dialogs (`window.confirm` on web, `Alert.alert` on mobile).
3. **Double-Click Prevention:** Uses an `isPending` state to disable the button and show an `ActivityIndicator` while asynchronous actions execute.
4. **Offline Resilience:** If network connectivity is lost during account deletion, local caches are immediately wiped to preserve privacy.

---

## 4. Child-Safe Interaction & Non-Gamification

### A. Zero Performance Pressure
1. **No Streaks or Timers:** Children learn at their own pace without loss-aversion mechanics or countdown pressure.
2. **No Leaderboards or Rankings:** Learning is personal, private, and non-competitive.
3. **No Points, Badges, or Virtual Currencies:** Eliminates addictive extrinsic reward loops.
4. **Non-Punitive Feedback:** An incorrect answer simply displays the friendly solution (*"The answer was..."*) without scary sounds or red failure banners.
5. **Exploratory Toddler Mode:** Toddler activities provide qualitative discovery rather than numerical score ratios.

---

## 5. Telemetry & Privacy Minimization

### A. Sanitized Analytics (`lib/analytics/analytics.ts`)
1. **Property Filtering:** Strips any keys containing:
   - `name` (child name, parent name)
   - `child_id`, `learner_id`
   - `email`, `password`
   - `token`, `secret`
   - `message`, `feedback`
2. **Allowed Properties:** Strictly primitive, aggregate metadata (e.g. `level: "class-1"`, `score: 4`, `total: 5`).

### B. Sanitized Error Observability (`lib/observability/observability.ts`)
1. **PII Redaction:** Redacts emails (`[EMAIL_REDACTED]`) and system user paths (`/Users/[REDACTED]`).
2. **Bounded Log Buffer:** Limits in-memory logs to a maximum of 50 entries to prevent memory leaks.
3. **Non-Blocking Architecture:** Never throws or interrupts application rendering.

---

## 6. Offline Recovery & Sync Idempotency

1. **Local-First Authority:** All learning and quiz completion records write to device storage immediately.
2. **Offline Mutation Queue:** Mutations are enqueued in `tutr_kidz_sync_queue` when disconnected.
3. **Idempotent Sync:** Flushes use upsert semantics to prevent duplicate attempts or records upon network restoration.
