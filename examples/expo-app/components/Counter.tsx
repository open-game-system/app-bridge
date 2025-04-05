import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';

interface CounterProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
}

export const Counter: React.FC<CounterProps> = ({
  value,
  onIncrement,
  onDecrement,
  onReset
}) => {
  return (
    <View style={styles.counterContainer}>
      <Text style={styles.counterValue}>Counter: {value}</Text>
      <View style={styles.buttonRow}>
        <Button title="-" onPress={onDecrement} />
        <View style={styles.buttonSpacing} />
        <Button title="Reset" onPress={onReset} />
        <View style={styles.buttonSpacing} />
        <Button title="+" onPress={onIncrement} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  counterContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSpacing: {
    width: 16,
  },
}); 