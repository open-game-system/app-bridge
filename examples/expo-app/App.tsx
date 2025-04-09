import { createNativeBridge, createStore, type WebView as BridgeWebView } from "@open-game-system/app-bridge-native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useSyncExternalStore } from "react";
import {
  Button,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { CounterEvents, CounterState } from "../shared/types";

// Local type definition for AppStores
type AppStores = {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
};

// Create a component that uses the app bridge
const App = () => {
  const webViewRef = useRef<WebView>(null);

  // Create the bridge for communication between native and web
  const bridge = React.useMemo(() => {
    console.log("[Native App] Creating Native Bridge...");
    return createNativeBridge<AppStores>();
  }, []);

  // Create and register the counter store
  useEffect(() => {
    const store = createStore({
      initialState: { value: 0 },
      producer: (draft: CounterState, event: CounterEvents) => {
        switch (event.type) {
          case "INCREMENT":
            draft.value += 1;
            break;
          case "DECREMENT":
            draft.value -= 1;
            break;
          case "SET":
            draft.value = event.value;
            break;
        }
      },
    });

    bridge.setStore('counter', store);
    return () => bridge.setStore('counter', undefined);
  }, [bridge]);
  
  // Subscribe to counter state using useSyncExternalStore
  const counterValue = useSyncExternalStore(
    (callback) => {
      const store = bridge.getStore('counter');
      if (!store) return () => {};
      return store.subscribe(() => callback());
    },
    () => {
      const store = bridge.getStore('counter');
      return store?.getSnapshot()?.value ?? 0;
    }
  );

  // Subscribe to bridge ready state
  const isReady = useSyncExternalStore(
    (callback) => {
      return bridge.subscribeToReadyState(webViewRef.current, (ready) => callback());
    },
    () => bridge.getReadyState(webViewRef.current)
  );

  // Register WebView with the bridge
  useEffect(() => {
    console.log("[Native App] WebView Registration Effect triggered.");
    if (webViewRef.current) {
      console.log("[Native App] WebView ref found, registering WebView with bridge...");
      // Create a bridge-compatible WebView wrapper
      const bridgeWebView: BridgeWebView = {
        postMessage: (message) => webViewRef.current?.postMessage(message),
        injectJavaScript: (script) => webViewRef.current?.injectJavaScript(script),
      };
      return bridge.registerWebView(bridgeWebView);
    } else {
      console.log("[Native App] WebView ref NOT found yet.");
    }
  }, [bridge, webViewRef.current]);

  // Actions to modify the counter
  const incrementCounter = () => {
    const store = bridge.getStore('counter');
    if (store) {
      store.dispatch({ type: "INCREMENT" });
    }
  };

  const decrementCounter = () => {
    const store = bridge.getStore('counter');
    if (store) {
      store.dispatch({ type: "DECREMENT" });
    }
  };

  const resetCounter = () => {
    const store = bridge.getStore('counter');
    if (store) {
      store.reset();
    }
  };

  // Platform-specific WebView source
  const webviewSource = Platform.select({
    ios: { uri: "http://localhost:5173/" },
    android: { uri: "http://10.0.2.2:5173/" },
  });

  // Inject JavaScript to add visual indicator that bridge is active
  const injectedJavaScript = `
    if (window.ReactNativeWebView) {
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
        statusBar.innerText = 'Bridge Status: ${isReady ? 'Ready' : 'Connecting'}';
        document.body.prepend(statusBar);
      };

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

      {/* Bridge status */}
      <View style={[styles.statusBar, { backgroundColor: isReady ? '#4CAF50' : '#FFA000' }]}>
        <Text style={styles.statusText}>
          Bridge Status: {isReady ? 'Ready' : 'Connecting...'}
        </Text>
      </View>

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
          injectedJavaScript={injectedJavaScript}
          onMessage={event => bridge.handleWebMessage(event)}
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
  statusBar: {
    padding: 8,
    marginBottom: 16,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
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
