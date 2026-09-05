import { useCallback, useEffect, useState } from "react";

export const LS = {
  brandKit: "bogen_brand_kit",
  apiSettings: "bogen_api_settings",
  activeTab: "bogen_active_tab",
  activeSlides: "bogen_active_slides",
  currentTopic: "bogen_current_topic",
  cta: "onyx_carousel_cta",
  handle: "onyx_carousel_handle",
  count: "onyx_carousel_count",
  audience: "onyx_carousel_audience",
  design: "onyx_carousel_design",
  brief: "onyx_carousel_brief",
  useClone: "onyx_carousel_use_clone",
  seriesQueue: "onyx_series_queue",
  sidebarCollapsed: "onyx_sidebar_collapsed",
  motifHistory: "onyx_motif_history",
  history: "onyx_history",
  cloneProfiles: "onyx_ai_clone_profiles",
  activeCloneId: "onyx_ai_clone_active_id",
  directPromptImages: "onyx_direct_prompt_images",
  directPromptUseClone: "onyx_direct_prompt_use_clone",
} as const;

export function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeLS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

/**
 * localStorage-backed state. Reads after mount so SSR and hydration match.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(readLS<T>(key, initial));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (hydrated) writeLS(key, value);
  }, [key, value, hydrated]);

  const reset = useCallback(() => setValue(initial), [initial]);

  return [value, setValue, hydrated, reset] as const;
}
