import { BridgeOptions } from '@open-game-system/app-bridge';
import { RNBridge } from '../bridge';
import { Platform } from 'react-native';

/**
 * Expo-specific bridge implementation
 */
export class ExpoBridge extends RNBridge {
  constructor(options: BridgeOptions = {}) {
    super(options);

    // Initialize with Expo-specific defaults
    super.setValue('platform.isExpo', true);

    // Add Expo version if available
    if (global.expo && global.expo.version) {
      super.setValue('platform.expoVersion', global.expo.version);
    }
  }

  /**
   * Get Expo-specific information
   */
  getExpoInfo(): Record<string, any> {
    return {
      isExpo: true,
      version: global.expo?.version,
      platform: Platform.OS,
      expoConstants: global.expo?.Constants,
    };
  }
}

/**
 * Create an Expo bridge instance
 */
export function createExpoBridge(options: BridgeOptions = {}): ExpoBridge {
  return new ExpoBridge(options);
}
