import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ResultCard } from "@/components/pages/mock-interviews/chat/result-card";
import { DEMO_REPORT } from "@/lib/mock-interview-demo-script";

describe("mock interview tour anchors", () => {
  it("ResultCard exposes score + breakdown anchors", () => {
    const { container } = render(<ResultCard data={DEMO_REPORT} />);
    expect(container.querySelector('[data-tour="mi-result-score"]')).not.toBeNull();
    expect(container.querySelector('[data-tour="mi-result-breakdown"]')).not.toBeNull();
  });
});
