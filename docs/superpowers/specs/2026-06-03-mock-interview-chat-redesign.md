# Mock Interview Chat Interface Redesign

**Date:** 2026-06-03  
**Status:** Approved  
**Branch:** feat/mock-interview

---

## Problem

The chat-based mock interview UI has component interface mismatches that prevent it from building:

- `chat-panel.tsx` uses an old interface; `chat-interview-room.tsx` passes a newer, richer prop set
- `TypingIndicator` and `StreamingMessage` are imported but never exported from `chat-message.tsx`
- No resizable divider between chat and code/whiteboard panels
- Code editor has no starter template — blank on open
- Per-response score badges not showing (missing `resultsRevealed` wire-up)

---

## Architecture

### Layout (full-screen, no nav/sidebar)

```
┌─────────────────────────────────────────────────────────────┐
│ Header: [Kap icon] [Template title]   [Timer]   [?] [End]   │
├────────────────────────────┬───────────────────────────────-─┤
│                            │ [Code Editor] [Whiteboard]  tabs│
│   Chat Panel               │─────────────────────────────────│
│   ─ AI messages            │                                 │
│   ─ User messages          │   Monaco Editor (dark)          │
│     + score badges         │   OR                            │
│     (after results)        │   Excalidraw (light canvas)     │
│                            │                                 │
│   [ResultCard inline]      │   [Send to Kap ▶]               │
│   after interview done     │                                 │
├────────────────────────────┤                                 │
│ 0 / 10 Responses           │                                 │
│ [textarea          ] [🎤]  │                                 │
└────────────────────────────┴─────────────────────────────────┘
                        ↑
               Drag-resizable divider (25%–75%)
```

### Panels

**Left panel (Chat):**
- Scrollable message list
- AI messages: avatar (K diamond, brand blue #13AECE) + prose text
- User messages: right-aligned bubble + score pill badge when `resultsRevealed`
- Streaming state: TypingIndicator dots when AI message content is empty; blinking cursor when content is flowing
- Completion footer: "Get Feedback" button → polls report → shows ResultCard inline
- Input: auto-grow textarea + mic button (voice input) + send on Enter

**Right panel (Code / Whiteboard tabs):**
- Tab switcher: Code Editor | Whiteboard
- Code Editor (Monaco): dark theme, language selector, starter template per language, "Send to Kap" button
- Whiteboard (Excalidraw): light theme, "Send to Kap" floating button, library loaded from `/mb.excalidrawlib`
- Both panels resizable via drag on the divider

**Header:**
- Template name + countdown timer (turns amber < 5 min, red < 1 min + pulse)
- Help sheet (accordion FAQ)
- "End Interview" with confirmation dialog

---

## Data Flow

```
User types → handleSend() in ChatInterviewRoom
  → optimistic user msg added to messages[]
  → empty AI msg added (placeholder)
  → streamChatMessage() → fetch SSE
    → "token" events → update AI placeholder message content
    → "done" event → setIsComplete(true) if isComplete
  → streaming ends → isStreaming = false

Interview complete:
  → ResultCard polling starts
  → GET /sessions/:id/report → 202 while PENDING/PROCESSING → retry
  → 200 COMPLETED → setResultsData() + setQuestionAnalysis() + setResultsRevealed(true)
  → ChatPanel renders ResultCard inline
  → User messages get score badges revealed
```

---

## File Changes (frontend only — backend unchanged)

### 1. `chat-message.tsx`
- Add `TypingIndicator` export: 3 bouncing dots with K avatar
- Add `StreamingMessage` export: for external use if needed
- Update `ChatMessageBubble`: add `isStreaming?: boolean` prop for cursor; add score pill badge on user messages when `analysis` provided

**Score pill badge colors:**
- score >= 70 → green ("Good" / "Excellent")
- score >= 50 → amber ("Average")
- score < 50 → red ("Below Average")

### 2. `chat-panel.tsx` (full rewrite)
New interface:
```typescript
interface ChatPanelProps {
  messages: ChatMessage[];
  session: ChatInterviewSession;
  isComplete: boolean;
  isStreaming: boolean;
  onSend: (content: string) => void;
  resultsData: ReportData | null;
  isLoadingResults: boolean;
  resultsError: string | null;
  onGetResults: () => void;
  questionAnalysis: Array<{ score: number; feedback: string }>;
  resultsRevealed: boolean;
}
```

Logic:
- Render messages; pass `analysis` for user messages when `resultsRevealed`
- Show `TypingIndicator` when `isStreaming && lastMsg.role === 'ai' && !lastMsg.content`
- Show response counter: `userMsgCount / (session.template.questions || 10) Responses`
- When `isComplete`:
  - Show completion banner with "Get Feedback" button → `onGetResults()`
  - Show `<ResultCard data={resultsData} />` inline below messages when data exists
  - Show loading spinner while `isLoadingResults`
  - Show error text if `resultsError`

### 3. `chat-interview-room.tsx`
- Add `leftWidth: number` state (default 45%)
- Add drag handle between panels
- Mouse events: `onMouseDown` → track delta → update `leftWidth` clamped to 25–75%
- Touch support for mobile not needed (right panel hidden on mobile anyway)

### 4. `code-editor-panel.tsx`
- Add `STARTER_TEMPLATES` map: JS, TS, Python, Java, Go, Rust, C++, SQL
- Initialize editor with template when language selected (and no saved code)
- Preserve user edits when language switches only if code was modified from template

---

## UX Details

- **Score badges**: Pill below user message bubble: `●●● Below Average` in red
- **TypingIndicator**: 3 dots bounce with stagger delay; same K avatar
- **Resizer cursor**: `cursor-col-resize` on divider hover
- **Resizer visual**: 4px wide, bg-border with hover:bg-primary/30
- **ResultCard**: Already implemented well; rendered inline after "Get Feedback"

---

## Non-Goals

- No backend changes
- No new routes or pages
- No voice interview mode (LiveKit) changes
- No mobile layout changes (right panel already hidden)
- No PDF export changes
