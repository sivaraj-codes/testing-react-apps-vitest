import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Counter from "../../components/counter";
import userEvent from "@testing-library/user-event";

// Unlike exercise 1 (raw ReactDOM): render() handles mount + act() internally.
// getByRole queries the accessibility tree (resilient to markup changes).
// userEvent simulates real interaction sequences; always await — v14+ is async.

describe("Counter (RTL)", () => {
  it("counter increments and decrements when the buttons are clicked", async () => {
    // 1. render(<Counter />) — no manual container, no manual act()
    // 2. find the increment/decrement buttons via screen.getByText (not querySelectorAll) or getByRole and accessible name
    // 3. find the message div via screen.getByText (matching "Current count: 0")
    // 4. assert initial state
    // 5. click increment — but how do you click without dispatchEvent or act()?
    //    hint: fireEvent is RTL's built-in event dispatcher, already act()-wrapped internally
    // 6. assert count is 1
    // 7. click decrement, assert count is 0

    let user = userEvent.setup();

    render(<Counter />);
    let incrementBtn = screen.getByRole("button", { name: /increment/i });
    let decrementBtn = screen.getByRole("button", { name: /decrement/i });
    let messageEl = screen.getByText(/current count/i);
    expect(messageEl).toHaveTextContent("Current count: 0");
    await user.click(incrementBtn);
    expect(messageEl).toHaveTextContent("Current count: 1");
    await user.click(decrementBtn);
    expect(messageEl).toHaveTextContent("Current count: 0");
    // screen.debug();
  });
});
