import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByText('React App')).toBeInTheDocument();
  });

  it('renders the counter button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /count is/i })).toBeInTheDocument();
  });

  it('increments counter when clicked', async () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /count is 0/i });
    button.click();
    expect(await screen.findByText(/count is 1/i)).toBeInTheDocument();
  });
}); 