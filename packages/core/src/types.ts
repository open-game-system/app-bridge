/**
 * Bridge state interface
 */
export interface BridgeState {
  [key: string]: any;
}

/**
 * Bridge action interface
 */
export interface BridgeAction {
  type: string;
  payload?: any;
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
) => BridgeAction | null | void;

/**
 * Bridge options interface
 */
export interface BridgeOptions {
  initialState?: BridgeState;
  middlewares?: BridgeMiddleware[];
  debug?: boolean;
} 