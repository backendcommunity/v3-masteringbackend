import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageSkeleton } from "../ui/page-skeleton";

describe("PageSkeleton", () => {
  it("renders 5 placeholder rows by default", () => {
    render(<PageSkeleton />);
    expect(screen.getAllByTestId("page-skeleton-row")).toHaveLength(5);
  });

  it("renders a custom number of rows", () => {
    render(<PageSkeleton rows={2} />);
    expect(screen.getAllByTestId("page-skeleton-row")).toHaveLength(2);
  });
});
