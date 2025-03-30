/**
 * Bridge state interface
 */
export interface BridgeState {
  [key: string]: unknown;
}

/**
 * Bridge action interface
 */
export interface BridgeAction {
  type: string;
  payload?: unknown;
}

/**
 * Store listener function type
 */
export type StoreListener = (state: BridgeState) => void;

/**
 * Selector function type
 */
export type Selector<T> = (state: BridgeState) => T;

/**
 * Bridge middleware function type
 */
export type BridgeMiddleware = (
  action: BridgeAction,
  state: BridgeState
) => BridgeAction | null | undefined;

/**
 * Bridge options interface
 */
export interface BridgeOptions {
  initialState?: BridgeState;
  middlewares?: BridgeMiddleware[];
  debug?: boolean;
}
