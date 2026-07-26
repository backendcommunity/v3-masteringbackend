import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoursesSkeleton } from "../courses-skeleton";

describe("CoursesSkeleton", () => {
  it("renders 8 card placeholders by default", () => {
    render(<CoursesSkeleton />);
    expect(screen.getAllByTestId("courses-skeleton-card")).toHaveLength(8);
  });

  it("renders a custom count", () => {
    render(<CoursesSkeleton count={3} />);
    expect(screen.getAllByTestId("courses-skeleton-card")).toHaveLength(3);
  });
});
