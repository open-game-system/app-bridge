import { createBridgeContext } from '@open-game-system/app-bridge';
import { AppStores } from './bridge';

const { useStore } = createBridgeContext<AppStores>();

export { useStore }; 