import { useState } from 'react';
import { BridgeContext, CounterContext } from './bridge';

export function Counter() {
  return (
    <div className="card">
      <h2>Counter Example</h2>
      <BridgeContext.Supported>
        <CounterContext.Provider>
          <CounterControls />
          <CounterDisplay />
        </CounterContext.Provider>
        <CounterContext.Loading>
          <div>Waiting for counter data...</div>
        </CounterContext.Loading>
      </BridgeContext.Supported>
      <BridgeContext.Unsupported>
        <div>Bridge not supported in this environment</div>
      </BridgeContext.Unsupported>
    </div>
  );
}

function CounterDisplay() {
  const value = CounterContext.useSelector(state => state.value);
  return <div>Counter: {value}</div>;
}

function CounterControls() {
  const store = CounterContext.useStore();
  const [inputValue, setInputValue] = useState(0);

  return (
    <div>
      <button onClick={() => store.dispatch({ type: 'INCREMENT' })}>+</button>
      <button onClick={() => store.dispatch({ type: 'DECREMENT' })}>-</button>
      <input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(Number(e.target.value))}
      />
      <button onClick={() => store.dispatch({ type: 'SET', value: inputValue })}>Set</button>
    </div>
  );
} 