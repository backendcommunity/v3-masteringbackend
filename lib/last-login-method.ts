export type LoginMethod = "email" | "google" | "github";

const KEY = "mb_last_login_method";
// OAuth leaves the site and comes back through the API's callback, so the
// click is not proof of a login: the visitor can cancel on Google's screen.
// Park the choice per tab and promote it only once a session is confirmed.
const PENDING_KEY = "mb_pending_login_method";
const METHODS: LoginMethod[] = ["email", "google", "github"];

function isMethod(value: string | null): value is LoginMethod {
  return value !== null && (METHODS as string[]).includes(value);
}

export function getLastLoginMethod(): LoginMethod | null {
  try {
    const value = localStorage.getItem(KEY);
    return isMethod(value) ? value : null;
  } catch {
    return null;
  }
}

export function setLastLoginMethod(method: LoginMethod) {
  try {
    localStorage.setItem(KEY, method);
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // storage blocked (private mode) — the hint is optional
  }
}

/** Remember an OAuth choice until the session it starts is confirmed. */
export function setPendingLoginMethod(method: LoginMethod) {
  try {
    sessionStorage.setItem(PENDING_KEY, method);
  } catch {
    // storage blocked — the hint is optional
  }
}

/** Drop an OAuth choice that never produced a session (e.g. cancelled). */
export function clearPendingLoginMethod() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // storage blocked — nothing to clear
  }
}

/** Call once a signed-in user is confirmed: the pending OAuth choice worked. */
export function commitPendingLoginMethod() {
  try {
    const pending = sessionStorage.getItem(PENDING_KEY);
    if (isMethod(pending)) setLastLoginMethod(pending);
  } catch {
    // storage blocked — the hint is optional
  }
}
