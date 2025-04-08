import type { State } from "@open-game-system/app-bridge-types";

export interface CounterState extends State {
  value: number;
  [key: string]: unknown;
}

export type CounterEvents =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "SET"; value: number };
