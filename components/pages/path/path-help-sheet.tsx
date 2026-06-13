"use client";

import {
  Info,
  ListTree,
  BarChart2,
  MousePointerClick,
  MessageSquare,
  Code2,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const HELP_ITEMS = [
  {
    value: "outline",
    icon: ListTree,
    title: "Path Outline",
    content:
      "Open the outline from the top centre (the ☰ button with the lesson title) to see every step in this path and jump to any of them.",
  },
  {
    value: "progress",
    icon: BarChart2,
    title: "Progress & Points",
    content:
      "The dots at the bottom show your progress through the current milestone. The points in the top right reflect the mastery you've earned across the path.",
  },
  {
    value: "complete",
    icon: MousePointerClick,
    title: "Completing a Step",
    content:
      "Use the Next button (bottom right) to mark the current step complete and move on. Videos also auto-complete once you've watched them.",
  },
  {
    value: "panel",
    icon: MessageSquare,
    title: "Lesson Panel",
    content:
      "The left panel holds the lesson Overview and the video Transcript. You can also ask a question about the lesson from the box at the bottom.",
  },
  {
    value: "exercise",
    icon: Code2,
    title: "Coding Exercises",
    content:
      "Read the brief on the left, then write your solution in the editor. 'Run Code' executes it and shows the result in the Output panel below; 'Submit Answer' checks it and completes the step. Stuck? 'Take Hint' costs a little XP. Toggle the editor between dark and light, collapse the instructions or the output, and drag the dividers to resize each panel.",
  },
  {
    value: "mock-interview",
    icon: Mic,
    title: "Mock Interviews",
    content:
      "Kap, your AI interviewer, runs the session in whichever format this interview uses. Voice/video: speak with Kap — the video is on the left with a live transcript below it (drag the divider to resize). Chat: read Kap's questions and type your answers in the message box; replies stream into the conversation. Either way, use the Code Editor and Whiteboard tabs on the right and hit 'Send to Kap' to share your code or diagram during the interview — it appears in the transcript. The countdown next to your points shows the time left and the interview ends automatically at zero; use 'End Interview' (top right) to finish early. For voice/video, allow microphone (and camera) access when prompted.",
  },
];

export function PathHelpSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Info className="w-4 h-4" />
          <span className="sr-only">Help</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[88vw] max-w-[320px] sm:w-[320px] p-0 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="text-sm">Help</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <Accordion type="single" collapsible defaultValue="outline">
            {HELP_ITEMS.map(({ value, icon: Icon, title, content }) => (
              <AccordionItem key={value} value={value}>
                <AccordionTrigger className="text-sm py-3 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    {title}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    {content}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}
