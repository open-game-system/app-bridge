import { createNativeBridge } from "@open-game-system/app-bridge/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import type { Store } from "@open-game-system/app-bridge";

// Create a simple store definition for testing
interface TestState {
  message: string;
  [key: string]: unknown; // Required for type safety
}

// Events must have a type property
type TestEvents = 
  | { type: "SET_MESSAGE"; message: string }; // Event with data

// Define your stores
type AppStores = {
  test: {
    state: TestState;
    events: TestEvents;
  };
};

// Create the native bridge
const bridge = createNativeBridge<AppStores>({
  stores: {
    test: {
      initialState: { message: "Hello from Native Bridge!" },
      reducers: {
        SET_MESSAGE: (state, { message }) => {
          state.message = message;
        },
      },
    },
  },
});

// Create a component that uses the test store
const TestMessage = () => {
  const [state, setState] = useState<TestState | null>(null);
  const [store, setStore] = useState<Store<TestState, TestEvents> | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    bridge.getStore('test').then((testStore) => {
      setStore(testStore);
      setState(testStore.getState());
      unsubscribe = testStore.subscribe((newState) => {
        setState(newState);
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (!state || !store) {
    return <Text>Loading store...</Text>;
  }

  const handlePress = () => {
    store.dispatch({
      type: "SET_MESSAGE",
      message: "Message updated at " + new Date().toLocaleTimeString(),
    });
  };

  return (
    <View>
      <Text style={styles.message}>Current Message: {state.message}</Text>
      <Button title="Update Message" onPress={handlePress} />
    </View>
  );
};

const App = () => {
  return (
    <View style={styles.container}>
      <Text>OpenGame App Bridge Example</Text>
      <TestMessage />
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default App;
