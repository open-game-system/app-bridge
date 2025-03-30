import { Bridge, BridgeAction, BridgeOptions, BridgeState } from '@open-game-system/app-bridge';
import { deepClone } from '@open-game-system/app-bridge/utils';

/**
 * Mock bridge implementation for testing
 */
export class MockBridge extends Bridge {
  private actionLog: BridgeAction[] = [];

  constructor(options: BridgeOptions = {}) {
    super({
      ...options,
      debug: options.debug || true,
    });
  }

  /**
   * Custom implementation for recording actions
   */
  override dispatch(action: BridgeAction): void {
    // Record the action
    this.actionLog.push(deepClone(action));

    // Continue with normal dispatch
    super.dispatch(action);
  }

  /**
   * Get the log of dispatched actions
   */
  getActionLog(): BridgeAction[] {
    return deepClone(this.actionLog);
  }

  /**
   * Clear the action log
   */
  clearActionLog(): void {
    this.actionLog = [];
  }

  /**
   * Process actions for tests
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
          const newState = { ...currentState, ...action.payload };
          this.setState(newState);
        }
        break;

      default:
        // Just log for tests
        console.log('Mock bridge received action:', action);
        break;
    }
  }

  /**
   * Manually set state for testing purposes
   */
  setTestState(state: BridgeState): void {
    this.setState(state);
  }
}
