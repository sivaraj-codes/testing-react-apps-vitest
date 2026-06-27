import { act, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useCounter from "../../components/use-counter";

describe("useCounter", () => {
  it("exposes the count and increment/decrement functions", () => {
    // 1. call renderHook(useCounter)
    // 2. destructure result from the return value
    // 3. assert result.current.count starts at 0
    // 4. call result.current.increment() inside act()
    // 5. assert result.current.count is now 1
    // 6. call result.current.decrement() inside act()
    // 7. assert result.current.count is back to 0
    const { result, rerender } = renderHook(useCounter);
    // screen.debug();
    expect(result.current.count).toBe(0);
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
    act(() => result.current.decrement());
    expect(result.current.count).toBe(0);
  });
  it("allows customising the initial count", () => {
    // renderHook(useCounter)
    // assert count starts at 3
    const { result, rerender } = renderHook(useCounter, {
      initialProps: { initialCount: 3 },
    });
    expect(result.current.count).toBe(3);
  });

  it("allows customising the step", () => {
    // renderHook(useCounter)
    // increment once, assert count is 2
    // decrement once, assert count is 0
    const { result, rerender } = renderHook(useCounter, {
      initialProps: { initialCount: 0, step: 2 },
    });
    expect(result.current.count).toBe(0);
    act(() => result.current.increment());
    expect(result.current.count).toBe(2);
    act(() => result.current.decrement());
    expect(result.current.count).toBe(0);
  });

  it("allows customising the step with re-render", () => {
    const { result, rerender } = renderHook(useCounter, {
      initialProps: { initialCount: 0, step: 1 },
    });
    expect(result.current.count).toBe(0);
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
    rerender({ step: 5 });
    act(() => result.current.increment());
    expect(result.current.count).toBe(6);
  });
});
