import type { Bridge, BridgeStores } from '../types';

export interface WebViewMessage {
  type: 'STATE_UPDATE' | 'EVENT';
  storeKey: string;
  data: any;
}

export interface WebViewBridge {
  postMessage(message: string): void;
}

declare global {
  interface Window {
    ReactNativeWebView?: WebViewBridge;
  }
}

export function createWebBridge<TStores extends BridgeStores>(): Bridge<TStores>; 