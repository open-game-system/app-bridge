import type { MockBridge } from "@open-game-system/app-bridge";
import { createMockBridge } from "@open-game-system/app-bridge";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { Counter } from "./Counter";
import type { AppStores } from "./types";
import { BridgeContext, CounterContext } from "./bridge";

describe("Counter", () => {
  let mockBridge: MockBridge<AppStores>;

  beforeEach(() => {
    // Create a fresh mock bridge before each test
    mockBridge = createMockBridge<AppStores>({
      isSupported: true,
      initialState: {
        counter: { value: 0 },
      },
    });
  });

  it("renders initial counter value", () => {
    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <Counter />
      </BridgeContext.Provider>
    );
    expect(screen.getByText(/Counter: 0/)).toBeInTheDocument();
  });

  it("increments counter when + button is clicked", async () => {
    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <Counter />
      </BridgeContext.Provider>
    );

    // Click the increment button
    fireEvent.click(screen.getByText("+"));

    // Check that the event was dispatched
    expect(mockBridge.getHistory("counter")).toContainEqual({
      type: "INCREMENT",
    });

    // Update the state directly to simulate what would happen in the real app
    await act(async () => {
      const counterStore = mockBridge.getStore("counter");
      if (counterStore) {
        counterStore.produce((state) => {
          state.value = 1;
        });
      }
    });

    // Verify UI updated
    expect(screen.getByText(/Counter: 1/)).toBeInTheDocument();
  });

  it("decrements counter when - button is clicked", async () => {
    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <Counter />
      </BridgeContext.Provider>
    );

    // Click the decrement button
    fireEvent.click(screen.getByText("-"));

    // Check that the event was dispatched
    expect(mockBridge.getHistory("counter")).toContainEqual({
      type: "DECREMENT",
    });

    // Update the state directly
    await act(async () => {
      const counterStore = mockBridge.getStore("counter");
      if (counterStore) {
        counterStore.produce((state) => {
          state.value = -1;
        });
      }
    });

    // Verify UI updated
    expect(screen.getByText(/Counter: -1/)).toBeInTheDocument();
  });

  it("sets counter value when set button is clicked", async () => {
    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <Counter />
      </BridgeContext.Provider>
    );

    // Set a new value in the input
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "42" } });

    // Click the set button
    fireEvent.click(screen.getByText("Set"));

    // Check that the event was dispatched
    expect(mockBridge.getHistory("counter")).toContainEqual({
      type: "SET",
      value: 42,
    });

    // Update the state directly
    await act(async () => {
      const counterStore = mockBridge.getStore("counter");
      if (counterStore) {
        counterStore.produce((state) => {
          state.value = 42;
        });
      }
    });

    // Verify UI updated
    expect(screen.getByText(/Counter: 42/)).toBeInTheDocument();
  });

  it("shows loading state when store is not initialized", async () => {
    // Create a mock bridge with no initial state
    const emptyBridge = createMockBridge<AppStores>({
      isSupported: true,
    });

    render(
      <BridgeContext.Provider bridge={emptyBridge}>
        <Counter />
      </BridgeContext.Provider>
    );

    // Loading state should be shown
    expect(screen.getByText("Waiting for counter data...")).toBeInTheDocument();

    // Initialize the store
    await act(async () => {
      emptyBridge.setState("counter", { value: 10 });
    });

    // Loading state should be gone, counter should be shown
    expect(
      screen.queryByText("Waiting for counter data...")
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Counter: 10/)).toBeInTheDocument();
  });

  it("shows unsupported message when bridge is not supported", () => {
    // Create a mock bridge that is not supported
    const unsupportedBridge = createMockBridge<AppStores>({
      isSupported: false,
    });

    render(
      <BridgeContext.Provider bridge={unsupportedBridge}>
        <Counter />
      </BridgeContext.Provider>
    );

    // Unsupported message should be shown
    expect(
      screen.getByText("Bridge not supported in this environment")
    ).toBeInTheDocument();
  });
});
