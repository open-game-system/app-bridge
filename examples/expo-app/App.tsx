import {
  BridgedWebView,
  createNativeBridgeContext,
  createNativeBridge,
  createStore,
  NativeBridge,
  BridgeStores
} from "@open-game-system/app-bridge-react-native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo } from "react";
import {
  Button,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CounterEvents, CounterState } from "../shared/types";

// Local type definition for AppStores
type AppStores = {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
};

// Create the bridge instance (outside the component is fine)
const bridge = createNativeBridge<AppStores>();

// Create and register the counter store (outside the component is fine)
const counterStore = createStore({
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
bridge.setStore('counter', counterStore);

// Create context using the new package
const BridgeContext = createNativeBridgeContext<AppStores>();
const CounterContext = BridgeContext.createNativeStoreContext('counter');

// Counter display and controls component
const Counter = () => {
  // Use the specific store hooks
  const counterValue = CounterContext.useSelector((state) => state.value);
  const store = CounterContext.useStore(); // Gets the store instance

  const incrementCounter = () => store.dispatch({ type: "INCREMENT" });
  const decrementCounter = () => store.dispatch({ type: "DECREMENT" });
  const resetCounter = () => store.reset();
  const setCounter = () => store.dispatch({ type: "SET", value: 100 });

  return (
    <View style={styles.counterContainer}>
      <Text style={styles.counterValue}>Native Counter: {counterValue}</Text>
      <View style={styles.buttonRow}>
        <Button title="-" onPress={decrementCounter} />
        <View style={styles.buttonSpacing} />
        <Button title="Reset" onPress={resetCounter} />
        <View style={styles.buttonSpacing} />
        <Button title="Set 100" onPress={setCounter} />
        <View style={styles.buttonSpacing} />
        <Button title="+" onPress={incrementCounter} />
      </View>
      <Text style={styles.counterHelp}>
        Changes from web will sync to native and vice versa
      </Text>
    </View>
  );
};

// Main App component
const App = () => {
  // Platform-specific WebView source
  const webviewSource = useMemo(() => Platform.select({
    ios: { uri: "http://localhost:5173/" }, // Ensure your dev server port matches
    android: { uri: "http://10.0.2.2:5173/" },
    default: { uri: "http://localhost:5173/" }
  }), []);

  return (
    // Provide the bridge instance, casting via unknown
    <BridgeContext.BridgeProvider bridge={bridge as unknown as NativeBridge<AppStores>}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>OpenGame App Bridge Example</Text>
        <CounterContext.StoreProvider>
          <Counter />
        </CounterContext.StoreProvider>
        <View style={styles.webviewContainer}>
          <BridgedWebView
            bridge={bridge as unknown as NativeBridge<AppStores>}
            source={webviewSource}
            style={styles.webview}
          />
        </View>
        <StatusBar style="auto" />
      </SafeAreaView>
    </BridgeContext.BridgeProvider>
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
