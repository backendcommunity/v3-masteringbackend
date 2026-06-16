/**
 * Consume a fetch `ReadableStream` of Server-Sent-Events, parsing each `data:`
 * line as JSON and invoking `onEvent` with the parsed object.
 *
 * Handles the two streaming gotchas: events split across `read()` chunk
 * boundaries (buffered until a newline) and a final line not terminated by a
 * trailing newline (flushed after the stream ends). The caller owns the reader
 * lifecycle (cancel/abort) and any error handling — this only reads + parses.
 */
export async function readSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEvent: (data: any) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";

  const emit = (line: string) => {
    if (!line.startsWith("data:")) return;
    const jsonStr = line.slice(5).trim();
    if (!jsonStr) return;
    try {
      onEvent(JSON.parse(jsonStr));
    } catch {
      // skip malformed line
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) emit(line);
  }
  if (buffer) emit(buffer);
}
