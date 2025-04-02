import { render, screen } from '@testing-library/react';
import { Provider, bridge } from './bridge';
import App from './App';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach } from 'vitest';

describe('App', () => {
  beforeEach(() => {
    bridge.reset('counter');
  });

  it('renders app title', () => {
    render(
      <Provider bridge={bridge}>
        <App />
      </Provider>
    );
    expect(screen.getByText(/App Bridge Example/i)).toBeInTheDocument();
  });

  it('shows loading state when counter is not initialized', () => {
    render(
      <Provider bridge={bridge}>
        <App />
      </Provider>
    );
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('shows counter value when initialized', () => {
    bridge.setState('counter', { value: 42 });
    render(
      <Provider bridge={bridge}>
        <App />
      </Provider>
    );
    expect(screen.getByText(/Counter: 42/i)).toBeInTheDocument();
  });

  it('increments counter when increment button is clicked', () => {
    bridge.setState('counter', { value: 42 });
    render(
      <Provider bridge={bridge}>
        <App />
      </Provider>
    );
    screen.getByText(/Increment/i).click();
    expect(screen.getByText(/Counter: 43/i)).toBeInTheDocument();
  });

  it('decrements counter when decrement button is clicked', () => {
    bridge.setState('counter', { value: 42 });
    render(
      <Provider bridge={bridge}>
        <App />
      </Provider>
    );
    screen.getByText(/Decrement/i).click();
    expect(screen.getByText(/Counter: 41/i)).toBeInTheDocument();
  });

  it('sets counter to specific value when set button is clicked', () => {
    bridge.setState('counter', { value: 42 });
    render(
      <Provider bridge={bridge}>
        <App />
      </Provider>
    );
    screen.getByText(/Set to 100/i).click();
    expect(screen.getByText(/Counter: 100/i)).toBeInTheDocument();
  });
});
