import { Event, State } from "../../packages/app-bridge/src/types";

export interface CounterState extends State {
  value: number;
}

export type CounterEvents =
  | ({ type: "INCREMENT" } & Event)
  | ({ type: "DECREMENT" } & Event)
  | ({ type: "SET"; value: number } & Event);
