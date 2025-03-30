import { Bridge, BridgeAction, BridgeOptions, BridgeState } from '@open-game-system/app-bridge';
import { produce } from '@open-game-system/app-bridge/utils';

/**
 * Client-specific bridge implementation
 */
export class ClientBridge extends Bridge {
  /**
   * Process an action and update state accordingly
   */
  protected override processAction(action: BridgeAction): void {
    switch (action.type) {
      case 'SET_STATE':
        if (action.payload && typeof action.payload === 'object') {
          this.setState(action.payload as BridgeState);
        }
        break;

      case 'UPDATE_STATE':
        if (action.payload && typeof action.payload === 'object') {
          const currentState = this.getState();
          const newState = produce(currentState, (draft: BridgeState) => {
            Object.assign(draft, action.payload);
          });
          this.setState(newState);
        }
        break;

      default:
        // For any other actions, let the parent class handle them
        super.processAction(action);
        break;
    }
  }

  /**
   * Set a specific value in the state
   */
  setValue<T>(key: string, value: T): void {
    this.dispatch({
      type: 'UPDATE_STATE',
      payload: { [key]: value },
    });
  }

  /**
   * Get a specific value from the state
   */
  getValue<T>(key: string): T | undefined {
    const state = this.getState();
    return state[key] as T | undefined;
  }

  /**
   * Clear a specific key from the state
   */
  clearValue(key: string): void {
    const state = this.getState();
    const newState = produce(state, (draft: BridgeState) => {
      delete draft[key];
    });
    this.setState(newState);
  }

  /**
   * Reset the state to the given state or empty object
   */
  resetState(newState: BridgeState = {}): void {
    this.setState(newState);
  }
}
