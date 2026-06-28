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

export const TOUR_EVENTS = {
  offered: "playground_tour_offered",
  started: "playground_tour_started",
  skipped: "playground_tour_skipped",
  stepViewed: "playground_tour_step_viewed",
  completed: "playground_tour_completed",
  dismissed: "playground_tour_dismissed",
} as const;
