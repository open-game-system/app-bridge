import type { MockBridge } from "@open-game-system/app-bridge";
import { createMockBridge } from "@open-game-system/app-bridge";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { beforeEach, describe, expect, it, vi, beforeAll, afterAll } from "vitest";
import { Counter } from "./Counter";
import type { AppStores } from "./types";
import { BridgeContext } from "./bridge";

describe("Counter", () => {
  let mockBridge: MockBridge<AppStores>;
  
  // Mock ReactNativeWebView on window object
  beforeAll(() => {
    // @ts-ignore - Mock the ReactNativeWebView object on window
    window.ReactNativeWebView = {
      postMessage: vi.fn()
    };
  });

  afterAll(() => {
    // @ts-ignore - Clean up mock after tests
    delete window.ReactNativeWebView;
  });

  beforeEach(() => {
    // Create a fresh mock bridge before each test
    mockBridge = createMockBridge<AppStores>({
      isSupported: true,
      initialState: {
        counter: { value: 0 },
      },
    });
  });

  it("renders initial counter value", async () => {
    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <Counter />
      </BridgeContext.Provider>
    );
    
    // Wait for the component to detect bridge support
    await act(async () => {
      // Mock a state update message to trigger the bridge supported state
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify({ type: 'STATE_UPDATE', storeKey: 'counter', data: { value: 0 } })
      });
      window.dispatchEvent(messageEvent);
    });
    
    expect(screen.getByText(/Web Bridge Counter:/)).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("increments counter when + button is clicked", async () => {
    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <Counter />
      </BridgeContext.Provider>
    );

    // Wait for the component to detect bridge support
    await act(async () => {
      // Mock a state update message to trigger the bridge supported state
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify({ type: 'STATE_UPDATE', storeKey: 'counter', data: { value: 0 } })
      });
      window.dispatchEvent(messageEvent);
    });

    // Click the increment button
    const plusButton = screen.getByText("+");
    fireEvent.click(plusButton);

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
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("decrements counter when - button is clicked", async () => {
    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <Counter />
      </BridgeContext.Provider>
    );

    // Wait for the component to detect bridge support
    await act(async () => {
      // Mock a state update message to trigger the bridge supported state
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify({ type: 'STATE_UPDATE', storeKey: 'counter', data: { value: 0 } })
      });
      window.dispatchEvent(messageEvent);
    });

    // Click the decrement button
    const minusButton = screen.getByText("-");
    fireEvent.click(minusButton);

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
    expect(screen.getByText("-1")).toBeInTheDocument();
  });

  it("sets counter value when set button is clicked", async () => {
    render(
      <BridgeContext.Provider bridge={mockBridge}>
        <Counter />
      </BridgeContext.Provider>
    );

    // Wait for the component to detect bridge support
    await act(async () => {
      // Mock a state update message to trigger the bridge supported state
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify({ type: 'STATE_UPDATE', storeKey: 'counter', data: { value: 0 } })
      });
      window.dispatchEvent(messageEvent);
    });

    // Find the input field and Set button
    const inputs = screen.getAllByRole("spinbutton");
    const input = inputs.find(el => el.closest('div')?.textContent?.includes('Set'));
    const setButton = screen.getByRole("button", { name: "Set" });
    
    // Set a new value in the input
    fireEvent.change(input!, { target: { value: "42" } });

    // Click the set button
    fireEvent.click(setButton);

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
    expect(screen.getByText("42")).toBeInTheDocument();
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

    // Wait for the component to detect bridge support
    await act(async () => {
      // Mock a state update message to trigger the bridge supported state
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify({ type: 'STATE_UPDATE' })
      });
      window.dispatchEvent(messageEvent);
    });

    // Loading state should be shown
    expect(screen.getByText("Waiting for counter data from native app...")).toBeInTheDocument();

    // Initialize the store
    await act(async () => {
      emptyBridge.setState("counter", { value: 10 });
    });

    // Loading state should be gone, counter should be shown
    expect(
      screen.queryByText("Waiting for counter data from native app...")
    ).not.toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows unsupported message when bridge is not supported", async () => {
    // Temporarily remove the ReactNativeWebView
    const originalReactNativeWebView = window.ReactNativeWebView;
    // @ts-ignore - Remove the mock
    delete window.ReactNativeWebView;
    
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
      screen.getByText("Bridge reports as unsupported")
    ).toBeInTheDocument();
    
    // Restore the ReactNativeWebView
    // @ts-ignore - Restore the mock
    window.ReactNativeWebView = originalReactNativeWebView;
  });
});
