import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { StoreDefinition, createNativeBridge } from '@open-game-system/app-bridge/native';

// Create a simple store definition for testing
interface TestState {
  message: string;
}

type TestEvents = {
  SET_MESSAGE: {
    type: 'SET_MESSAGE';
    payload: string;
  };
};

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
      initialState: { message: 'Hello from Native Bridge!' },
      reducers: {
        SET_MESSAGE: (state: TestState, payload: string) => {
          state.message = payload;
        }
      }
    }
  }
});

const App = () => {
  return (
    <View style={styles.container}>
      <Text>OpenGame App Bridge Example</Text>
      <Text>Bridge Supported: {bridge.isSupported() ? 'Yes' : 'No'}</Text>
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
