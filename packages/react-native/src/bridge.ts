import { BridgeAction, BridgeOptions } from '@open-game-system/app-bridge';
import { ClientBridge } from '@open-game-system/app-bridge-client';
import { Platform } from 'react-native';

/**
 * React Native specific bridge implementation
 */
export class RNBridge extends ClientBridge {
  constructor(options: BridgeOptions = {}) {
    super({
      ...options,
      debug: options.debug || __DEV__,
    });
  }

  /**
   * Process an action for React Native
   */
  protected processAction(action: BridgeAction): void {
    // Add RN-specific action handling here if needed
    // For now, just delegate to the client bridge
    super.processAction(action);
  }

  /**
   * Get platform-specific information
   */
  getPlatformInfo(): Record<string, string | boolean | number> {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      isTV: Platform.isTV,
    };
  }

  /**
   * Set a platform-specific value
   */
  setPlatformValue<T>(key: string, value: T): void {
    const platformKey = `platform.${Platform.OS}.${key}`;
    // Call the setValue method inherited from ClientBridge
    super.setValue(platformKey, value);
  }

  /**
   * Get a platform-specific value
   */
  getPlatformValue<T>(key: string): T | undefined {
    const platformKey = `platform.${Platform.OS}.${key}`;
    // Call the getValue method inherited from ClientBridge
    return super.getValue<T>(platformKey);
  }
}
