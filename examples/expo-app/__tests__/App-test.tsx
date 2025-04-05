import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

describe('<App />', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<App />);
    // Check for a basic element to confirm render
    expect(getByText('OpenGame App Bridge Example')).toBeTruthy();
  });
}); 