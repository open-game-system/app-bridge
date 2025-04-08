/**
 * @vitest-environment jsdom
 */
import type { BridgeStores, State } from "@open-game-system/app-bridge-types";
import { createWebBridge } from "@open-game-system/app-bridge-web";
import { act, cleanup, render, screen } from "@testing-library/react";
import React, { ErrorInfo, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBridgeContext } from "./index";

// Error boundary for testing error cases
class ErrorBoundary extends React.Component<
  {
    children: ReactNode;
    onError: (error: Error, errorInfo: ErrorInfo) => void;
  },
  { hasError: boolean }
> {
  constructor(props: {
    children: ReactNode;
    onError: (error: Error, errorInfo: ErrorInfo) => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Error occurred</div>;
    }
    return this.props.children;
  }
}

interface CounterState extends State {
  count: number;
}

type CounterEvent =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "SET"; value: number };

interface TestStores extends BridgeStores {
  counter: {
    state: CounterState;
    events: CounterEvent;
  };
}

// Create a custom bridge context for testing
const TestBridgeContext = createBridgeContext<TestStores>();
const CounterContext = TestBridgeContext.createStoreContext("counter");

// Use the destructured bridge components
const { Provider: BridgeProvider, Supported, Unsupported } = TestBridgeContext;

describe("React Bridge Integration", () => {
  let bridge: ReturnType<typeof createWebBridge<TestStores>>;

  beforeEach(() => {
    // Setup mock for ReactNativeWebView
    (window as any).ReactNativeWebView = {
      postMessage: vi.fn(),
    };

    bridge = createWebBridge<TestStores>();

    // Simulate state initialization that would normally come from native
    window.dispatchEvent(
      new MessageEvent("message", {
        data: JSON.stringify({
          type: "STATE_INIT",
          storeKey: "counter",
          data: { count: 0 },
        }),
      })
    );
  });

  afterEach(() => {
    delete (window as any).ReactNativeWebView;
    vi.clearAllMocks();
    cleanup(); // Clean up mounted components
  });

  describe("BridgeContext", () => {
    it("throws error when used outside provider", () => {
      // Component that uses the context without a provider
      const TestComponent = () => {
        const store = CounterContext.useStore();
        return <div>{store.getSnapshot().count}</div>;
      };

      const errorHandler = vi.fn();

      render(
        <ErrorBoundary onError={errorHandler}>
          <TestComponent />
        </ErrorBoundary>
      );

      // Error boundary should catch the error
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      // And our error handler should have been called with the right error
      expect(errorHandler).toHaveBeenCalled();
      expect(errorHandler.mock.calls[0][0].message).toMatch(
        /Store "counter" is not available/
      );
    });

    it("renders Supported content when bridge is supported", () => {
      render(
        <BridgeProvider bridge={bridge}>
          <Supported>
            <div data-testid="supported-content">Supported</div>
          </Supported>
          <Unsupported>
            <div data-testid="unsupported-content">Unsupported</div>
          </Unsupported>
        </BridgeProvider>
      );

      expect(screen.getByTestId("supported-content")).toBeInTheDocument();
      expect(
        screen.queryByTestId("unsupported-content")
      ).not.toBeInTheDocument();
    });

    it("renders Unsupported content when bridge is not supported", () => {
      // Mock ReactNativeWebView to be undefined
      delete (window as any).ReactNativeWebView;
      // Create a new bridge instance after removing ReactNativeWebView
      bridge = createWebBridge<TestStores>();

      render(
        <BridgeProvider bridge={bridge}>
          <Supported>
            <div data-testid="supported-content">Supported</div>
          </Supported>
          <Unsupported>
            <div data-testid="unsupported-content">Unsupported</div>
          </Unsupported>
        </BridgeProvider>
      );

      expect(screen.queryByTestId("supported-content")).not.toBeInTheDocument();
      expect(screen.getByTestId("unsupported-content")).toBeInTheDocument();
    });
  });

  describe("StoreContext", () => {
    describe("Ready State", () => {
      it("renders Loading component when bridge is supported but store is not ready", () => {
        // Create a new bridge without initializing any stores
        const emptyBridge = createWebBridge<TestStores>();

        render(
          <BridgeProvider bridge={emptyBridge}>
            <CounterContext.Provider>
              <div data-testid="provider-content">Store is available</div>
            </CounterContext.Provider>
            <CounterContext.Loading>
              <div data-testid="loading-content">Store is loading</div>
            </CounterContext.Loading>
          </BridgeProvider>
        );

        expect(screen.queryByTestId("provider-content")).not.toBeInTheDocument();
        expect(screen.getByTestId("loading-content")).toBeInTheDocument();
      });

      it("renders Provider content when store becomes ready", () => {
        // Create a new bridge without initializing any stores
        const emptyBridge = createWebBridge<TestStores>();

        render(
          <BridgeProvider bridge={emptyBridge}>
            <CounterContext.Provider>
              <div data-testid="provider-content">Store is available</div>
            </CounterContext.Provider>
            <CounterContext.Loading>
              <div data-testid="loading-content">Store is loading</div>
            </CounterContext.Loading>
          </BridgeProvider>
        );

        // Initially should show loading
        expect(screen.queryByTestId("provider-content")).not.toBeInTheDocument();
        expect(screen.getByTestId("loading-content")).toBeInTheDocument();

        // Simulate store initialization
        act(() => {
          window.dispatchEvent(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "STATE_INIT",
                storeKey: "counter",
                data: { count: 0 },
              }),
            })
          );
        });

        // Now should show provider content
        expect(screen.getByTestId("provider-content")).toBeInTheDocument();
        expect(screen.queryByTestId("loading-content")).not.toBeInTheDocument();
      });

      it("does not render Loading when bridge is not supported", () => {
        // Create a bridge without ReactNativeWebView
        delete (window as any).ReactNativeWebView;
        const unsupportedBridge = createWebBridge<TestStores>();

        render(
          <BridgeProvider bridge={unsupportedBridge}>
            <CounterContext.Loading>
              <div data-testid="loading-content">Store is loading</div>
            </CounterContext.Loading>
          </BridgeProvider>
        );

        expect(screen.queryByTestId("loading-content")).not.toBeInTheDocument();
      });

      it("handles store becoming unavailable", () => {
        render(
          <BridgeProvider bridge={bridge}>
            <CounterContext.Provider>
              <div data-testid="provider-content">Store is available</div>
            </CounterContext.Provider>
            <CounterContext.Loading>
              <div data-testid="loading-content">Store is loading</div>
            </CounterContext.Loading>
          </BridgeProvider>
        );

        // Initially should show provider content
        expect(screen.getByTestId("provider-content")).toBeInTheDocument();
        expect(screen.queryByTestId("loading-content")).not.toBeInTheDocument();

        // Simulate store becoming unavailable
        act(() => {
          window.dispatchEvent(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "STATE_UPDATE",
                storeKey: "counter",
                data: null,
              }),
            })
          );
        });

        // Now should show loading
        expect(screen.queryByTestId("provider-content")).not.toBeInTheDocument();
        expect(screen.getByTestId("loading-content")).toBeInTheDocument();
      });
    });

    describe("useStore hook", () => {
      it("provides access to store when used inside Provider", () => {
        const CounterDisplay = () => {
          const store = CounterContext.useStore();
          return (
            <div data-testid="counter">Count: {store.getSnapshot().count}</div>
          );
        };

        render(
          <BridgeProvider bridge={bridge}>
            <CounterContext.Provider>
              <CounterDisplay />
            </CounterContext.Provider>
          </BridgeProvider>
        );

        expect(screen.getByTestId("counter")).toHaveTextContent("Count: 0");
      });

      it("throws when used outside of Provider", () => {
        // Component that uses the store outside of Provider
        const UseStoreOutsideProvider = () => {
          const store = CounterContext.useStore();
          return <div>{store.getSnapshot().count}</div>;
        };

        const errorHandler = vi.fn();

        render(
          <BridgeProvider bridge={bridge}>
            <ErrorBoundary onError={errorHandler}>
              <UseStoreOutsideProvider />
            </ErrorBoundary>
          </BridgeProvider>
        );

        // Error boundary should catch the error
        expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
        // And our error handler should have been called with the right error
        expect(errorHandler).toHaveBeenCalled();
        expect(errorHandler.mock.calls[0][0].message).toMatch(
          /Store "counter" is not available/
        );
      });
    });

    describe("useSelector hook", () => {
      it("selects data from a store", () => {
        const CounterValue = () => {
          const count = CounterContext.useSelector((state) => state.count);
          return <div data-testid="counter-value">{count}</div>;
        };

        render(
          <BridgeProvider bridge={bridge}>
            <CounterContext.Provider>
              <CounterValue />
            </CounterContext.Provider>
          </BridgeProvider>
        );

        expect(screen.getByTestId("counter-value")).toHaveTextContent("0");
      });

      it("updates when store state changes", () => {
        const CounterValue = () => {
          const count = CounterContext.useSelector((state) => state.count);
          return <div data-testid="counter-value">{count}</div>;
        };

        render(
          <BridgeProvider bridge={bridge}>
            <CounterContext.Provider>
              <CounterValue />
            </CounterContext.Provider>
          </BridgeProvider>
        );

        // Initial state
        expect(screen.getByTestId("counter-value")).toHaveTextContent("0");

        // Update state
        act(() => {
          window.dispatchEvent(
            new MessageEvent("message", {
              data: JSON.stringify({
                type: "STATE_UPDATE",
                storeKey: "counter",
                operations: [{ op: "replace", path: "/count", value: 42 }],
              }),
            })
          );
        });

        // Check updated state
        expect(screen.getByTestId("counter-value")).toHaveTextContent("42");
      });

      it("throws when used outside of Provider", () => {
        const UseSelectorOutsideProvider = () => {
          const count = CounterContext.useSelector((state) => state.count);
          return <div>{count}</div>;
        };

        const errorHandler = vi.fn();

        render(
          <BridgeProvider bridge={bridge}>
            <ErrorBoundary onError={errorHandler}>
              <UseSelectorOutsideProvider />
            </ErrorBoundary>
          </BridgeProvider>
        );

        // Error boundary should catch the error
        expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
        // And our error handler should have been called with the right error
        expect(errorHandler).toHaveBeenCalled();
        expect(errorHandler.mock.calls[0][0].message).toMatch(
          /Store "counter" is not available/
        );
      });
    });
  });
});
