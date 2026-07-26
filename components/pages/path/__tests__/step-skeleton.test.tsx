import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepSkeleton } from "../step-skeleton";

describe("StepSkeleton", () => {
  it("renders the step skeleton container", () => {
    render(<StepSkeleton />);
    expect(screen.getByTestId("step-skeleton")).toBeInTheDocument();
  });
});
