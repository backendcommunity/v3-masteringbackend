/**
 * Strip HTML tags from a string and decode HTML entities
 */
export function stripHtmlTags(html: string): string {
  if (!html) return "";

  // SSR / non-DOM environments: no document, so strip tags + decode the common
  // entities with a regex fallback (keeps the server render from crashing).
  if (typeof document === "undefined") {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Create a temporary element to parse HTML
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Get text content (automatically decodes entities and removes tags)
  return temp.textContent || temp.innerText || "";
}

/**
 * Escape HTML special characters to prevent rendering
 */
export function escapeHtml(text: string): string {
  if (!text) return "";

  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}
