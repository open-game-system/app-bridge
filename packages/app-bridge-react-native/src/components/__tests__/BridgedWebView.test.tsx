/// <reference types="jest" />

import React from 'react';
import { render, act, screen } from '@testing-library/react-native';
import { createMockBridge } from '@open-game-system/app-bridge-testing';
import { BridgedWebView } from '../BridgedWebView'; // Component under test
import type { BridgeStores } from '@open-game-system/app-bridge-types';
import type { NativeBridge } from '@open-game-system/app-bridge-types';

// WebView is now manually mocked via __mocks__

// Define test-specific store types
interface TestStores extends BridgeStores {
  counter: {
    state: { value: number };
    events: { type: 'INCREMENT' } | { type: 'DECREMENT' };
  };
}

describe('BridgedWebView', () => {
  let mockBridge: NativeBridge<TestStores>;

  // Helper to create a fully typed Native mock bridge
  const createFullyMockedNativeBridge = () => {
    const baseMock = createMockBridge<TestStores>();
    return {
      ...baseMock,
      handleWebMessage: jest.fn(),
      registerWebView: jest.fn(() => jest.fn()), // Returns unregister function
      unregisterWebView: jest.fn(),
      onWebViewReady: jest.fn(() => jest.fn()), // Returns unsubscribe function
      setStore: jest.fn(), // Add setStore
      isWebViewReady: jest.fn().mockReturnValue(true), // Mock ready state
      subscribeToReadyState: jest.fn(() => jest.fn()), // Returns unsubscribe function
      getReadyState: jest.fn().mockReturnValue(true), // Mock ready state
    } as NativeBridge<TestStores>; // Cast to ensure type compatibility
  }

  beforeEach(() => {
    mockBridge = createFullyMockedNativeBridge();
    // No need to clear WebView mock here, Jest handles manual mocks
  });

  it('should render without crashing', () => {
    const source = { uri: 'https://example.com' };
    // Check rendering doesn't throw
    expect(() => {
      render(
        <BridgedWebView bridge={mockBridge} source={source} testID="test-webview" /> // Add testID
      );
    }).not.toThrow(); 
    // Check that the mock (which renders a View/Text) is present
    expect(screen.getByTestId("test-webview")).toBeTruthy();
  });

  it('should call bridge.registerWebView on mount', () => {
    const source = { uri: 'https://example.com' };
    render(<BridgedWebView bridge={mockBridge} source={source} />);
    // This assertion remains the same
    expect(mockBridge.registerWebView).toHaveBeenCalledTimes(1);
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
        testID="test-webview" // Add testID to find the mock
      />
    );

    // Find the mocked WebView component instance via testID
    const mockWebViewInstance = screen.getByTestId('test-webview');
    expect(mockWebViewInstance).toBeTruthy();
    expect(mockWebViewInstance.props.onMessage).toBeInstanceOf(Function);

    // Simulate message event by calling the onMessage prop on the instance
    const nativeEvent = { data: mockTestMessageData };
    act(() => {
      mockWebViewInstance.props.onMessage({ nativeEvent });
    });

    // Check bridge interaction
    expect(mockBridge.handleWebMessage).toHaveBeenCalledTimes(1);
    expect(mockBridge.handleWebMessage).toHaveBeenCalledWith(mockTestMessageData);
    
    // Check prop callback interaction
    expect(mockOnMessageProp).toHaveBeenCalledTimes(1);
    expect(mockOnMessageProp).toHaveBeenCalledWith({ nativeEvent });
  });
}); 