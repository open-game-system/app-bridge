import { createWebBridge } from "@open-game-system/app-bridge-web";
import { createBridgeContext } from "@open-game-system/app-bridge-react";
import type { AppStores } from "./types";

// Create the web bridge
const webBridge = createWebBridge<AppStores>();

// Create the bridge context
export const BridgeContext = createBridgeContext<AppStores>();
export const BridgeProvider = BridgeContext.Provider;

// Create the counter store context
export const CounterContext = BridgeContext.createStoreContext("counter");

// Export the bridge for direct access
export { webBridge };
