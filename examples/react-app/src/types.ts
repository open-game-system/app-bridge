import { CounterEvents, CounterState } from "../../shared/types";

export type AppStores = {
  counter: {
    state: CounterState;
    events: CounterEvents;
  };
};
