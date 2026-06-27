# React Testing Notes
## Vite + Vitest + React Testing Library + MSW v2

> Built from scratch by migrating Kent C. Dodds' "Testing React Apps" workshop
> from CRA + Jest + MSW v0 to the current modern stack.
> Use this for revision, learning, and interview prep.

---

## Table of Contents

1. [Why Test?](#1-why-test)
2. [Stack Overview](#2-stack-overview)
3. [Project Setup — Step by Step](#3-project-setup--step-by-step)
4. [Key Config Files](#4-key-config-files)
5. [Query Cheatsheet](#5-query-cheatsheet)
6. [Exercise 1 — Raw ReactDOM](#6-exercise-1--raw-reactdom)
7. [Exercise 2 — React Testing Library](#7-exercise-2--react-testing-library)
8. [Exercise 3 — Avoid Implementation Details](#8-exercise-3--avoid-implementation-details)
9. [Exercise 4 — Form Testing](#9-exercise-4--form-testing)
10. [Exercise 5 — MSW v2 HTTP Mocking](#10-exercise-5--msw-v2-http-mocking)
11. [Exercise 6 — Mocking Browser APIs](#11-exercise-6--mocking-browser-apis)
12. [Exercise 7 — Context + Custom Render](#12-exercise-7--context--custom-render)
13. [Exercise 8 — Testing Custom Hooks](#13-exercise-8--testing-custom-hooks)
14. [Gotchas Log](#14-gotchas-log)
15. [Interview Q&A](#15-interview-qa)
16. [Phase 2 — Real-World Extension Exercises](#16-phase-2--real-world-extension-exercises)

---

## 1. Why Test?

- Catch bugs before users do
- Confidence to refactor without fear of breaking things
- Tests document how code is *supposed* to behave
- The closer tests resemble real usage, the more confidence they give

**Testing trophy (Kent C. Dodds):**
```
        E2E (few, slow, expensive)
       Integration (most value here)
      Unit (fast, cheap, but brittle if overdone)
     Static (TypeScript, ESLint — free confidence)
```

---

## 2. Stack Overview

| Tool | Version | Purpose | Replaces |
|---|---|---|---|
| Vite | ^8.x | Build tool + dev server | CRA (react-scripts) |
| React | ^18.3.1 (pinned) | UI library | — |
| Vitest | ^4.x | Test runner | Jest |
| @testing-library/react | latest | Render + query helpers | same (unchanged) |
| @testing-library/jest-dom | latest | DOM matchers (`toBeInTheDocument` etc.) | same (unchanged) |
| @testing-library/user-event | v14+ | Simulates real user interactions | same lib, but API changed |
| MSW | v2.x | Mock Service Worker — intercepts fetch | MSW v0.42 |
| @faker-js/faker | latest | Generate realistic fake test data | — |
| react-router-dom | v6 | Routes for manual browsing | — |

**Why React 18, not 19?**
React 19 has breaking changes around `act()` semantics and `react-test-renderer`.
Staying on 18 avoids unrelated debugging noise while learning testing patterns.

---

## 3. Project Setup — Step by Step

### Step 1 — Scaffold

```bash
npm create vite@latest testing-react-apps -- --template react
cd testing-react-apps
npm install
npm install react@18 react-dom@18
npm install --save-dev @types/react@18 @types/react-dom@18
```

Pin React to 18 right after scaffolding — Vite's template defaults to latest React.
Align `@types/react` too, otherwise VS Code intellisense shows React 19 APIs that don't exist in 18.

### Step 2 — Install Vitest + jsdom

```bash
npm install --save-dev vitest jsdom
```

Vite's default test environment is `node` — no DOM at all.
jsdom simulates a browser environment so React can render into it.
CRA/Jest had this baked in invisibly. Vitest requires it explicitly.

Add to `package.json`:
```json
"scripts": {
  "test": "vitest"
}
```

### Step 3 — Install React Testing Library

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Step 4 — Install MSW v2

```bash
npm install --save-dev msw@2
```

### Step 5 — Install Faker

```bash
npm install --save-dev @faker-js/faker
```

### Step 6 — Install react-router-dom (for manual browsing)

```bash
npm install react-router-dom
```

---

## 4. Key Config Files

### `vitest.config.js`

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',        // simulate browser DOM
    setupFiles: ['./src/test/setup.js'],  // runs before every test file
  },
})
```

### `src/test/setup.js`

```js
import '@testing-library/jest-dom/vitest'  // adds toBeInTheDocument, toHaveStyle, etc.
import { afterEach, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './server.js'

// Tells React it's in a test environment — suppresses act() warnings
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// MSW lifecycle — intercept fetch calls across all tests
beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()  // undo per-test handler overrides
  cleanup()               // unmount React trees between tests
})
afterAll(() => server.close())
```

**Why `/vitest` entry point for jest-dom?**
`@testing-library/jest-dom/vitest` calls `expect.extend()` against Vitest's
`expect`. Without `/vitest`, matchers silently don't exist.

**Why manual `cleanup()`?**
Jest+CRA auto-registered this. Vitest doesn't — so DOM nodes from one test
would leak into the next without it.

**Why `IS_REACT_ACT_ENVIRONMENT`?**
Without this, React doesn't know it's in a test environment and prints
"not configured to support act(...)" warnings even when `act()` is used correctly.
This is a separate concern from whether your `act()` usage is correct.

### `src/test/server-handlers.js`

```js
import { http, HttpResponse, delay } from 'msw'

export const handlers = [
  http.post('https://auth-provider.example.com/api/login', async ({ request }) => {
    const body = await request.json()

    if (!body.password) {
      await delay(0)
      return HttpResponse.json({ message: 'password required' }, { status: 400 })
    }
    if (!body.username) {
      await delay(0)
      return HttpResponse.json({ message: 'username required' }, { status: 400 })
    }

    await delay(0)
    return HttpResponse.json({ username: body.username })
  }),
]
```

### `src/test/server.js`

```js
import { setupServer } from 'msw/node'
import { handlers } from './server-handlers.js'

export const server = setupServer(...handlers)
```

### `src/test/test-utils.jsx`

```jsx
import { render as rtlRender } from '@testing-library/react'
import { ThemeProvider } from '../components/theme.jsx'

function render(ui, { theme = 'light', ...options } = {}) {
  function Wrapper({ children }) {
    return (
      <ThemeProvider initialTheme={theme}>
        {children}
      </ThemeProvider>
    )
  }
  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

// re-export everything from RTL — one import replaces @testing-library/react
export * from '@testing-library/react'
export { render }  // override RTL's render with our custom one
```

---

## 5. Query Cheatsheet

### The three query families

| Family | Throws if missing | Returns | Use when |
|---|---|---|---|
| `getBy*` | ✅ immediately | Element | Element MUST exist right now |
| `queryBy*` | ❌ returns null | Element or null | Asserting element does NOT exist |
| `findBy*` | ✅ after timeout | Promise\<Element\> | Element appears asynchronously |
| `getAllBy*` | ✅ if zero found | Element[] | Multiple elements must exist |
| `queryAllBy*` | ❌ returns [] | Element[] | Assert multiple elements absent |
| `findAllBy*` | ✅ after timeout | Promise\<Element[]\> | Multiple elements appear async |

### Query decision tree

```
Is the assertion async (element appears/disappears after fetch/timer)?
  YES → findBy* (appears) or waitForElementToBeRemoved (disappears)
  NO  → Does element MUST exist?
          YES → getBy*
          NO  → queryBy* (returns null, won't throw)
```

### Query priority (RTL's own recommendation)

1. `getByRole` — queries the accessibility tree (what screen readers see)
2. `getByLabelText` — for form fields with labels
3. `getByPlaceholderText` — weaker, use only if no label
4. `getByText` — for non-interactive elements (divs, paragraphs)
5. `getByTestId` — last resort, not visible to real users

### Common examples

```js
// button by accessible name
screen.getByRole('button', { name: /submit/i })

// input by label connection (<label htmlFor="x"> + <input id="x">)
screen.getByLabelText(/username/i)

// any text content (partial, case-insensitive)
screen.getByText(/current count/i)

// element with ARIA role
screen.getByRole('alert')

// wait for async element
await screen.findByText(/welcome/i)
await screen.findByRole('alert')

// assert element does NOT exist
expect(screen.queryByText(/error/i)).not.toBeInTheDocument()

// wait for element to disappear
await waitForElementToBeRemoved(() => screen.queryByRole('status'))
```

### `within` — scope queries to a container

```js
import { within } from '@testing-library/react'

const latRow = screen.getByText(/latitude/i)
const value = within(latRow).getByText('18.9716')
expect(value).toBeInTheDocument()
```

Use `within` when multiple similar elements exist and you need to scope
your query to the right container — e.g. multiple error alerts, table rows,
or labeled sections.

### Password inputs and `getByRole`

`getByRole('textbox')` does NOT match `<input type="password">`.
Password inputs have no exposed ARIA role by spec (intentional).
Always use `getByLabelText` for password fields:

```js
screen.getByLabelText(/password/i)  // ✅ works for any labeled input
screen.getByRole('textbox', { name: /password/i })  // ❌ throws for type="password"
```

### Accessible names — `aria-label` vs `aria-labelledby` vs `htmlFor`

| Mechanism | When to use |
|---|---|
| `<label htmlFor="id">` | Standard form fields with visible labels |
| `aria-label="string"` | Icon-only buttons, inputs with no visible label |
| `aria-labelledby="other-element-id"` | Reuse existing visible text as label, or compose from multiple elements |

All three are queryable via `getByLabelText` — RTL checks all accessible name sources.

---

## 6. Exercise 1 — Raw ReactDOM

**File:** `src/__tests__/exercise/01-react-dom.test.jsx`
**Component:** `Counter` — increment/decrement buttons, displays current count

**Purpose:** Feel what React Testing Library abstracts away by doing it manually first.

```jsx
import { afterEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import ReactDOM from 'react-dom/client'
import Counter from '../../components/counter.jsx'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('COUNTER', () => {
  it('counter increments and decrements when the buttons are clicked', () => {
    let el = document.createElement('div')
    document.body.append(el)
    let rootEl = ReactDOM.createRoot(el)

    act(() => {
      rootEl.render(<Counter />)
    })

    let [decrementBtn, incrementBtn] = el.querySelectorAll('button')
    const messageDiv = el.firstChild.firstChild  // outer wrapper → count div

    expect(messageDiv).toHaveTextContent('Current count: 0')

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
    })

    act(() => { incrementBtn.dispatchEvent(clickEvent) })
    expect(messageDiv).toHaveTextContent('Current count: 1')

    act(() => { decrementBtn.dispatchEvent(clickEvent) })
    expect(messageDiv).toHaveTextContent('Current count: 0')
  })
})
```

**Key lessons:**
- `ReactDOM.createRoot(el).render(...)` — React 18's new root API (replaces old `ReactDOM.render`)
- `act()` must wrap *event dispatches*, not just `render()` — state updates from `dispatchEvent` in jsdom don't flush synchronously without it
- `querySelector('div')` is fragile — finds the first div in depth-first order, which may not be the one you want. Use `firstChild.firstChild` to be explicit about the DOM shape
- `bubbles: true` on `MouseEvent` — React's event system uses delegation at the root, so events must bubble to reach handlers
- Manual `afterEach` cleanup needed — RTL's automatic `cleanup()` doesn't apply here since we're not using RTL's `render`

---

## 7. Exercise 2 — React Testing Library

**File:** `src/__tests__/exercise/02-rtl-lib.test.jsx`
**Component:** Same `Counter`

**Purpose:** See how RTL replaces ~40 lines of manual DOM wrangling with ~10 lines.

```jsx
// Unlike exercise 1 (raw ReactDOM): render() handles mount + act() internally.
// getByRole queries the accessibility tree (resilient to markup changes).
// userEvent simulates real interaction sequences; always await — v14+ is async.

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Counter from '../../components/counter'
import userEvent from '@testing-library/user-event'

describe('Counter (RTL)', () => {
  it('counter increments and decrements when the buttons are clicked', async () => {
    const user = userEvent.setup()

    render(<Counter />)
    const incrementBtn = screen.getByRole('button', { name: /increment/i })
    const decrementBtn = screen.getByRole('button', { name: /decrement/i })
    const messageEl = screen.getByText(/current count/i)

    expect(messageEl).toHaveTextContent('Current count: 0')
    await user.click(incrementBtn)
    expect(messageEl).toHaveTextContent('Current count: 1')
    await user.click(decrementBtn)
    expect(messageEl).toHaveTextContent('Current count: 0')
  })
})
```

**Key lessons:**
- `render()` internally wraps everything in `act()` — no manual act needed
- `cleanup()` runs automatically between tests via `setup.js`
- `getByRole('button', { name: /increment/i })` — queries by accessible name, more resilient than `getByText` for interactive elements
- `getByText(/current count/i)` — regex for partial, case-insensitive match. Exact string `"current count"` would fail because rendered text is `"Current count: 0"`
- **`userEvent` vs `fireEvent`:** `userEvent.click()` simulates the full real-browser interaction sequence (hover → mousedown → focus → mouseup → click). `fireEvent.click()` dispatches a single raw event. Always prefer `userEvent` for interactions a real user would perform
- **`userEvent` v14+ is fully async** — always `await user.click()`, `await user.type()`. Forgetting `await` causes assertions to run before React processes the state update — same class of bug as missing `act()` in exercise 1

---

## 8. Exercise 3 — Avoid Implementation Details

**File:** `src/__tests__/exercise/03-style.test.jsx`
**Component:** `EasyButton` — reads theme from context, applies inline styles

**Purpose:** Query by what users perceive (role, text, style) not by CSS classes,
test IDs, or internal state. Tests that assert on implementation details break
on refactors even when behavior is unchanged.

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EasyButton from '../../components/easy-button.jsx'
import { ThemeProvider } from '../../components/theme.jsx'

describe('EasyButton', () => {
  it('renders with the light styles for the light theme', () => {
    render(
      <ThemeProvider>
        <EasyButton>Easy</EasyButton>
      </ThemeProvider>
    )
    const btn = screen.getByRole('button', { name: /easy/i })
    expect(btn).toHaveStyle({
      color: 'rgb(0, 0, 0)',
      backgroundColor: 'rgb(255, 255, 255)',
    })
  })
})
```

**Key lessons:**
- `toHaveStyle` checks computed/applied styles — closer to "what does this look like" than checking CSS class names. If the component switches from inline styles to CSS Modules, `toHaveStyle` still works; `toHaveClass('btn-light')` would break
- **jsdom normalizes color values to `rgb(...)` format** — `'black'` in source becomes `'rgb(0, 0, 0)'` in the DOM. Always use `rgb(r, g, b)` in `toHaveStyle` assertions
- Context-dependent components need their provider — `EasyButton` uses `useTheme()` which throws without `ThemeProvider`
- **The refactor proof:** after changing `theme.jsx` context value from array `[theme, setTheme]` to object `{ theme, setTheme }`, the test needed zero changes — because it asserts on rendered output (button styles), not on the hook's internal return shape

**Context value shapes — array vs object:**
```js
// array shape (original)
const [theme, setTheme] = useTheme()

// object shape (refactored — more readable, self-documenting)
const { theme, setTheme } = useTheme()
```
Object shape is preferred in real codebases — no need to remember positional order.

---

## 9. Exercise 4 — Form Testing

**File:** `src/__tests__/exercise/04-form.test.jsx`
**Component:** `Login` — username + password form, calls `onSubmit({ username, password })`

```jsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { faker } from '@faker-js/faker'
import userEvent from '@testing-library/user-event'
import Login from '../../components/login.jsx'

describe('Login form', () => {
  it('calls onSubmit with the username and password the user typed', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()

    const formData = {
      username: faker.internet.username(),
      password: faker.internet.password(),
    }

    render(<Login onSubmit={handleSubmit} />)

    await user.type(screen.getByLabelText(/username/i), formData.username)
    await user.type(screen.getByLabelText(/password/i), formData.password)
    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(handleSubmit).toHaveBeenCalledTimes(1)
    expect(handleSubmit).toHaveBeenCalledWith(formData)
  })
})
```

**Key lessons:**
- **`vi.fn()`** — Vitest's mock function (same API as Jest's `jest.fn()`). Pass it as a prop, then assert: was it called? How many times? With what args?
- **`getByLabelText`** — correct query for form inputs. Works via `<label htmlFor="id">` ↔ `<input id="id">` connection. Also works with `aria-label` and `aria-labelledby`
- **`@faker-js/faker`** — generates realistic fake data (names, emails, passwords). Use it instead of hardcoded strings like `'testuser'` — proves "whatever the user types is what gets submitted," not that a specific magic string works
- **`toHaveBeenCalledWith(formData)`** — asserts the mock was called with exact argument. Note: `faker.internet.password()` not `faker.internet.password` — always invoke faker methods
- **`userEvent.type`** — simulates real typing keystroke by keystroke, not just setting `.value`. The `await` is essential (v14+ async)

**Mock assertions:**
```js
expect(fn).toHaveBeenCalledTimes(1)           // called exactly once
expect(fn).toHaveBeenCalledWith({ a: 1 })     // called with specific args
expect(fn).toHaveBeenLastCalledWith({ a: 1 }) // last call had these args
expect(fn).not.toHaveBeenCalled()             // never called
```

---

## 10. Exercise 5 — MSW v2 HTTP Mocking

**File:** `src/__tests__/exercise/05-http.test.jsx`
**Component:** `LoginSubmission` — renders `Login`, submits to `/api/login`, shows welcome or error

**Purpose:** Intercept real `fetch()` calls in tests without changing component code.

```jsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { faker } from '@faker-js/faker'
import userEvent from '@testing-library/user-event'
import LoginSubmission from '../../components/login-submission'

describe('LoginSubmission', () => {
  it('shows a welcome message after successful login', async () => {
    const user = userEvent.setup()
    render(<LoginSubmission />)

    const formData = {
      username: faker.internet.username(),
      password: faker.internet.password(),
    }

    await user.type(screen.getByLabelText(/username/i), formData.username)
    await user.type(screen.getByLabelText(/password/i), formData.password)
    await user.click(screen.getByRole('button', { name: /submit/i }))

    const welcomeMessage = await screen.findByText(/welcome/i)
    expect(welcomeMessage).toBeInTheDocument()
  })

  it('shows an error message if password is missing', async () => {
    const user = userEvent.setup()
    render(<LoginSubmission />)

    await user.type(screen.getByLabelText(/username/i), faker.internet.username())
    await user.click(screen.getByRole('button', { name: /submit/i }))

    const alertEl = await screen.findByRole('alert')
    expect(alertEl).toHaveTextContent('password required')
  })
})
```

**MSW v2 vs v0 — what changed:**

| v0 | v2 | Why |
|---|---|---|
| `import { rest } from 'msw'` | `import { http, HttpResponse } from 'msw'` | `rest` renamed to `http` |
| `rest.post(url, (req, res, ctx) => {})` | `http.post(url, async ({ request }) => {})` | Resolver signature changed completely |
| `req.body.password` (auto-parsed) | `await request.json()` then `.password` | `request` is now a real Fetch API `Request` object |
| `res(ctx.status(400), ctx.json({...}))` | `return HttpResponse.json({...}, { status: 400 })` | Return a Response directly, no `res()`/`ctx` composer |
| `ctx.delay(ms)` | `await delay(ms)` (standalone import) | `delay` is now a standalone async function |

**MSW v2 philosophy:** moved to native Fetch API `Request`/`Response` objects
instead of custom `req`/`res`/`ctx` abstractions. What you learn transfers
directly to Cloudflare Workers, Next.js route handlers, etc.

**Key lessons:**
- **`findBy*` for async DOM changes** — after submit, fetch runs, state updates, DOM changes. `getBy*` would run before the fetch resolves. `findBy*` polls until the element appears (default 1000ms timeout)
- **`findBy*` vs `waitFor`:**
  ```js
  // findBy* — cleaner for "wait until element appears"
  const el = await screen.findByText(/welcome/i)

  // waitFor — better for complex assertions or "keep checking"
  await waitFor(() => {
    expect(screen.getByText(/welcome/i)).toBeInTheDocument()
  })

  // WRONG — always await waitFor, never discard the Promise
  waitFor(() => { expect(...) })  // false positive — test "passes" without asserting
  ```
- **`server.resetHandlers()` in `afterEach`** — undoes per-test handler overrides so they don't leak. Per-test override example:
  ```js
  server.use(
    http.post('/api/login', () => HttpResponse.json({ message: 'server error' }, { status: 500 }))
  )
  ```

---

## 11. Exercise 6 — Mocking Browser APIs

**File:** `src/__tests__/exercise/06-geolocation.test.jsx`
**Component:** `Location` — requests geolocation, shows lat/lng or error

**Purpose:** Mock browser APIs that jsdom doesn't implement.

```jsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Location from '../../components/location.jsx'

describe('Location', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows coordinates after getting location successfully', async () => {
    const user = userEvent.setup()
    const fakePosition = {
      coords: { latitude: 18.9716, longitude: 80.5946 },
    }

    // jsdom has no geolocation — define it first, then spy
    Object.defineProperty(window.navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn() },
      configurable: true,
    })

    vi.spyOn(window.navigator.geolocation, 'getCurrentPosition')
      .mockImplementation((successCb) => {
        successCb(fakePosition)  // synchronous — no async/delay
      })

    render(<Location />)
    await user.click(screen.getByRole('button', { name: /get location/i }))

    const latEl = await screen.findByText(/latitude/i)
    const longEl = await screen.findByText(/longitude/i)

    // within — scope query to the right container
    expect(within(latEl).getByText(fakePosition.coords.latitude)).toBeInTheDocument()
    expect(within(longEl).getByText(fakePosition.coords.longitude)).toBeInTheDocument()

    // alternative — toHaveTextContent concatenates all text in element
    expect(latEl).toHaveTextContent(`Latitude: ${fakePosition.coords.latitude}`)
  })

  it('shows an error message if geolocation fails', async () => {
    const user = userEvent.setup()

    Object.defineProperty(window.navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn() },
      configurable: true,
    })

    vi.spyOn(window.navigator.geolocation, 'getCurrentPosition')
      .mockImplementation((successCb, errorCb) => {
        errorCb({ message: 'User denied Geolocation' })
      })

    render(<Location />)
    await user.click(screen.getByRole('button', { name: /get location/i }))

    const alertEl = await screen.findByRole('alert')
    expect(alertEl).toHaveTextContent('User denied Geolocation')
  })
})
```

**Key lessons:**
- **`vi.spyOn` requires an existing object** — if jsdom doesn't implement the API, `vi.spyOn` throws `could not find object to spy upon`. Define the API with `Object.defineProperty` first
- **`Object.defineProperty` over direct assignment** — `window.navigator` is read-only; direct assignment silently fails in strict mode
- **`configurable: true`** — allows `vi.restoreAllMocks()` to delete/restore the property after each test
- **Keep mock callback-based APIs synchronous** — `getCurrentPosition` is callback-based, not Promise-based. An `async` mock defers the callback to a microtask, causing React state updates outside `act()` — confusing warnings
- **`vi.restoreAllMocks()` in `afterEach`** — restores all spies to original implementations. Same concept as `server.resetHandlers()` but for module/browser API mocks

**`vi.spyOn` vs `vi.fn()`:**
```js
// vi.spyOn — patches an existing method on an object, can restore original
vi.spyOn(obj, 'method').mockImplementation(() => 'fake')
vi.restoreAllMocks()  // restores obj.method to original

// vi.fn() — standalone mock, not tied to any object
const mockFn = vi.fn().mockImplementation(() => 'fake')
// use as a prop: <Component onSubmit={mockFn} />
```

---

## 12. Exercise 7 — Context + Custom Render

**File:** `src/__tests__/exercise/07-context-custom-render.test.jsx`
**Component:** `EasyButton` — needs `ThemeProvider` context

**Purpose:** Eliminate provider boilerplate from every test using RTL's `wrapper`
option and a custom render function.

**Three approaches — evolution:**

```jsx
// ❶ Manual wrap — verbose, provider tangled with component under test
render(
  <ThemeProvider initialTheme="light">
    <EasyButton>Easy</EasyButton>
  </ThemeProvider>
)

// ❷ RTL wrapper option — component under test is the clear focus
render(<EasyButton>Easy</EasyButton>, {
  wrapper: ({ children }) => (
    <ThemeProvider initialTheme="light">{children}</ThemeProvider>
  ),
})
// wrapper is automatically re-applied on rerender() calls too

// ❸ Custom render — zero provider knowledge in test files
import { render, screen } from '../../test/test-utils'
render(<EasyButton>Easy</EasyButton>, { theme: 'light' })
```

**`src/test/test-utils.jsx`:**
```jsx
import { render as rtlRender } from '@testing-library/react'
import { ThemeProvider } from '../components/theme.jsx'

function render(ui, { theme = 'light', ...options } = {}) {
  function Wrapper({ children }) {
    return <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
  }
  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'  // re-export screen, waitFor, within, etc.
export { render }                        // override with custom render
```

**Key lessons:**
- **`wrapper` option** — automatically wraps `render` and `rerender` calls. Without it, you'd have to manually wrap `rerender` with providers too
- **`export * from '@testing-library/react'`** then `export { render }` — the named `render` export overrides what `export *` would re-export. Test files get everything from one import
- **The "one import" pattern is standard** — real projects put all providers (Router, Theme, Auth, Redux store) in `test-utils` and never import from `@testing-library/react` directly in test files

---

## 13. Exercise 8 — Testing Custom Hooks

**File:** `src/__tests__/exercise/08-hooks.test.jsx`
**Hook:** `useCounter({ initialCount, step })` → `{ count, increment, decrement }`

**Purpose:** Test hook logic directly without building a component around it.

```jsx
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import useCounter from '../../components/use-counter.jsx'

describe('useCounter', () => {
  it('exposes count and increment/decrement', () => {
    const { result } = renderHook(useCounter)

    expect(result.current.count).toBe(0)
    act(() => result.current.increment())
    expect(result.current.count).toBe(1)
    act(() => result.current.decrement())
    expect(result.current.count).toBe(0)
  })

  it('allows customising the initial count', () => {
    const { result } = renderHook(useCounter, {
      initialProps: { initialCount: 3 },
    })
    expect(result.current.count).toBe(3)
  })

  it('allows customising the step', () => {
    const { result } = renderHook(useCounter, {
      initialProps: { initialCount: 0, step: 2 },
    })
    act(() => result.current.increment())
    expect(result.current.count).toBe(2)
    act(() => result.current.decrement())
    expect(result.current.count).toBe(0)
  })

  it('allows customising the step with rerender', () => {
    const { result, rerender } = renderHook(useCounter, {
      initialProps: { initialCount: 0, step: 1 },
    })

    act(() => result.current.increment())
    expect(result.current.count).toBe(1)

    rerender({ step: 5 })  // change props mid-test

    act(() => result.current.increment())
    expect(result.current.count).toBe(6)  // 1 + 5 (new step)
  })
})
```

**Key lessons:**
- **Why not call hooks directly in tests?** React's rules of hooks — hooks only run inside a component's render cycle. Calling one in plain JS throws immediately
- **`renderHook(fn)`** — `fn` is a callback that RTL calls inside a real (hidden) component. Return value is `{ result, rerender, unmount }`
- **`result.current`** — always reflects the hook's most recent return value. No need to re-destructure after `act()`
- **`act()` for state-updating calls** — `result.current.increment()` calls `setCount` inside the hook. React needs `act()` to flush that update before your assertion
- **`initialProps` vs arrow function:**
  ```js
  // arrow function — clean for fixed options
  renderHook(() => useCounter({ initialCount: 3 }))

  // initialProps — required when you need rerender with different props
  const { rerender } = renderHook(useCounter, { initialProps: { step: 1 } })
  rerender({ step: 5 })  // ← not possible with arrow function approach
  ```
- **`rerender` with `initialCount` won't reset count** — `useState` ignores new initial values after first mount. Only `step` takes effect on rerender because it's read fresh every render

---

## 14. Gotchas Log

Real bugs hit during this build — the most useful reference section.

| Problem | Root Cause | Fix |
|---|---|---|
| Vitest doesn't discover exercise files | Default pattern requires `.test.` or `.spec.` in filename | Rename to `0N.test.jsx` |
| `Failed to parse source — invalid JS syntax` on `.js` file with JSX | Vite's esbuild only applies JSX transform to `.jsx`/`.tsx` | Rename component files `.js` → `.jsx` |
| `toHaveTextContent` received null | `el.querySelector('div')` matched outer wrapper div, not count div | Use `el.firstChild.firstChild` to be explicit |
| Count didn't update after `dispatchEvent` | jsdom's `dispatchEvent` doesn't auto-flush `setState` | Wrap every `dispatchEvent` in `act(() => {...})` |
| `act()` warning even when `act()` used correctly | `IS_REACT_ACT_ENVIRONMENT` not set — React doesn't know it's in test env | Add `globalThis.IS_REACT_ACT_ENVIRONMENT = true` to `setup.js` |
| `toHaveStyle({ color: 'black' })` fails | jsdom normalizes colors to `rgb(...)` format | Use `rgb(0, 0, 0)` instead of `'black'` |
| `vi.spyOn` throws `could not find object` | `window.navigator.geolocation` is undefined in jsdom | Define it first with `Object.defineProperty(..., { configurable: true })` |
| `waitFor` test passes but never actually asserts | `waitFor` returns a Promise that was never awaited | Always `await waitFor(...)` — unawaited = false positive |
| `getByRole('textbox')` can't find password input | `type="password"` inputs have no ARIA `textbox` role by spec | Use `getByLabelText(/password/i)` instead |
| `faker.internet.password` is a function, not a string | Missing `()` — passed the function reference instead of calling it | `faker.internet.password()` with parentheses |
| MSW `req.body` is undefined in v2 | v2 uses real Fetch `Request` object — no auto-parsed body | `const body = await request.json()` then use `body.property` |

---

## 15. Interview Q&A

**Q: What is React Testing Library and why use it over Enzyme?**
RTL tests components from the user's perspective — querying by accessible role, label text, or visible text rather than component internals like state or methods. Enzyme let you assert on internal state and call lifecycle methods directly, which couples tests to implementation — tests break on refactors even when behavior is unchanged. RTL's guiding principle: "The more your tests resemble the way your software is used, the more confidence they can give you."

**Q: What's the difference between `getBy`, `queryBy`, and `findBy`?**
- `getBy*` — throws immediately if element not found. Use when element must exist right now.
- `queryBy*` — returns null if not found. Use when asserting an element does NOT exist.
- `findBy*` — returns a Promise, polls until element appears or times out. Use for async DOM changes (after fetch, timer, etc.).

**Q: Why use `userEvent` over `fireEvent`?**
`userEvent` simulates the full real-browser interaction sequence (hover → mousedown → focus → mouseup → click). `fireEvent` dispatches a single raw event. `userEvent` is closer to actual user behavior, which is what we want to test. Note: `userEvent` v14+ is async — always `await user.click(...)`.

**Q: What is MSW and why is it better than mocking `fetch` directly?**
MSW (Mock Service Worker) intercepts requests at the network level — the component's actual `fetch` call runs exactly as it would in production, and MSW returns a fake response before it hits the real server. Mocking `fetch` directly (`vi.fn()`) replaces the entire fetch mechanism, meaning you're not testing the real fetch code path. MSW gives you more confidence because the component doesn't know it's being mocked.

**Q: What is `act()` and when do you need it?**
`act()` tells React "flush all pending state updates and effects before returning." You need it when something outside React's control triggers a state update — like `dispatchEvent` in jsdom, or calling a state-setting function from a hook directly. RTL's `render`, `userEvent`, and `fireEvent` all wrap themselves in `act()` internally, so you rarely need to write it manually unless doing raw DOM testing (exercise 1 style) or `renderHook`.

**Q: What is the `wrapper` option in RTL's `render`?**
A component that automatically wraps the rendered UI, including on `rerender` calls. Used to provide context (Theme, Router, Auth, Redux) without manually nesting JSX providers in every test. The standard pattern is to create a `test-utils.jsx` that provides all app-wide providers via `wrapper` and re-exports everything from `@testing-library/react`.

**Q: Why can't you call hooks directly in tests?**
React's rules of hooks enforce that hooks only run inside a component's render cycle. Calling one in plain JS throws: "Invalid hook call." `renderHook` from `@testing-library/react` creates a real (hidden) host component and calls your hook inside it, giving you access to `result.current` which always reflects the latest hook return value.

**Q: What's the difference between `vi.fn()` and `vi.spyOn()`?**
`vi.fn()` creates a standalone mock function not attached to anything — used as a prop or callback. `vi.spyOn(obj, 'method')` replaces an existing method on an object with a spy that wraps the original, allowing you to assert on calls while optionally calling through to the real implementation. `vi.restoreAllMocks()` restores spied-on methods; there's nothing to restore for standalone `vi.fn()`.

**Q: What is `IS_REACT_ACT_ENVIRONMENT`?**
A global flag that tells React it's running in a test environment. Without it set to `true`, React prints "not configured to support act(...)" warnings regardless of whether your `act()` usage is correct — because React doesn't even know to enforce act boundaries. CRA/Jest set this automatically. Vitest requires you to set it explicitly in `setup.js`.

---

## 16. Phase 2 — Real-World Extension Exercises

Coming after completing exercises 1–8. These cover patterns you'd actually hit
in production React codebases, particularly relevant to the Indian market
(Freshworks, Zoho, Chargebee, etc.).

**Planned exercises:**

1. **Testing RTK Query hooks** — `renderHook` + MSW for a `useGetUsersQuery` hook from Redux Toolkit Query. Covers cache states (loading/success/error) and `invalidateTags`.

2. **Testing Formik + Yup forms** — validation error messages appearing on blur/submit, `toHaveTextContent` on error divs, `userEvent.tab()` to trigger blur.

3. **Testing components with `useNavigate`** — mocking `react-router-dom` navigation, asserting redirect happened after form submit.

4. **Debounced search input with fake timers** — `vi.useFakeTimers()` + `vi.advanceTimersByTime(300)` to test debounce behavior without real waiting.

5. **Testing a component that uses `useParams`** — wrapping with `MemoryRouter` + `Routes` in `test-utils`, passing route params.

6. **Testing loading → success → error state transitions** — `waitForElementToBeRemoved` for spinner, then assert success or error state.

---

## Useful Commands

```bash
npm run dev      # Vite dev server — browse components at localhost:5173
npm test         # Vitest in watch mode
npm test -- --run  # Run once (no watch mode), useful for CI
```

## File Naming Conventions

- Test files: `NN-descriptor.test.jsx` (e.g. `04-form.test.jsx`)
- Component files containing JSX: `.jsx` (not `.js`)
- Test infrastructure: `src/test/setup.js`, `server.js`, `server-handlers.js`, `test-utils.jsx`
- Bootstrap/reference files: `src/test/__bootstrap__/`
