import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import App from '../App';

// Mock the app-bridge module
jest.mock('@open-game-system/app-bridge/native', () => {
  return {
    createNativeBridge: jest.fn(() => ({
      getStore: jest.fn(() => ({
        subscribe: jest.fn((callback) => {
          callback({ value: 0 });
          return jest.fn();
        })
      })),
      registerWebView: jest.fn(() => jest.fn()),
      produce: jest.fn(),
      setState: jest.fn()
    }))
  };
});

describe('<App />', () => {
  it('renders counter and buttons', () => {
    const { getByText } = render(<App />);
    expect(getByText('Native Counter: 0')).toBeTruthy();
    expect(getByText('+')).toBeTruthy();
    expect(getByText('-')).toBeTruthy();
    expect(getByText('Reset')).toBeTruthy();
  });

  it('handles button actions without errors', () => {
    const { getByText } = render(<App />);
    fireEvent.press(getByText('+'));
    fireEvent.press(getByText('-'));
    fireEvent.press(getByText('Reset'));
  });
}); 