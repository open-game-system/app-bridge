// Basic state type for the counter
export interface CounterState {
  value: number;
}

// Events that can be dispatched to the counter store
export type CounterEvents =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "SET"; value: number };

// Store type that would be used with a bridge
export type AppStores = {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
}; 