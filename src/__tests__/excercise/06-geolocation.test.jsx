import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import Location from "../../components/location";

describe("Location", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("shows coordinates after getting location successfully", async () => {
    // 1. mock window.navigator.geolocation.getCurrentPosition with vi.spyOn
    //    make it call the success callback with fake lat/lng coords
    // 2. render <Location />
    // 3. find and click the "Get Location" button
    // 4. assert the latitude and longitude appear on screen
    //    hint: findBy* since it's async (state updates after callback fires)

    const user = userEvent.setup();

    const fakeGeoPosition = {
      coords: {
        latitude: 18.9716,
        longitude: 80.5946,
      },
    };

    Object.defineProperty(window.navigator, "geolocation", {
      value: { getCurrentPosition: vi.fn() },
      configurable: true,
    });
    vi.spyOn(
      window.navigator.geolocation,
      "getCurrentPosition",
    ).mockImplementation((successCb, errorCb) => {
      successCb(fakeGeoPosition);
    });

    render(<Location />);
    const getLocBtn = screen.getByRole("button", { name: /get location/i });
    await user.click(getLocBtn);
    const latTextEl = await screen.findByText(/latitude/i);
    const longTextEl = await screen.findByText(/longitude/i);
    // screen.debug();
    // screen.debug(latTextEl);
    // assert with two type of methods directly as textcontent since concatenates, or by within method
    const latValueEl = within(latTextEl).getByText(
      fakeGeoPosition.coords.latitude,
    );
    // screen.debug(latValueEl);
    expect(latValueEl).toHaveTextContent(fakeGeoPosition.coords.latitude);
    const longValueEl = within(longTextEl).getByText(
      fakeGeoPosition.coords.longitude,
    );
    expect(longValueEl).toHaveTextContent(fakeGeoPosition.coords.longitude);

    //method2
    expect(latTextEl).toHaveTextContent(
      `Latitude: ${fakeGeoPosition.coords.latitude}`,
    );
    expect(longTextEl).toHaveTextContent(
      `Longitude: ${fakeGeoPosition.coords.longitude}`,
    );
  });
  it("shows an error message if geolocation fails", async () => {
    Object.defineProperty(window.navigator, "geolocation", {
      value: { getCurrentPosition: vi.fn() },
      configurable: true,
    });
    vi.spyOn(
      window.navigator.geolocation,
      "getCurrentPosition",
    ).mockImplementation((successCb, errorCb) => {
      errorCb({ message: "User denied Geolocation" });
    });

    // 1. mock getCurrentPosition to call the ERROR callback instead
    //    with an object like { message: 'User denied Geolocation' }
    // 2. render, click, assert the role="alert" appears with that message
    const user = userEvent.setup();
    render(<Location />);
    await user.click(screen.getByRole("button", { name: /get location/i }));
    let alertEl = await screen.findByRole("alert");
    screen.debug(alertEl);
    expect(alertEl).toHaveTextContent("User denied Geolocation");
  });
});
