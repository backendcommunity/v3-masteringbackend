/**
 * Strip HTML tags from a string and decode HTML entities
 */
export function stripHtmlTags(html: string): string {
  if (!html) return "";

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
