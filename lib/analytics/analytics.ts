/**
 * Tutr Kidz - Production Analytics Abstraction (Phase 18)
 *
 * Minimal, privacy-conscious, non-blocking telemetry abstraction.
 * Strictly adheres to child-safety principles:
 * - Zero personal child data or identifiable information tracked
 * - Failure-safe: never throws or blocks learning interactions
 * - Fully offline-tolerant
 */

export type AnalyticsEventType =
  | 'app_opened'
  | 'learning_level_opened'
  | 'topic_opened'
  | 'quiz_started'
  | 'quiz_completed'
  | 'parent_dashboard_opened'
  | 'learning_insights_opened'
  | 'family_dashboard_opened'
  | 'child_switched'
  | 'learning_plan_created'
  | 'learning_plan_updated'
  | 'learning_history_opened'
  | 'topic_exploration_opened'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'learner_created'
  | 'first_learning_session_started'
  | 'feedback_submitted'
  | 'feedback_sync_completed'
  | 'production_error'
  | 'learning_recommendation_shown'
  | 'learning_recommendation_selected'
  | 'topic_revisit_selected'
  | 'recommended_topic_explored';

export interface AnalyticsEvent {
  event: AnalyticsEventType;
  timestamp: string;
  properties?: Record<string, string | number | boolean>;
}

export type AnalyticsListener = (event: AnalyticsEvent) => void;

class AnalyticsManager {
  private inMemoryLog: AnalyticsEvent[] = [];
  private readonly maxBufferSize = 50;
  private listeners: AnalyticsListener[] = [];
  private isEnabled = true;

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public subscribe(listener: AnalyticsListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Tracks an application event safely and asynchronously.
   * Strips any potentially sensitive or non-primitive properties.
   */
  public track(
    event: AnalyticsEventType,
    properties?: Record<string, string | number | boolean>
  ): void {
    if (!this.isEnabled) return;

    try {
      // Sanitize properties to prevent personal data leaks
      const sanitizedProps: Record<string, string | number | boolean> = {};
      if (properties && typeof properties === 'object') {
        for (const [key, val] of Object.entries(properties)) {
          // Reject keys that might contain personal names or child IDs
          const lower = key.toLowerCase();
          if (lower.includes('name') || lower.includes('childid') || lower.includes('child_id') || lower.includes('learner_id') || lower.includes('email') || lower.includes('password') || lower.includes('token') || lower.includes('secret') || lower.includes('message') || lower.includes('feedback')) {
            continue;
          }
          if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            sanitizedProps[key] = val;
          }
        }
      }

      const eventPayload: AnalyticsEvent = {
        event,
        timestamp: new Date().toISOString(),
        properties: Object.keys(sanitizedProps).length > 0 ? sanitizedProps : undefined,
      };

      // Add to buffer
      this.inMemoryLog.push(eventPayload);
      if (this.inMemoryLog.length > this.maxBufferSize) {
        this.inMemoryLog.shift();
      }

      // Notify any registered listeners
      for (const listener of this.listeners) {
        try {
          listener(eventPayload);
        } catch {
          // Ignore listener errors
        }
      }
    } catch {
      // Safe fail: analytics must NEVER interrupt the application
    }
  }

  public getEvents(): AnalyticsEvent[] {
    return [...this.inMemoryLog];
  }

  public clear(): void {
    this.inMemoryLog = [];
  }
}

export const analytics = new AnalyticsManager();

export function trackEvent(
  event: AnalyticsEventType,
  properties?: Record<string, string | number | boolean>
): void {
  analytics.track(event, properties);
}
