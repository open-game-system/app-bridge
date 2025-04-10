/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';
import type { StoreConfig, State, Event } from '@open-game-system/app-bridge-types';

// Mock the dependencies
jest.mock('@open-game-system/app-bridge-react-native', () => ({
  createNativeBridge: () => ({
    sendMessage: () => {},
    onMessage: () => {},
    onError: () => {},
    destroy: () => {},
    setStore: () => {},
    getStore: () => undefined,
    subscribe: () => () => {},
    handleWebMessage: () => {},
    registerWebView: () => () => {},
    unregisterWebView: () => {},
    subscribeToReadyState: () => () => {},
    getReadyState: () => true,
    isSupported: () => true
  }),
  createStore: <S extends State, E extends Event>(config: StoreConfig<S, E>) => ({
    getState: () => config.initialState,
    setState: () => {},
    subscribe: () => () => {},
    dispatch: () => {},
    reset: () => {}
  }),
  createNativeBridgeContext: () => ({
    BridgeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    createNativeStoreContext: () => {
      // Simulate the initial state for the counter store
      const initialState = { value: 0 }; 
      return {
        StoreProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        useSelector: (selectorFn: (state: typeof initialState) => any) => {
          // Apply the selector to the simulated initial state
          return selectorFn(initialState);
        },
        useStore: () => ({
          dispatch: () => {},
          reset: () => {}
        })
      };
    }
  }),
  BridgedWebView: () => null
}));

describe('App', () => {
  it('renders correctly', () => {
    const { getByText } = render(<App />);
    expect(getByText('OpenGame App Bridge Example')).toBeTruthy();
  });
}); 