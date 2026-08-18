export const PROJECT_EVENTS = {
  viewed: "project_viewed",
  cardClicked: "project_card_clicked",
  startClicked: "project_start_clicked",
  filterApplied: "project_filter_applied",
  bookmarkToggled: "project_bookmark_toggled",
  tryPlaygroundClicked: "project_try_playground_clicked",
} as const;

export const PLAYGROUND_EVENTS = {
  opened: "playground_opened",
  fileOpened: "playground_file_opened",
  fileCreated: "playground_file_created",
  fileDeleted: "playground_file_deleted",
  fileEdited: "playground_file_edited",
  taskOpened: "playground_task_opened",
  taskTestRun: "playground_task_test_run",
  taskCompleted: "playground_task_completed",
  runServer: "playground_run_server",
  stopServer: "playground_stop_server",
  terminalToggled: "playground_terminal_toggled",
  previewToggled: "playground_preview_toggled",
  previewModeSwitched: "playground_preview_mode_switched",
  kapMessageSent: "playground_kap_message_sent",
  githubConnected: "playground_github_connected",
  githubConflict: "playground_github_conflict",
  githubConflictResolved: "playground_github_conflict_resolved",
  projectRestarted: "playground_project_restarted",
  projectDownloaded: "playground_project_downloaded",
  editorThemeSwitched: "playground_editor_theme_switched",
} as const;

/** Build a feature-namespaced tour event map, e.g. tourEvents("playground"). */
export const tourEvents = (prefix: string) =>
  ({
    offered: `${prefix}_tour_offered`,
    started: `${prefix}_tour_started`,
    skipped: `${prefix}_tour_skipped`,
    stepViewed: `${prefix}_tour_step_viewed`,
    completed: `${prefix}_tour_completed`,
    dismissed: `${prefix}_tour_dismissed`,
  }) as const;

// Back-compat: existing playground call sites + tests import TOUR_EVENTS.
export const TOUR_EVENTS = tourEvents("playground");
export const PLAYGROUND_TOUR_EVENTS = TOUR_EVENTS;

// Regional-pricing funnel: fired with { tier, country, cycle } so
// conversion can be read per tier in PostHog. `viewed` fires from the
// pricing page itself; `checkoutStarted`/`subscribed` belong to whichever
// surface owns checkout — defined here together so every stage of the
// funnel shares one event-name source of truth.
export const PRICING_EVENTS = {
  viewed: "pricing_viewed",
  checkoutStarted: "checkout_started",
  subscribed: "subscribed",
} as const;

export const MOCK_INTERVIEW_EVENTS = {
  templateViewed: "mock_interview_template_viewed",
  bookingOpened: "mock_interview_booking_opened",
  formatSelected: "mock_interview_format_selected",
  demoStarted: "mock_interview_demo_started",
  demoCompleted: "mock_interview_demo_completed",
  sessionStarted: "mock_interview_session_started",
  messageSent: "mock_interview_message_sent",
  completed: "mock_interview_completed",
  reportViewed: "mock_interview_report_viewed",
  bannerViewed: "mock_interview_banner_viewed",
  bannerCtaClicked: "mock_interview_banner_cta_clicked",
  bannerDismissed: "mock_interview_banner_dismissed",
  demoCtaShown: "mock_interview_demo_cta_shown",
  demoCtaClicked: "mock_interview_demo_cta_clicked",
} as const;
