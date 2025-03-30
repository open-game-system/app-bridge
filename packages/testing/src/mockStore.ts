import { BridgeAction, BridgeState, Selector, StoreListener } from '@open-game-system/app-bridge';

/**
 * A simplified mock store for testing
 */
export class MockStore {
  private state: BridgeState;
  private listeners: Set<StoreListener>;

  /**
   * Create a new mock store
   */
  constructor(initialState: BridgeState = {}) {
    this.state = { ...initialState };
    this.listeners = new Set();
  }

  /**
   * Get the current state
   */
  getState(): BridgeState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Dispatch a mock action
   */
  dispatch(action: BridgeAction): void {
    console.log('Mock store dispatching:', action);

    // Simple reducer
    switch (action.type) {
      case 'SET_STATE':
        if (action.payload && typeof action.payload === 'object') {
          this.setState(action.payload as BridgeState);
        }
        break;

      case 'UPDATE_STATE':
        if (action.payload && typeof action.payload === 'object') {
          this.setState({ ...this.state, ...action.payload });
        }
        break;

      default:
        // Do nothing for other actions
        break;
    }
  }

  /**
   * Update state
   */
  setState(newState: BridgeState): void {
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
        console.error('Error in mock store listener:', error);
      }
    }
  }

  /**
   * Helper to select state with a selector
   */
  select<T>(selector: Selector<T>): T {
    return selector(this.getState());
  }
}
