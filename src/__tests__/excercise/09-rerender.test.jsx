import {
  findByRole,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import UserProfile from "../../components/user-profile";
import { USERS_MAP } from "../../test/constants";

describe("UserProfile", () => {
  it("renders user details for the given userId", async () => {
    // 1. render <UserProfile userId={1} />
    // 2. wait for the user's name to appear (findBy* — async fetch)
    // 3. assert name and email are shown
    //    hint: USERS_MAP[1] = { name: 'Sivaraj M', email: 'sivaraj@example.com' }
    render(<UserProfile userId={1} />);
    const userName = await screen.findByRole("heading", {
      name: USERS_MAP[1].name,
    });
    // screen.debug();
    const userEmail = await screen.findByText(USERS_MAP[1].email);
    expect(userName).toBeInTheDocument();
    expect(userEmail).toBeInTheDocument();
  });
  it("shows loading state while fetching", () => {
    render(<UserProfile userId={2} />);
    expect(screen.getByLabelText("loading")).toBeInTheDocument();
  });
  it("shows error when user is not found", async () => {
    render(<UserProfile userId={12} />);
    expect(screen.getByLabelText("loading")).toBeInTheDocument();
    await waitForElementToBeRemoved(() => screen.queryByLabelText("loading"));
    // screen.debug();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
  it("fetches new user data when userId prop changes", async () => {
    const { rerender } = render(<UserProfile userId={1} />);
    const userNameEl = await screen.findByRole("heading", {
      name: USERS_MAP[1].name,
    });
    const emailEl = await screen.findByText(USERS_MAP[1].email);
    // screen.debug();
    expect(userNameEl).toBeInTheDocument();
    expect(emailEl).toBeInTheDocument();

    rerender(<UserProfile userId={2} />);
    // screen.debug();
    expect(screen.getByLabelText("loading")).toBeInTheDocument();
    const userNameEl2 = await screen.findByRole("heading", {
      name: USERS_MAP[2].name,
    });
    const emailEl2 = await screen.findByText(USERS_MAP[2].email);
    screen.debug();
    expect(userNameEl2).toBeInTheDocument();
    expect(emailEl2).toBeInTheDocument();
  });
});
