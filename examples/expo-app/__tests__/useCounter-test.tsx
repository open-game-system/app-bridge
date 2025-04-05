import { renderHook, act } from '@testing-library/react-native';
import { useCounter } from '../hooks/useCounter';

describe('useCounter', () => {
  it('provides correct state and functions', () => {
    const { result } = renderHook(() => useCounter(5));
    
    // Initial state
    expect(result.current.count).toBe(5);
    
    // Increment
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(6);
    
    // Decrement
    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(5);
    
    // Reset
    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });
    expect(result.current.count).toBe(5);
  });
}); 