/**
 * Opens a GitHub connect/reconnect URL in a centered popup instead of
 * navigating the whole page away. `onClose` fires once the user closes the
 * popup (whether they completed the flow or gave up) — the caller re-fetches
 * connection status either way, there's no separate "success" signal needed
 * because the popup's final page (our own return-URL redirect) auto-closes
 * itself (see the effect in project-playground.tsx).
 */
export function openGithubPopup(url: string, onClose: () => void): void {
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
}
