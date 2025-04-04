import {
  createBridgeContext,
  CreateBridgeStores,
  createWebBridge,
  StoreDefinition,
} from "@open-game-system/app-bridge";

export interface CounterState {
  value: number;
}

export interface CounterEvents {
  type: "INCREMENT" | "DECREMENT" | "SET";
  value?: number;
}

export type AppStores = CreateBridgeStores<{
  counter: StoreDefinition<CounterState, CounterEvents>;
}>;

export const bridge = createWebBridge<AppStores>();
export const BridgeContext = createBridgeContext<AppStores>();
export const BridgeProvider = BridgeContext.Provider;
export const CounterContext = BridgeContext.createStoreContext("counter");
