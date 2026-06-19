// simple test with ReactDOM
// http://localhost:5173/counter

import { afterEach, describe, expect, it } from "vitest";
import Counter from "../../components/counter.jsx";
import ReactDOM from "react-dom/client";
import { act } from "react";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("COUNTER", () => {
  it("counter increments and decrements when the buttons are clicked", () => {
    let el = document.createElement("div");
    document.body.append(el);
    let rootEL = ReactDOM.createRoot(el);
    act(() => {
      rootEL.render(<Counter />);
    });
    let [decrementBtn, incrementBtn] = el.querySelectorAll("button");
    const messageDiv = el.firstChild.firstChild;

    expect(messageDiv).toHaveTextContent("Current count: 0");
    let clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    act(() => {
      incrementBtn.dispatchEvent(clickEvent);
    });
    expect(messageDiv).toHaveTextContent("Current count: 1");

    act(() => {
      decrementBtn.dispatchEvent(clickEvent);
    });
    expect(messageDiv).toHaveTextContent("Current count: 0");
  });
});
