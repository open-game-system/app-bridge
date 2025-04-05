import { useState, useEffect } from 'react';
import { BridgeContext, CounterContext } from './bridge';

export function Counter() {
  const [bridgeSupported, setBridgeSupported] = useState<boolean | null>(null);

  // Check if bridge is supported and log it
  useEffect(() => {
    const checkBridgeSupport = () => {
      const isSupported = typeof window !== 'undefined' && !!window.ReactNativeWebView;
      console.log('Bridge support check in Counter:', isSupported);
      setBridgeSupported(isSupported);
    };

    // Check initially
    checkBridgeSupport();
    
    // Set up message listener to detect if we receive messages from native side
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        console.log('Message received in Counter:', data);
        
        // If we got a STATE_INIT or STATE_UPDATE message, we're definitely in a WebView
        if (data && (data.type === 'STATE_INIT' || data.type === 'STATE_UPDATE')) {
          setBridgeSupported(true);
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  if (bridgeSupported === null) {
    return <div className="card">Checking bridge support...</div>;
  }

  return (
    <div className="card">
      <h2>Counter Example</h2>
      {bridgeSupported ? (
        <>
          <BridgeContext.Supported>
            <CounterContext.Provider>
              <CounterControls />
              <CounterDisplay />
            </CounterContext.Provider>
            <CounterContext.Loading>
              <div>Waiting for counter data from native app...</div>
            </CounterContext.Loading>
          </BridgeContext.Supported>
        </>
      ) : (
        <div style={{ 
          padding: '10px', 
          background: '#ffeeee', 
          border: '1px solid #ffaaaa',
          borderRadius: '4px', 
          marginTop: '20px',
          color: '#cc0000' 
        }}>
          <h3>Browser Mode</h3>
          <p>This app is designed to run inside the OpenGame App WebView.</p>
          <p>When viewed directly in a browser, the bridge is not available and features are limited.</p>
        </div>
      )}
      <BridgeContext.Unsupported>
        <div style={{
          background: '#ffdddd',
          border: '1px solid #ff6666',
          borderRadius: '4px',
          padding: '8px',
          margin: '10px 0',
          color: '#cc0000',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Bridge reports as unsupported
        </div>
      </BridgeContext.Unsupported>
    </div>
  );
}

function CounterDisplay() {
  const value = CounterContext.useSelector(state => state.value);
  
  useEffect(() => {
    console.log('Counter value in web app:', value);
  }, [value]);
  
  return <div>Counter: {value}</div>;
}

function CounterControls() {
  const store = CounterContext.useStore();
  const [inputValue, setInputValue] = useState(0);

  return (
    <div>
      <button onClick={() => {
        console.log('Dispatching INCREMENT event');
        store.dispatch({ type: 'INCREMENT' });
      }}>+</button>
      <button onClick={() => {
        console.log('Dispatching DECREMENT event');
        store.dispatch({ type: 'DECREMENT' });
      }}>-</button>
      <input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(Number(e.target.value))}
      />
      <button onClick={() => {
        console.log('Dispatching SET event with value:', inputValue);
        store.dispatch({ type: 'SET', value: inputValue });
      }}>Set</button>
    </div>
  );
} 