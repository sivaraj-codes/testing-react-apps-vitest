import { render as rtlRender } from "@testing-library/react";
import { ThemeProvider } from "../components/theme";

function render(ui, { theme = "light", ...options }) {
  function wrapperFunc({ children }) {
    return <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>;
  }

  return rtlRender(ui, { wrapper: wrapperFunc, ...options });
}

export * from "@testing-library/react";
// re-export everything from RTL so test files can import from test-utils
// instead of @testing-library/react and get all the same APIs

// override the default render with our custom one
export { render };
