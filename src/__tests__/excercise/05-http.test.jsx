import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LoginSubmission from "../../components/login-submission";
import { faker } from "@faker-js/faker";
import userEvent from "@testing-library/user-event";
import { server } from "../../test/server.js";
import { delay, http, HttpResponse } from "msw";

// mocking HTTP requests with MSW
describe("LoginSubmission", () => {
  it("shows a welcome message after successful login", async () => {
    // 1. render <LoginSubmission /> — no props needed, it manages its own state
    // 2. generate fake username + password with faker
    // 3. find the username + password inputs via getByLabelText
    // 4. type into both with userEvent
    // 5. find and click the Submit button
    // 6. assert the welcome message appears
    //    hint: the component renders "Welcome {username}" on success
    //    hint: this is async — the fetch has to complete before the UI updates
    //          so you'll need waitFor or findBy* queries here
    const user = userEvent.setup();
    render(<LoginSubmission />);
    // screen.debug();
    let formData = {
      username: faker.internet.username(),
      password: faker.internet.password(),
    };

    // const usernameEl = screen.getByRole("textbox", { name: /username/i });
    // const passwordEl = screen.getByRole("textbox", { name: /password/i }); //cant access through role
    const usernameEl = screen.getByLabelText(/username/i);
    const passwordEl = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole("button", { name: /submit/i });

    // screen.debug(passwordEl);
    await user.type(usernameEl, formData.username);
    await user.type(passwordEl, formData.password);
    await user.click(submitBtn);
    //to verify the welcome message we need to wait with waitfor or use findby which waits internally

    const welcomeMessage = await screen.findByText(/welcome/i);
    expect(welcomeMessage).toBeInTheDocument();
    // screen.debug();
    // await waitFor(() => {
    //   expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    // });
  });

  it("shows an error message if password is missing", async () => {
    // 1. render <LoginSubmission />
    // 2. type ONLY a username, leave password empty
    // 3. submit the form
    // 4. assert the role="alert" div appears with "password required"
    //    hint: same async concern as above
    const user = userEvent.setup();
    render(<LoginSubmission />);
    const userNameEl = screen.getByLabelText(/username/i);
    const submitBtn = screen.getByRole("button", { name: /submit/i });
    await user.type(userNameEl, faker.internet.username());
    await user.click(submitBtn);
    // await waitFor(() => {
    //   const alertEl = screen.getByRole("alert");
    //   expect(alertEl).toHaveTextContent("password required");
    //   screen.debug();
    // });
    const alertEl = await screen.findByRole("alert");
    expect(alertEl).toHaveTextContent("password required");
  });
});

describe("LoginSubmission — server.use overrides + loading states", () => {
  it("check username missing", async () => {
    // Test 1: username missing (uses default handler)
    // - type only password, leave username empty, submit
    // - assert role="alert" shows "username required"
    const user = userEvent.setup();
    render(<LoginSubmission />);
    const passwordEl = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole("button", { name: /submit/i });

    await user.type(passwordEl, faker.internet.password());
    await user.click(submitBtn);

    const alertEl = await screen.findByRole("alert");
    expect(alertEl).toHaveTextContent("username required");
  });
  it("checks server error", async () => {
    server.use(
      http.post("https://auth-provider.example.com/api/login", () => {
        return HttpResponse.json(
          { message: "Internal Server Error" },
          { status: 500 },
        );
      }),
    );
    const user = userEvent.setup();
    render(<LoginSubmission />);
    const usernameEl = screen.getByLabelText(/username/i);
    const passwordEl = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole("button", { name: /submit/i });
    let formData = {
      username: faker.internet.username(),
      password: faker.internet.password(),
    };

    await user.type(usernameEl, formData.username);
    await user.type(passwordEl, formData.password);
    await user.click(submitBtn);
    const alertEl = await screen.findByRole("alert");
    expect(alertEl).toHaveTextContent(/internal server error/i);
  });

  it("checks loading state", async () => {
    let resolveLogin;
    // slow down the response so we can catch the spinner
    // slow down the response so we can catch the spinner
    server.use(
      http.post("https://auth-provider.example.com/api/login", async () => {
        await new Promise((resolve) => (resolveLogin = resolve));
        return HttpResponse.json({ username: "testuser" });
      }),
    );
    const user = userEvent.setup();
    render(<LoginSubmission />);
    const usernameEl = screen.getByLabelText(/username/i);
    const passwordEl = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole("button", { name: /submit/i });

    await user.type(passwordEl, faker.internet.password());
    await user.type(usernameEl, faker.internet.username());
    await user.click(submitBtn);

    // screen.debug();

    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();

    // now release the handler — fetch resolves
    resolveLogin();

    await waitForElementToBeRemoved(() => {
      return screen.queryByLabelText(/loading/i);
    });

    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });
});
