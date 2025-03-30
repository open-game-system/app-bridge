import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BridgeProvider } from '@open-game-system/app-bridge-react';
import { ExpoBridge } from '@open-game-system/app-bridge-react-native/expo';
import { useBridge, useSelector } from '@open-game-system/app-bridge-react/hooks';

// Define our app state type
type AppState = {
  count: number;
  message: string;
  items: string[];
};

// Initial state for the app
const initialState: AppState = {
  count: 0,
  message: 'Welcome to OpenGame App Bridge!',
  items: ['Item 1', 'Item 2', 'Item 3'],
};

export default function App() {
  return (
    <BridgeProvider<AppState>
      bridge={new ExpoBridge<AppState>({ initialState, debug: true })}
    >
      <AppContent />
    </BridgeProvider>
  );
}

function AppContent() {
  const bridge = useBridge<AppState>();
  const count = useSelector<AppState, number>((state) => state.count);
  const message = useSelector<AppState, string>((state) => state.message);
  const items = useSelector<AppState, string[]>((state) => state.items);
  const [newItem, setNewItem] = useState('');

  // Action to increment the counter
  const increment = () => {
    bridge.dispatch({ type: 'INCREMENT' });
  };

  // Action to decrement the counter
  const decrement = () => {
    bridge.dispatch({ type: 'DECREMENT' });
  };

  // Action to add a new item
  const addItem = () => {
    bridge.dispatch({ 
      type: 'ADD_ITEM',
      payload: `Item ${items.length + 1}`
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{message}</Text>
      
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>Count: {count}</Text>
        <View style={styles.buttonRow}>
          <Button title="-" onPress={decrement} />
          <View style={styles.buttonSpacer} />
          <Button title="+" onPress={increment} />
        </View>
      </View>

      <View style={styles.itemsContainer}>
        <Text style={styles.sectionTitle}>Items:</Text>
        <ScrollView style={styles.itemsList}>
          {items.map((item, index) => (
            <Text key={index} style={styles.item}>
              {item}
            </Text>
          ))}
        </ScrollView>
        <Button title="Add Item" onPress={addItem} />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  counterText: {
    fontSize: 18,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonSpacer: {
    width: 20,
  },
  itemsContainer: {
    width: '100%',
    maxHeight: 300,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemsList: {
    maxHeight: 200,
    marginBottom: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  item: {
    fontSize: 16,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
}); 