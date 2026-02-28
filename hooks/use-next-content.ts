/**
 * useNextContent Hook
 * Epic 7, Story 7.1: Auto-Progression Learning Flow
 *
 * Fetches and manages the next content in the learning progression
 * Used by course-watch component to determine next video/quiz/exercise
 */

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";

export interface NextContent {
  type: "VIDEO" | "QUIZ" | "EXERCISE" | "CHAPTER" | null;
  id: string | null;
  title: string | null;
  slug: string | null;
  chapterId: string | null;
  required: boolean;
  metadata?: {
    position?: number;
    score?: number;
    description?: string;
  };
}

interface UseNextContentOptions {
  enabled?: boolean; // Allow disabling the hook
  onSuccess?: (content: NextContent | null) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to fetch next content after video completion
 * @param courseId - Current course ID
 * @param chapterId - Current chapter ID
 * @param videoId - Just-completed video ID
 * @param options - Optional callbacks and configuration
 * @returns { nextContent, loading, error, fetchNextContent }
 */
export function useNextContent(
  courseId: string,
  chapterId: string,
  videoId: string,
  options: UseNextContentOptions = {},
) {
  const { enabled = true, onSuccess, onError } = options;

  const store = useAppStore();
  const [nextContent, setNextContent] = useState<NextContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch next content from backend
   */
  const fetchNextContent = useCallback(async () => {
    if (!enabled || !courseId || !chapterId || !videoId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const content = await store.getNextContent(courseId, chapterId, videoId);

      setNextContent(content);

      if (onSuccess) {
        onSuccess(content);
      }

      return content;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch next content");
      setError(error);

      if (onError) {
        onError(error);
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [courseId, chapterId, videoId, enabled, store, onSuccess, onError]);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setNextContent(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    nextContent,
    loading,
    error,
    fetchNextContent,
    reset,
  };
}

export default useNextContent;
