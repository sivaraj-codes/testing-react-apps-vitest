// form testing
// http://localhost:5173/login

// getBy*   → throws immediately if not found (use when element MUST exist right now)
// findBy*  → returns Promise, throws after timeout if not found (use when element appears async)
// queryBy* → returns null immediately if not found (use when asserting element does NOT exist)
// waitForElementToBeRemoved → waits until element disappears (use when element exists then leaves)

// Do you need to wait (async)?
//   YES → Does the element appear or disappear?
//           APPEAR   → findBy* or waitFor + getBy*
//           DISAPPEAR → waitForElementToBeRemoved
//   NO  → Should the element exist?
//           YES → getBy* (throws if missing — good for "must exist")
//           NO  → queryBy* (returns null — good for "must not exist")

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { faker } from "@faker-js/faker";
import Login from "../../components/login.jsx";

describe("Login form", () => {
  it("calls onSubmit with the username and password the user typed", async () => {
    // 1. onSubmit needs to be a mock function so you can assert on it.
    //    hint: vi.fn() — Vitest's equivalent of jest.fn()
    // 2. generate fake username/password with faker
    // 3. render <Login onSubmit={handleSubmit} />
    // 4. find the username input — how do you query an <input>? Not getByRole('button')...
    //    hint: getByLabelText — matches via the <label htmlFor> connection
    // 5. find the password input the same way
    // 6. type into both using userEvent.type (remember: await)
    // 7. find and click the Submit button
    // 8. assert the mock was called once, with the right { username, password } object
    //    hint: expect(mockFn).toHaveBeenCalledWith(...) and toHaveBeenCalledTimes(1)

    const user = userEvent.setup();

    const handleSubmit = vi.fn();
    let formData = {
      username: faker.internet.username(),
      password: faker.internet.password(),
    };

    render(<Login onSubmit={handleSubmit} />);

    let userNameEl = screen.getByLabelText(/username/i);
    let passwordEl = screen.getByLabelText(/password/i);
    let submitBtn = screen.getByRole("button", { name: /submit/i });

    await user.type(userNameEl, formData.username);
    await user.type(passwordEl, formData.password);
    await user.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(formData);
    console.log({ formData });
  });
});
