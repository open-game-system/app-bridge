import { State } from "../../packages/app-bridge/src/types";

export interface CounterState extends State {
  value: number;
}

export type CounterEvents =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "SET"; value: number };
