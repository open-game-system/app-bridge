import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Counter } from '../components/Counter';

describe('<Counter />', () => {
  it('renders the correct value', () => {
    const { getByText } = render(
      <Counter 
        value={5} 
        onIncrement={jest.fn()} 
        onDecrement={jest.fn()} 
        onReset={jest.fn()} 
      />
    );
    
    expect(getByText('Counter: 5')).toBeTruthy();
  });

  it('calls the correct handlers when buttons are pressed', () => {
    const incrementMock = jest.fn();
    const decrementMock = jest.fn();
    const resetMock = jest.fn();
    
    const { getByText } = render(
      <Counter 
        value={0} 
        onIncrement={incrementMock} 
        onDecrement={decrementMock} 
        onReset={resetMock} 
      />
    );
    
    fireEvent.press(getByText('+'));
    expect(incrementMock).toHaveBeenCalledTimes(1);
    
    fireEvent.press(getByText('-'));
    expect(decrementMock).toHaveBeenCalledTimes(1);
    
    fireEvent.press(getByText('Reset'));
    expect(resetMock).toHaveBeenCalledTimes(1);
  });
}); 