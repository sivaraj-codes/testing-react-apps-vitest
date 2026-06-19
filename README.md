# Testing React Apps — Vite + Vitest + MSW v2 Edition

A from-scratch rebuild of Kent C. Dodds' [Testing React Apps](https://github.com/kentcdodds/testing-react-app)
workshop, originally built on CRA + Jest + MSW v0. This version uses the current
frontend testing stack: **Vite, Vitest, React Testing Library, and MSW v2**.

The goal isn't just to finish the exercises — it's to feel the actual differences
between the Jest/CRA toolchain and the Vite/Vitest toolchain, since that migration
is something you'll likely run into in real codebases.

---

## Stack

| Tool | Version (at time of setup) | Replaces |
|---|---|---|
| Vite | ^8.x | CRA (`react-scripts`) |
| React | ^18.3.1 (pinned, not 19) | — |
| Vitest | ^4.x | Jest |
| @testing-library/react | latest | same (unchanged) |
| @testing-library/jest-dom | latest, via `/vitest` entry point | same (unchanged) |
| @testing-library/user-event | v14+ (async API) | same lib, breaking API change |
| MSW | v2 (when we get there — exercise 5) | MSW v0.42 |
| react-router-dom | v6 | — (not in original workshop, added for local browsing) |

React is intentionally pinned to **18**, not 19 — some patterns in this workshop
(notably `act()` semantics and hook testing in exercise 8) assume React 18
behavior, and staying on 18 avoids unrelated debugging noise.

---

## Setup steps (in order)

### 1. Scaffold the project

```bash
npm create vite@latest testing-react-apps -- --template react
cd testing-react-apps
npm install
npm install react@18 react-dom@18
```

Vite's template defaults to the latest React, so we explicitly pin back to 18
right after scaffolding.

Also align the type definitions (matters for editor intellisense even in plain
JS, since VS Code reads `@types/react` for JSX autocomplete):

```bash
npm install --save-dev @types/react@18 @types/react-dom@18
```

### 2. Install Vitest + jsdom

```bash
npm install --save-dev vitest jsdom
```

Vite's default test environment is `'node'` (no DOM at all). Since every
exercise here renders React components, we need jsdom simulating a browser.
CRA/Jest had this baked in invisibly — Vitest requires it explicitly.

Create **`vitest.config.js`**:

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
})
```

Add to `package.json` scripts:

```json
"scripts": {
  "test": "vitest"
}
```

### 3. Install React Testing Library + jest-dom matchers

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Create **`src/test/setup.js`**:

```js
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Tells React it's safe to assume act() boundaries are being tracked.
// Without this, React doesn't know it's in a test environment and prints
// "current testing environment is not configured to support act(...)"
// warnings even when act() is used correctly.
globalThis.IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  cleanup()
})
```

Two non-obvious things baked into this file:

- **`@testing-library/jest-dom/vitest`** (not the plain `@testing-library/jest-dom`
  import) — this is the Vitest-specific entry point that calls `expect.extend()`
  against Vitest's `expect`, not Jest's. Importing the non-`/vitest` path is a
  common mistake in this exact migration and fails silently (matchers just don't
  exist).
- **Manual `cleanup()` in `afterEach`** — Jest+CRA auto-registered this via
  Jest's global lifecycle hooks. Vitest doesn't get it for free, so it's
  registered by hand. Without it, DOM nodes from one test leak into the next.

### 4. Naming conventions (decided after hitting real errors — see Gotchas)

- **Test files:** `0N.test.jsx` (Vitest's default discovery pattern requires
  `.test.` or `.spec.` in the filename — the original workshop's `01.js` /
  `02.js` naming doesn't get picked up without extra config).
- **Component files containing JSX:** must be `.jsx`, not `.js` — Vite's esbuild
  transform only applies JSX parsing to `.jsx`/`.tsx` by default.

### 5. Add `react-router-dom` for local browsing (not part of the original workshop)

```bash
npm install react-router-dom
```

The original workshop relied on a dev server with manual URL navigation
(`http://localhost:3000/counter`, etc.) baked into CRA's setup. To get the same
"click around and see each component" experience here, `App.jsx` defines a
simple route per component, wrapped in `BrowserRouter` at the root
(`main.jsx`). This is purely for manual browsing/sanity-checking components —
**none of the test exercises depend on routing.** Every exercise renders its
component directly via `render(<Component />)` inside the test itself.

---

## Project structure

```
src/
  components/
    counter.jsx
    easy-button.jsx
    login.jsx
    login-submission.jsx
    spinner.jsx
    theme.jsx
    use-counter.jsx
  test/
    setup.js              ✅ done
    server-handlers.js     ⏳ exercise 5 (MSW)
    server.js              ⏳ exercise 5 (MSW)
    test-utils.js           ⏳ exercise 7 (custom render w/ ThemeProvider)
  __tests__/
    exercise/
      01.test.jsx          ✅ done
      02.test.jsx           ⏳ next
      03.test.jsx
      04.test.jsx
      05.test.jsx
      06.test.jsx
      07.test.jsx
      08.test.jsx
  App.jsx                  — route index for manual browsing
  main.jsx                 — wraps App in BrowserRouter
  sanity.test.js            — kept intentionally, see below
  rtl-sanity.test.jsx        — kept intentionally, see below
```

`sanity.test.js` and `rtl-sanity.test.jsx` were originally throwaway files used
to verify the Vitest and RTL setup independently of the workshop exercises.
Keeping them intentionally as minimal reference scaffolds for bootstrapping
future projects — a fast way to confirm "is my Vitest+RTL config even working"
before writing real tests.

---

## Exercises

### Exercise 1 — simple test with ReactDOM (no testing library)
**Status: ✅ done**

The point of this exercise is to feel what React Testing Library abstracts
away, by doing it manually first: create a DOM node, mount with
`ReactDOM.createRoot`, dispatch real events, clean up by hand.

```jsx
// src/__tests__/exercise/01.test.jsx
import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import ReactDOM from "react-dom/client";
import Counter from "../../components/counter.jsx";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("COUNTER", () => {
  it("counter increments and decrements when the buttons are clicked", () => {
    let el = document.createElement("div");
    document.body.append(el);
    let rootEl = ReactDOM.createRoot(el);

    act(() => {
      rootEl.render(<Counter />);
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
```

**What this exercise actually taught (the bugs were the lesson):**

1. `ReactDOM.createRoot(...).render(...)` commits the *initial* mount
   synchronously enough for jsdom to see it immediately — `act()` isn't
   strictly required just for that first paint in this environment.
2. But **state updates triggered by dispatched events are not flushed
   synchronously** without `act()`. `dispatchEvent` in jsdom is not a real
   browser event loop tick, so React doesn't know to flush the resulting
   `setState` before your next assertion runs. Forgetting `act()` here means
   your assertion checks the DOM *before* React has applied the update —
   the test sees stale text content.
3. DOM traversal with raw `querySelector`/`firstChild` is fragile — easy to
   grab the wrong element (e.g. accidentally selecting the outer wrapper div
   instead of the inner count div, because `querySelector("div")` matches the
   *first* div found in a depth-first search, which may not be the one you
   meant). This fragility is exactly the problem React Testing Library's
   `screen.getByText(...)`-style queries solve in exercise 2.
4. `act()` warnings (`"current testing environment is not configured to
   support act(...)"`) are governed by a separate global flag,
   `IS_REACT_ACT_ENVIRONMENT`. You can use `act()` perfectly correctly and
   still see this warning if that flag isn't set to `true` — the warning is
   about whether React recognizes it's in a test environment at all, not
   whether your `act()` usage is correct.

### Exercise 2 — same test, with React Testing Library
**Status: ⏳ next**

### Exercise 3 — avoiding implementation details
**Status: ⏳ not started**

### Exercise 4 — form testing
**Status: ⏳ not started**

### Exercise 5 — mocking HTTP requests with MSW v2
**Status: ⏳ not started**

### Exercise 6 — mocking browser APIs / modules
**Status: ⏳ not started**

### Exercise 7 — context + custom render method
**Status: ⏳ not started**

### Exercise 8 — testing custom hooks
**Status: ⏳ not started**

---

## Gotchas log (things that broke, and why)

| Problem | Cause | Fix |
|---|---|---|
| Vitest doesn't discover `01.jsx` | Default `include` pattern requires `.test.`/`.spec.` in filename | Renamed all exercise files to `0N.test.jsx` |
| `Failed to parse source... contains invalid JS syntax` on a `.js` component file containing JSX | Vite's esbuild only applies JSX transform to `.jsx`/`.tsx` by default (CRA's Babel config treated all `.js` as JSX-capable; Vite doesn't) | Renamed all component files `.js` → `.jsx` |
| `toHaveTextContent` received `null` | Selector (`el.querySelector("div")`) matched the outer wrapper div, not the inner count div, because it's the first `div` found in document order | Selected explicitly via `el.firstChild.firstChild` instead of relying on `querySelector` |
| Count didn't update after `dispatchEvent` | `dispatchEvent` in jsdom doesn't auto-flush the resulting `setState` the way a real browser event does | Wrapped every `dispatchEvent` call (not just `render()`) in `act(() => {...})` |
| `act()` warning printed even though `act()` was used correctly | `IS_REACT_ACT_ENVIRONMENT` global flag wasn't set — React didn't know it was in a test environment | Added `globalThis.IS_REACT_ACT_ENVIRONMENT = true` to `src/test/setup.js` |

---

## Useful commands

```bash
npm run dev      # Vite dev server, browse components via react-router routes
npm test         # Vitest in watch mode
```
