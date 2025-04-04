import { State, Event } from "@open-game-system/app-bridge";

export interface CounterState extends State {
  value: number;
}

export type CounterEvents = 
  | { type: "INCREMENT" } & Event
  | { type: "DECREMENT" } & Event
  | { type: "SET"; value: number } & Event;

export type AppStores = {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
}; 