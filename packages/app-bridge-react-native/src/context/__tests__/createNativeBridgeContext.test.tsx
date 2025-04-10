/// <reference types="jest" />

import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { createMockBridge } from '@open-game-system/app-bridge-testing';
import type { BridgeStores } from '@open-game-system/app-bridge-types';
import { createNativeBridgeContext } from '../createNativeBridgeContext';

// Define test-specific store types
interface TestStores extends BridgeStores {
  counter: {
    state: { value: number };
    events: { type: 'INCREMENT' } | { type: 'DECREMENT' };
  };
}

describe('createNativeBridgeContext', () => {
  it('should create a bridge context with hooks', () => {
    const { BridgeProvider, useBridge, createNativeStoreContext } = createNativeBridgeContext<TestStores>();
    expect(BridgeProvider).toBeDefined();
    expect(useBridge).toBeDefined();
    expect(createNativeStoreContext).toBeDefined();
  });

  it('should access the bridge through context', () => {
    const mockBridge = createMockBridge<TestStores>();
    const { BridgeProvider, useBridge } = createNativeBridgeContext<TestStores>();

    const { result } = renderHook(() => useBridge(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <BridgeProvider bridge={mockBridge}>{children}</BridgeProvider>
      ),
    });

    expect(result.current).toBe(mockBridge);
  });

  it('should access store state through context', () => {
    const mockBridge = createMockBridge<TestStores>();
    const initialState = { value: 0 };
    mockBridge.getStore = jest.fn().mockReturnValue({
      getSnapshot: () => initialState,
      subscribe: jest.fn(),
    });

    const { BridgeProvider, createNativeStoreContext } = createNativeBridgeContext<TestStores>();
    const { useSelector } = createNativeStoreContext('counter');

    const { result } = renderHook(
      () => useSelector((state) => state.value),
      {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <BridgeProvider bridge={mockBridge}>{children}</BridgeProvider>
        ),
      }
    );

    expect(result.current).toBe(initialState.value);
  });

  it('should throw error when hooks are used outside Provider', () => {
    const { useBridge } = createNativeBridgeContext<TestStores>();

    const { result } = renderHook(() => {
      try {
        return useBridge();
      } catch (error) {
        if (error instanceof Error) {
          return error;
        }
        throw error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toBe('useBridge must be used within a BridgeProvider');
  });
}); 