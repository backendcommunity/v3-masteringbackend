/**
 * Sentry Service - Professional error tracking and monitoring
 * Configured for free plan with quota-conscious settings
 *
 * Usage:
 * - captureError(error) - Capture an error with context
 * - captureMessage(message, level) - Capture a message/info
 * - setUserContext(userId, email) - Set user context for errors
 * - clearUserContext() - Clear user context on logout
 * - captureMetric(name, value) - Track custom metrics
 */

import * as Sentry from "@sentry/nextjs";

const isProd =
  (process.env.NEXT_PUBLIC_NODE_ENV ?? process.env.NODE_ENV)?.toLowerCase() ===
  "production";

/**
 * Capture error with automatic context
 * Only captures in production. In development, logs to console instead.
 * Override with SENTRY_DEBUG=true to test in development
 */
export const captureError = (
  error: Error | string,
  context?: Record<string, any>,
  level: "fatal" | "error" | "warning" = "error",
) => {
  // Skip in development unless explicitly debugging
  if (!isProd && !process.env.SENTRY_DEBUG) {
    console.error("[Dev Mode - Sentry Disabled]", error, context);
    return;
  }

  Sentry.captureException(
    error instanceof Error ? error : new Error(String(error)),
    {
      level,
      contexts: {
        custom: context,
      },
    },
  );
};

/**
 * Capture an informational message
 * Only in production. Useful for tracking important business events.
 */
export const captureMessage = (
  message: string,
  level: "info" | "warning" = "info",
) => {
  // Skip in development unless explicitly debugging
  if (!isProd && !process.env.SENTRY_DEBUG) {
    console.log(`[Dev Mode - ${level}]`, message);
    return;
  }

  Sentry.captureMessage(message, level);
};

/**
 * Set user context for error tracking
 * Call this after successful authentication
 */
export const setUserContext = (
  userId: string,
  email?: string,
  name?: string,
) => {
  Sentry.setUser({
    id: userId,
    email: email || undefined,
    username: name || undefined,
  });
};

/**
 * Clear user context
 * Call this on logout
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging (activity trail of what happened)
 * Only in production. Override with SENTRY_DEBUG=true to test.
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, any>,
  level: "debug" | "info" | "warning" = "info",
) => {
  // Skip in development unless explicitly debugging
  if (!isProd && !process.env.SENTRY_DEBUG) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Capture API error with automatic URL and status code context
 * Useful for tracking backend API failures
 */
export const captureApiError = (
  error: Error | string,
  endpoint: string,
  statusCode?: number,
  method: string = "GET",
) => {
  captureError(error, {
    type: "api_error",
    endpoint,
    method,
    statusCode,
  });
};

/**
 * Safe wrapper for async operations with automatic error capture
 * Useful for wrapping promise chains
 */
export const captureAsync = async <T>(
  promise: Promise<T>,
  operation: string,
): Promise<T | null> => {
  try {
    return await promise;
  } catch (error: any) {
    captureError(error, { operation }, "error");
    return null;
  }
};

/**
 * Add performance monitoring context
 * Call before operations that might be slow
 */
export const startTransaction = (name: string, op: string = "operation") => {
  return Sentry.startTransaction({
    name,
    op,
    timeout: 3000, // 3s timeout on free plan to avoid overhead
  });
};
