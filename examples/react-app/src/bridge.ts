import { createBridgeContext } from "@open-game-system/app-bridge";
import type { AppStores } from "./types";

// Create the bridge context
export const BridgeContext = createBridgeContext<AppStores>();
export const BridgeProvider = BridgeContext.Provider;

// Create the counter store context
export const CounterContext = BridgeContext.createStoreContext("counter");
