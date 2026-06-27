import {
  render as rtlRender,
  screen as rtlScreen,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../components/theme";
import EasyButton from "../../components/easy-button";
import { render, screen } from "../../test/test-utils";

describe("EasyButton-ManualWrap", () => {
  it("renders with light theme styles", () => {
    // render EasyButton wrapped in ThemeProvider with initialTheme="light"
    // assert backgroundColor and color match light theme
    // hint: same as exercise 3, but now use initialTheme prop explicitly
    rtlRender(
      <ThemeProvider initialTheme={"light"}>
        <EasyButton>Easy</EasyButton>
      </ThemeProvider>,
    );

    const easyBtn = rtlScreen.getByRole("button", { name: /easy/i });
    expect(easyBtn).toHaveStyle({
      color: "rgb(0,0,0)",
      backgroundColor: "rgb(255,255,255)",
    });
  });

  it("renders with dark theme styles", () => {
    // same but initialTheme="dark"
    // dark theme: backgroundColor: black, color: white
    // hint: rgb(0,0,0) and rgb(255,255,255) — remember jsdom color normalization
    rtlRender(
      <ThemeProvider initialTheme={"dark"}>
        <EasyButton>Easy</EasyButton>
      </ThemeProvider>,
    );

    const easyBtn = rtlScreen.getByRole("button", { name: /easy/i });
    expect(easyBtn).toHaveStyle({
      backgroundColor: "rgb(0,0,0)",
      color: "rgb(255,255,255)",
    });
  });
});

describe("EasyButton-RTL-Wrapper", () => {
  it("renders with light theme styles", () => {
    rtlRender(<EasyButton>Easy</EasyButton>, {
      wrapper: ({ children }) => {
        return <ThemeProvider initialTheme={"light"}>{children}</ThemeProvider>;
      },
    });

    const easyBtn = rtlScreen.getByRole("button", { name: /easy/i });
    expect(easyBtn).toHaveStyle({
      color: "rgb(0,0,0)",
      backgroundColor: "rgb(255,255,255)",
    });
  });

  it("renders with dark theme styles", () => {
    rtlRender(<EasyButton>Easy</EasyButton>, {
      wrapper: ({ children }) => {
        return <ThemeProvider initialTheme={"dark"}>{children}</ThemeProvider>;
      },
    });

    const easyBtn = rtlScreen.getByRole("button", { name: /easy/i });
    expect(easyBtn).toHaveStyle({
      backgroundColor: "rgb(0,0,0)",
      color: "rgb(255,255,255)",
    });
  });
});

describe("EasyButton-CustomRender", () => {
  it("renders with light theme styles", () => {
    render(<EasyButton>Easy</EasyButton>, {
      theme: "light",
    });

    const easyBtn = screen.getByRole("button", { name: /easy/i });
    expect(easyBtn).toHaveStyle({
      color: "rgb(0,0,0)",
      backgroundColor: "rgb(255,255,255)",
    });
  });

  it("renders with dark theme styles", () => {
    render(<EasyButton>Easy</EasyButton>, {
      theme: "dark",
    });

    const easyBtn = screen.getByRole("button", { name: /easy/i });
    expect(easyBtn).toHaveStyle({
      backgroundColor: "rgb(0,0,0)",
      color: "rgb(255,255,255)",
    });
  });
});
