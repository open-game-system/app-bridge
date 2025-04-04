import { createNativeBridge } from "@open-game-system/app-bridge/native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CounterEvents, CounterState } from "../shared/types";

type AppStores = {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
};

// Create a component that uses the test store
const App = () => {
  const bridge = createNativeBridge<AppStores>({
    initialState: {
      counter: { value: 0 },
    },
  });

  return (
    <View style={styles.container}>
      <Text>OpenGame App Bridge Example</Text>
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
