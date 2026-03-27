/**
 * Analytics module for PostHog integration
 * Tracks user events, identifies users, and monitors page views
 */

import posthog from "posthog-js";

export const analytics = {
  /**
   * Track analytics events with PostHog
   * @param eventName - Name of the event to track
   * @param properties - Event properties/context
   */
  track: (eventName: string, properties?: Record<string, any>) => {
    try {
      posthog.capture(eventName, properties);
    } catch (error) {
      console.warn(`Analytics tracking failed: ${eventName}`, error);
    }
  },

  /**
   * Identify user for analytics
   * @param userId - Unique user identifier
   * @param traits - User traits/properties
   */
  identify: (userId: string, traits?: Record<string, any>) => {
    try {
      posthog.identify(userId, traits);
    } catch (error) {
      console.warn(`Analytics identify failed: ${userId}`, error);
    }
  },

  /**
   * Page tracking
   * @param name - Page name
   * @param properties - Page properties
   */
  page: (name: string, properties?: Record<string, any>) => {
    try {
      posthog.capture("$pageview", {
        page_name: name,
        ...properties,
      });
    } catch (error) {
      console.warn(`Analytics page tracking failed: ${name}`, error);
    }
  },
};

export default analytics;
