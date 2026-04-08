const ANALYTICS_KEY = "sipnote_analytics";

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}

export const analyticsService = {
  track(event: string, properties?: Record<string, string | number | boolean>): void {
    try {
      // PII filter: only allow known safe property keys
      const SAFE_KEYS = new Set(["category", "baseSpirit", "mode", "feature", "page", "count", "rating"]);
      const safeProps = properties
        ? Object.fromEntries(Object.entries(properties).filter(([k]) => SAFE_KEYS.has(k)))
        : undefined;

      const events = this.getAll();
      events.push({
        event,
        properties: safeProps,
        timestamp: new Date().toISOString(),
      });
      // Keep last 1000 events, auto-prune older than 30 days
      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
      const trimmed = events.filter((e) => e.timestamp >= cutoff).slice(-1000);
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmed));
    } catch {
      // Silent fail for analytics
    }
  },

  getAll(): AnalyticsEvent[] {
    try {
      const raw = localStorage.getItem(ANALYTICS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getCount(event: string, sinceDays?: number): number {
    const events = this.getAll();
    const cutoff = sinceDays
      ? new Date(Date.now() - sinceDays * 86400000).toISOString()
      : "";
    return events.filter(
      (e) => e.event === event && (!cutoff || e.timestamp >= cutoff)
    ).length;
  },

  getSummary(): Record<string, number> {
    const events = this.getAll();
    const summary: Record<string, number> = {};
    events.forEach((e) => {
      summary[e.event] = (summary[e.event] || 0) + 1;
    });
    return summary;
  },

  clear(): void {
    localStorage.removeItem(ANALYTICS_KEY);
  },
};

// Event name constants
export const EVENTS = {
  SIGNUP: "user_signup",
  LOGIN: "user_login",
  ONBOARDING_COMPLETE: "onboarding_complete",
  ONBOARDING_SKIP: "onboarding_skip",
  RECORD_CREATED: "record_created",
  RECORD_QUICK: "record_quick_mode",
  RECORD_FULL: "record_full_mode",
  SHARE_CLICKED: "share_clicked",
  SHARE_DOWNLOADED: "share_downloaded",
  SHARE_SHARED: "share_shared",
  RECOMMENDATION_CLICKED: "recommendation_clicked",
  RECOMMENDATION_REFRESHED: "recommendation_refreshed",
  EXPLORE_CATEGORY: "explore_category_clicked",
  FEATURE_UNLOCKED: "feature_unlocked",
  PAGE_VIEW: "page_view",
} as const;
