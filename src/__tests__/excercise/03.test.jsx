// avoid implementation details
// http://localhost:5173/easy-button

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EasyButton from "../../components/easy-button.jsx";
import { ThemeProvider } from "../../components/theme.jsx";

describe("EasyButton", () => {
  it("renders with the light styles for the light theme", async () => {
    // 1. render <EasyButton>Easy</EasyButton> wrapped in <ThemeProvider>
    // 2. query the button by role + accessible name (the button's own text, "Easy")
    // 3. assert it has the light theme's background/color via toHaveStyle
    //    hint: jest-dom matcher toHaveStyle({ backgroundColor: '...', color: '...' })

    render(
      <ThemeProvider>
        <EasyButton>Easy</EasyButton>
      </ThemeProvider>,
    );
    // screen.debug();
    const btn = screen.getByRole("button", { name: /easy/i });
    expect(btn).toHaveStyle({
      color: "rgb(0, 0, 0)",
      backgroundColor: "rgb(255, 255, 255)",
    });
  });
});
