import React from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { WebViewProps } from 'react-native-webview';
import type { BridgeStores, NativeBridge } from '@open-game-system/app-bridge-types';

/**
 * Props for BridgedWebView component
 * Extends standard WebViewProps to allow passing any valid prop.
 */
export interface BridgedWebViewProps<TStores extends BridgeStores>
  extends Omit<WebViewProps, 'onMessage' | 'source' | 'ref'>
{
  /**
   * The NativeBridge instance to use for communication
   */
  bridge: NativeBridge<TStores>;
  
  /**
   * Optional custom message handler for WebView messages
   * This will be called *after* the bridge processes the message
   */
  onMessage?: (event: WebViewMessageEvent) => void;
  
  /**
   * The source of the WebView (required)
   */
  source: WebViewProps['source'];
}

/**
 * A WebView component that automatically handles bridge registration and message handling
 */
export function BridgedWebView<TStores extends BridgeStores>({
  bridge,
  onMessage,
  source,
  ...rest
}: BridgedWebViewProps<TStores>) {
  const webViewRef = React.useRef<WebView>(null);

  // Register/unregister WebView with the bridge
  React.useEffect(() => {
    if (webViewRef.current) {
      bridge.registerWebView(webViewRef.current);
    }
  }, [bridge]);

  // Create a message handler that processes bridge messages and calls custom handler
  const handleMessage = React.useCallback(
    (event: WebViewMessageEvent) => {
      // Handle bridge message processing
      bridge.handleWebMessage(event.nativeEvent.data);
      
      // Call custom handler if provided
      onMessage?.(event);
    },
    [bridge, onMessage]
  );

  return (
    <WebView
      ref={webViewRef}
      source={source}
      onMessage={handleMessage}
      {...rest}
    />
  );
} 