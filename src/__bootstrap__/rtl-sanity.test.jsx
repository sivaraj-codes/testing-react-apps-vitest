import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

function Greeting() {
  return <div>Hello there</div>;
}

describe("RTL sanity check", () => {
  it("renders and queries the DOM", () => {
    render(<Greeting />);
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });
});
