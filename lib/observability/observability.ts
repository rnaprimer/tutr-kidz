/**
 * Tutr Kidz - Production Observability & Error Reporting (Phase 20)
 *
 * Lightweight, privacy-conscious, non-blocking error & diagnostics abstraction.
 * - Zero PII or identifiable child information captured
 * - Never throws or interrupts application execution
 * - Fully offline-safe with bounded in-memory diagnostic log
 * - Reuses existing analytics architecture
 */

import { analytics, trackEvent } from '../analytics';

export type DiagnosticLogLevel = 'error' | 'warning' | 'performance';

export interface DiagnosticLogEntry {
  level: DiagnosticLogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, string | number | boolean>;
}

class ObservabilityManager {
  private inMemoryDiagnostics: DiagnosticLogEntry[] = [];
  private readonly maxBufferSize = 50;

  /**
   * Sanitizes diagnostic context to prevent leaking child PII, secrets, or raw text.
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, string | number | boolean> | undefined {
    if (!context || typeof context !== 'object') return undefined;

    const sanitized: Record<string, string | number | boolean> = {};
    for (const [key, val] of Object.entries(context)) {
      const lower = key.toLowerCase();
      // Exclude any keys that might contain sensitive data
      if (
        lower.includes('name') ||
        lower.includes('childid') ||
        lower.includes('child_id') ||
        lower.includes('learner_id') ||
        lower.includes('email') ||
        lower.includes('password') ||
        lower.includes('token') ||
        lower.includes('secret') ||
        lower.includes('key') ||
        lower.includes('message') ||
        lower.includes('feedback')
      ) {
        continue;
      }

      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        sanitized[key] = val;
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  /**
   * Sanitizes error message to strip file paths with usernames or emails.
   */
  private sanitizeMessage(raw: string): string {
    if (!raw) return 'Unknown error';
    return String(raw)
      .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL_REDACTED]')
      .replace(/\/Users\/[^\/]+/g, '/Users/[REDACTED]')
      .slice(0, 300); // Bounded length
  }

  public trackError(
    error: Error | string,
    context?: Record<string, any>
  ): void {
    try {
      const message = error instanceof Error ? error.message : String(error);
      const cleanMessage = this.sanitizeMessage(message);
      const cleanContext = this.sanitizeContext(context);

      const entry: DiagnosticLogEntry = {
        level: 'error',
        message: cleanMessage,
        timestamp: new Date().toISOString(),
        context: cleanContext,
      };

      this.inMemoryDiagnostics.push(entry);
      if (this.inMemoryDiagnostics.length > this.maxBufferSize) {
        this.inMemoryDiagnostics.shift();
      }

      // Safe non-blocking integration with analytics
      trackEvent('production_error', {
        errorMessage: cleanMessage,
        hasContext: cleanContext !== undefined,
      });
    } catch {
      // Observability must NEVER fail the application
    }
  }

  public trackWarning(
    message: string,
    context?: Record<string, any>
  ): void {
    try {
      const cleanMessage = this.sanitizeMessage(message);
      const cleanContext = this.sanitizeContext(context);

      const entry: DiagnosticLogEntry = {
        level: 'warning',
        message: cleanMessage,
        timestamp: new Date().toISOString(),
        context: cleanContext,
      };

      this.inMemoryDiagnostics.push(entry);
      if (this.inMemoryDiagnostics.length > this.maxBufferSize) {
        this.inMemoryDiagnostics.shift();
      }
    } catch {
      // Safe fail
    }
  }

  public trackPerformance(
    operation: string,
    durationMs: number
  ): void {
    try {
      const boundedDuration = Math.max(0, Math.round(durationMs));
      const entry: DiagnosticLogEntry = {
        level: 'performance',
        message: operation.slice(0, 50),
        timestamp: new Date().toISOString(),
        context: { durationMs: boundedDuration },
      };

      this.inMemoryDiagnostics.push(entry);
      if (this.inMemoryDiagnostics.length > this.maxBufferSize) {
        this.inMemoryDiagnostics.shift();
      }
    } catch {
      // Safe fail
    }
  }

  public getDiagnosticLogs(): DiagnosticLogEntry[] {
    return [...this.inMemoryDiagnostics];
  }

  public clearDiagnostics(): void {
    this.inMemoryDiagnostics = [];
  }
}

export const observability = new ObservabilityManager();

export function trackError(
  error: Error | string,
  context?: Record<string, any>
): void {
  observability.trackError(error, context);
}

export function trackWarning(
  message: string,
  context?: Record<string, any>
): void {
  observability.trackWarning(message, context);
}

export function trackPerformance(
  operation: string,
  durationMs: number
): void {
  observability.trackPerformance(operation, durationMs);
}

export function getDiagnosticLogs(): DiagnosticLogEntry[] {
  return observability.getDiagnosticLogs();
}

export function clearDiagnostics(): void {
  observability.clearDiagnostics();
}
