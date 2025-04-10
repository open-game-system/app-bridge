/// <reference types="jest" />

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { createMockBridge } from '@open-game-system/app-bridge-testing';
import { BridgedWebView } from '../BridgedWebView'; // Component under test
import type { BridgeStores } from '@open-game-system/app-bridge-types';
import type { NativeBridge } from '@open-game-system/app-bridge-types';

// Import the *mocked* WebView from the global setup
import { WebView } from 'react-native-webview'; 

describe('BridgedWebView', () => {
  let mockBridge: NativeBridge<BridgeStores>; // Use the correct type

  beforeEach(() => {
    // Create base mock and add missing NativeBridge methods
    const baseMockBridge = createMockBridge(); 
    mockBridge = {
      ...baseMockBridge,
      // Add missing NativeBridge methods as jest.fn()
      handleWebMessage: jest.fn(),
      registerWebView: jest.fn(() => jest.fn()), // Returns unregister function
      unregisterWebView: jest.fn(),
      onWebViewReady: jest.fn(() => jest.fn()), // Returns unsubscribe function
      setStore: jest.fn(), // Add setStore if needed
      isWebViewReady: jest.fn().mockReturnValue(true), // Assume ready for tests
    } as NativeBridge<BridgeStores>; // Cast to ensure type compatibility

    // Clear mock calls on the globally mocked WebView
    if ((WebView as jest.Mock)?.mockClear) {
      (WebView as jest.Mock).mockClear();
    }
    // Optionally clear calls on instances if needed, but may not be necessary
    // const instance = (WebView as jest.Mock).mock.instances[0];
    // instance?.postMessage.mockClear(); 
    // instance?.injectJavaScript.mockClear();
  });

  it('should render without crashing', () => {
    const source = { uri: 'https://example.com' };
    // Just check that rendering doesn't throw an error
    expect(() => {
      render(
        <BridgedWebView bridge={mockBridge} source={source} />
      );
    }).not.toThrow(); 
  });

  it('should call bridge.registerWebView on mount', () => {
    const source = { uri: 'https://example.com' };
    render(<BridgedWebView bridge={mockBridge} source={source} />);
    expect(mockBridge.registerWebView).toHaveBeenCalledTimes(1);
    // Asserting the ref content is difficult and brittle, check it was called
    expect(mockBridge.registerWebView).toHaveBeenCalledWith(expect.anything()); 
  });

  it('should call bridge.handleWebMessage and props.onMessage when receiving a message', () => {
    const source = { uri: 'https://example.com' };
    const mockTestMessageData = 'test message';
    const mockOnMessageProp = jest.fn();

    render(
      <BridgedWebView
        bridge={mockBridge}
        source={source}
        onMessage={mockOnMessageProp}
      />
    );

    // Get the props passed to the *globally* mocked WebView instance
    const mockWebViewProps = (WebView as jest.Mock).mock.calls[0]?.[0]; 
    expect(mockWebViewProps).toBeDefined();
    expect(mockWebViewProps.onMessage).toBeInstanceOf(Function);

    // Simulate message event by calling the onMessage prop passed to the mock
    const nativeEvent = { data: mockTestMessageData };
    act(() => {
      mockWebViewProps.onMessage({ nativeEvent });
    });

    // Check bridge interaction
    expect(mockBridge.handleWebMessage).toHaveBeenCalledTimes(1);
    expect(mockBridge.handleWebMessage).toHaveBeenCalledWith(mockTestMessageData);
    
    // Check prop callback interaction
    expect(mockOnMessageProp).toHaveBeenCalledTimes(1);
    expect(mockOnMessageProp).toHaveBeenCalledWith({ nativeEvent });
  });
}); 