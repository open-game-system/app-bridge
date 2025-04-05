import { createNativeBridge } from "@open-game-system/app-bridge/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  NativeSyntheticEvent,
} from "react-native";
import WebView, { WebViewMessageEvent } from "react-native-webview";
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

  // Create the bridge for communication between native and web
  const bridge = React.useMemo(
    () =>
      createNativeBridge<AppStores>({
        initialState: {
          counter: { value: 0 },
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

  // Register WebView with the bridge to enable sending messages TO the WebView
  useEffect(() => {
    if (webViewRef.current) {
      console.log("Registering WebView with bridge");
      const unregisterWebView = bridge.registerWebView(webViewRef.current);
      return () => {
        console.log("Unregistering WebView from bridge");
        unregisterWebView();
      };
    }
  }, [bridge, webViewRef.current]);

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
  const handleWebViewMessage = useCallback((event: NativeSyntheticEvent<{ data: string }>) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("Message from WebView:", data);
      
      // If this is an event message, manually process it
      if (data.type === 'EVENT' && data.storeKey && data.event) {
        const { storeKey, event } = data;
        
        // Handle counter events specifically
        if (storeKey === 'counter') {
          if (event.type === 'INCREMENT') {
            incrementCounter();
          } else if (event.type === 'DECREMENT') {
            decrementCounter();
          } else if (event.type === 'SET' && 'value' in event) {
            bridge.setState('counter', { value: event.value });
          }
        }
      }
    } catch (e) {
      console.warn('Error parsing WebView message:', event.nativeEvent.data, e);
    }
  }, [bridge]);

  // Platform-specific WebView source
  const webviewSource = Platform.select({
    ios: { uri: "http://localhost:5173/" },
    android: { uri: "http://10.0.2.2:5173/" },
  });

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
