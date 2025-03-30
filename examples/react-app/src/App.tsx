import {
  BridgeContext,
  useAppState,
  useSetValue,
  useValue,
} from '@open-game-system/app-bridge-react';
import { ClientBridge } from '@open-game-system/app-bridge-web';
import { useState } from 'react';

// Create a bridge instance
const bridge = new ClientBridge({
  debug: true,
  initialState: {
    count: 0,
    items: [],
    message: 'Welcome to OpenGame App Bridge!',
  },
});

// Counter component that uses the bridge
function Counter() {
  const count = useValue<number>('count') || 0;
  const setValue = useSetValue<number>();

  const increment = () => setValue('count', count + 1);
  const decrement = () => setValue('count', count - 1);

  return (
    <div className="card">
      <h2>Counter: {count}</h2>
      <div>
        <button type="button" onClick={decrement}>
          -
        </button>
        <button type="button" onClick={increment}>
          +
        </button>
      </div>
    </div>
  );
}

// Message component that updates a message
function MessageEditor() {
  const [input, setInput] = useState('');
  const message = useValue<string>('message') || '';
  const setValue = useSetValue<string>();

  const updateMessage = () => {
    setValue('message', input);
    setInput('');
  };

  return (
    <div className="card">
      <h2>Message: {message}</h2>
      <div>
        <input
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder="Enter a new message"
        />
        <button type="button" onClick={updateMessage}>
          Update
        </button>
      </div>
    </div>
  );
}

// Display the current state
function StateDisplay() {
  const state = useAppState();

  return (
    <div className="card">
      <h2>Current State</h2>
      <pre className="state-display">{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}

// Main App component
function App() {
  return (
    <BridgeContext.Provider value={{ bridge, state: bridge.getState() }}>
      <div>
        <h1>OpenGame App Bridge Demo</h1>
        <Counter />
        <MessageEditor />
        <StateDisplay />
      </div>
    </BridgeContext.Provider>
  );
}

export default App;
