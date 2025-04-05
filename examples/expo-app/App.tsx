import { createNativeBridge } from "@open-game-system/app-bridge/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import WebView from "react-native-webview";
import { CounterEvents, CounterState } from "../shared/types";

type AppStores = {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
};

// Create a component that uses the app bridge
const App = () => {
  const webViewRef = useRef<WebView>(null);
  const [counterValue, setCounterValue] = useState(0);
  const [webViewReady, setWebViewReady] = useState(false);

  // Create the bridge for communication between native and web
  const bridge = React.useMemo(
    () =>
      createNativeBridge<AppStores>({
        initialState: {
          counter: { value: 0 },
        },
        // Define producers for each store to handle events
        producers: {
          // Counter store producer - required to handle events from the web
          counter: (draft, event) => {
            // Use a switch statement to handle different event types
            switch (event.type) {
              case "INCREMENT":
                // Immer allows us to "mutate" the draft directly
                draft.value += 1;
                break;

              case "DECREMENT":
                draft.value -= 1;
                break;

              case "SET":
                draft.value = event.value;
                break;

              default:
                // Use console.warn for unhandled events as it indicates a potential issue
                console.warn(`Unhandled counter event: ${(event as any).type}`);
                break;
            }
          },
          // Add other store producers as needed for handling their events
        },
      }),
    []
  );

  useEffect(() => {
    // Get a reference to the counter store
    const counterStore = bridge.getStore("counter");

    // Subscribe to counter changes
    const unsubscribe = counterStore?.subscribe((state) => {
      setCounterValue(state.value);
    });

    return () => {
      // Clean up subscriptions when component unmounts
      unsubscribe?.();
    };
  }, [bridge]);

  // Register WebView with the bridge only after it's ready
  useEffect(() => {
    if (webViewRef.current && webViewReady) {
      // Register the WebView with the bridge
      const unregisterWebView = bridge.registerWebView(webViewRef.current);

      // Force update all stores to ensure WebView gets initial state
      // Use the store keys we know exist in our AppStores type
      const storeKeys: (keyof AppStores)[] = ["counter"];
      storeKeys.forEach((storeKey) => {
        const store = bridge.getStore(storeKey);
        if (store) {
          // Use produce with identity function to trigger an update
          // without changing the state
          bridge.produce(storeKey, (draft) => {
            // This is an identity function that doesn't change state
            // but will trigger the store to send its state to WebView
          });
        }
      });

      return () => {
        unregisterWebView();
      };
    }
  }, [bridge, webViewRef.current, webViewReady]);

  // Actions to modify the counter
  const incrementCounter = () =>
    bridge.produce("counter", (draft) => {
      draft.value += 1;
    });

  const decrementCounter = () =>
    bridge.produce("counter", (draft) => {
      draft.value -= 1;
    });

  const resetCounter = () => bridge.setState("counter", { value: 0 });

  // Handle messages FROM the WebView
  const handleWebViewMessage = useCallback(
    (event: NativeSyntheticEvent<{ data: string }>) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        // If this is an event message, manually process it
        if (data.type === "EVENT" && data.storeKey && data.event) {
          const { storeKey, event } = data;

          // Handle counter events specifically
          if (storeKey === "counter") {
            if (event.type === "INCREMENT") {
              incrementCounter();
            } else if (event.type === "DECREMENT") {
              decrementCounter();
            } else if (event.type === "SET" && "value" in event) {
              bridge.setState("counter", { value: event.value });
            }
          }
        } else if (data.type === "WEBVIEW_READY") {
          // WebView is now ready to receive messages
          setWebViewReady(true);
        }
      } catch (e) {
        console.warn(
          "Error parsing WebView message:",
          event.nativeEvent.data,
          e
        );
      }
    },
    [bridge]
  );

  // Platform-specific WebView source
  const webviewSource = Platform.select({
    ios: { uri: "http://localhost:5173/" },
    android: { uri: "http://10.0.2.2:5173/" },
  });

  // Inject JavaScript to notify when the WebView is fully loaded
  const injectedJavaScript = `
    // Send a message to notify that the WebView is ready
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'WEBVIEW_READY' }));

      // Make it more visible when bridge is active
      const addStatusBar = () => {
        const statusBar = document.createElement('div');
        statusBar.id = 'webview-status-bar';
        statusBar.style.position = 'fixed';
        statusBar.style.top = '0';
        statusBar.style.left = '0';
        statusBar.style.right = '0';
        statusBar.style.padding = '4px';
        statusBar.style.background = 'green';
        statusBar.style.color = 'white';
        statusBar.style.textAlign = 'center';
        statusBar.style.zIndex = '9999';
        statusBar.innerText = 'Bridge Status: Detected (Running in WebView)';
        document.body.prepend(statusBar);
      };

      // Wait for DOM to be fully loaded
      if (document.readyState === 'complete') {
        addStatusBar();
      } else {
        window.addEventListener('load', addStatusBar);
      }
    }
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>OpenGame App Bridge Example</Text>

      {/* Native counter UI */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterValue}>Native Counter: {counterValue}</Text>
        <View style={styles.buttonRow}>
          <Button title="-" onPress={decrementCounter} />
          <View style={styles.buttonSpacing} />
          <Button title="Reset" onPress={resetCounter} />
          <View style={styles.buttonSpacing} />
          <Button title="+" onPress={incrementCounter} />
        </View>
        <Text style={styles.counterHelp}>
          Changes from web will sync to native and vice versa
        </Text>
      </View>

      {/* WebView container */}
      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          source={webviewSource}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          injectedJavaScript={injectedJavaScript}
        />
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
  },
  counterContainer: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  counterValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonSpacing: {
    width: 16,
  },
  counterHelp: {
    marginTop: 16,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  webviewContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
  },
});

export default App;
