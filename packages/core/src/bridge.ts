import { BridgeAction, BridgeMiddleware, BridgeOptions, BridgeState, StoreListener } from './types';
import { deepClone } from './utils';

/**
 * Core Bridge class that provides state management functionality
 */
export class Bridge {
  private state: BridgeState;
  private listeners: Set<StoreListener>;
  private middlewares: BridgeMiddleware[];
  private debug: boolean;

  constructor(options: BridgeOptions = {}) {
    this.state = options.initialState || {};
    this.listeners = new Set();
    this.middlewares = options.middlewares || [];
    this.debug = options.debug || false;
  }

  /**
   * Get the current state
   */
  getState(): BridgeState {
    return deepClone(this.state);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Dispatch an action to update state
   */
  dispatch(action: BridgeAction): void {
    if (this.debug) {
      console.log('Dispatching action:', action);
    }

    // Run action through middlewares
    let processedAction = action;
    for (const middleware of this.middlewares) {
      const result = middleware(processedAction, this.state);
      if (result === null) {
        // Middleware cancelled the action
        if (this.debug) {
          console.log('Action cancelled by middleware');
        }
        return;
      } else if (result) {
        processedAction = result;
      }
    }

    // Process action (to be implemented by subclasses)
    this.processAction(processedAction);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Process an action to update state
   * (to be implemented by specific bridge implementations)
   */
  protected processAction(action: BridgeAction): void {
    // Base implementation does nothing
    if (this.debug) {
      console.warn('Base processAction called, action not handled:', action);
    }
  }

  /**
   * Update state and notify listeners
   */
  protected setState(newState: BridgeState): void {
    this.state = newState;
    this.notifyListeners();
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    const currentState = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(currentState);
      } catch (error) {
        console.error('Error in bridge listener:', error);
      }
    }
  }
}
