import { useState } from 'react';
import { BridgeContext } from './bridge';

const CounterContext = BridgeContext.createStoreContext('counter');

export function Counter() {
  return (
    <div className="card">
      <h2>Counter Example</h2>
      <BridgeContext.Supported>
        <CounterContext.Initialized>
          <CounterControls />
          <CounterDisplay />
        </CounterContext.Initialized>
      </BridgeContext.Supported>
    </div>
  );
}

function CounterDisplay() {
  const value = CounterContext.useSelector(state => state.value);
  return <div>Counter: {value}</div>;
}

function CounterControls() {
  const dispatch = CounterContext.useDispatch();
  const [value, setValue] = useState(0);

  return (
    <div>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <button onClick={() => dispatch({ type: 'SET', value })}>Set</button>
    </div>
  );
} 