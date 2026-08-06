import { toast } from "sonner";

/**
 * Opens a GitHub connect/reconnect URL in a centered popup instead of
 * navigating the whole page away. `onClose` fires once the user closes the
 * popup (whether they completed the flow or gave up) — the caller re-fetches
 * connection status either way, there's no separate "success" signal needed
 * because the popup's final page (our own return-URL redirect) auto-closes
 * itself (see the effect in project-playground.tsx).
 */
export function openGithubPopup(url: string, onClose: () => void): Window | null {
  const width = 600;
  const height = 700;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;

  const popup = window.open(
    url,
    "github-connect",
    `width=${width},height=${height},left=${left},top=${top}`,
  );

  const interval = setInterval(() => {
    if (popup?.closed) {
      clearInterval(interval);
      onClose();
    }
  }, 500);

  return popup;
}

// Append the current page as the return target. Academy hands back install URLs
// already ending at `state=<email>+`; for auth URLs we add the return as a
// `redirect_uri`-friendly suffix the same way (academy appends to `state`).
export function withReturn(url: string): string {
  const path = window.location.pathname || "/";
  return url + encodeURIComponent(window.location.origin + path);
}

// Wraps openGithubPopup with a user-facing warning if the browser blocked the
// popup outright (window.open returned null) — otherwise the caller gets no
// feedback and the connect flow silently goes nowhere.
export function openPopupOrWarn(url: string, onClose: () => void): void {
  const popup = openGithubPopup(url, onClose);
  if (!popup) {
    toast.error("Popup blocked. Please allow popups for this site and try again.");
  }
}
