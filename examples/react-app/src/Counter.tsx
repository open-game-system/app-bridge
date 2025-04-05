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
          padding: '15px', 
          background: '#ffeeee', 
          border: '2px solid #ffaaaa',
          borderRadius: '8px', 
          marginTop: '20px',
          color: '#cc0000',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: '0' }}>Browser Mode</h3>
          <p>This app is designed to run inside the OpenGame App WebView.</p>
          <p>When viewed directly in a browser, the bridge is not available and features are limited.</p>
        </div>
      )}
      <BridgeContext.Unsupported>
        <div style={{
          background: '#ffdddd',
          border: '2px solid #ff6666',
          borderRadius: '8px',
          padding: '12px',
          margin: '15px 0',
          color: '#cc0000',
          fontWeight: 'bold',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
  
  return (
    <div style={{
      textAlign: 'center',
      padding: '20px',
      margin: '20px 0',
      backgroundColor: '#f0f8ff',
      borderRadius: '8px',
      border: '1px solid #ccc',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ fontSize: '18px', color: '#555', marginBottom: '8px', fontWeight: 'bold' }}>
        Web Bridge Counter:
      </div>
      <div style={{ 
        fontSize: '60px', 
        fontWeight: 'bold',
        color: '#1a73e8',
        padding: '10px 0'
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: '14px', 
        fontStyle: 'italic',
        color: '#666'
      }}>
        This value is synchronized with the native counter above
      </div>
    </div>
  );
}

function CounterControls() {
  const store = CounterContext.useStore();
  const [inputValue, setInputValue] = useState(0);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px',
      alignItems: 'center',
      margin: '20px 0'
    }}>
      <div style={{ 
        display: 'flex', 
        gap: '10px',
        justifyContent: 'center' 
      }}>
        <button 
          style={{ 
            fontSize: '24px', 
            padding: '10px 20px', 
            borderRadius: '4px',
            backgroundColor: '#eee',
            cursor: 'pointer',
            height: '50px',
            width: '50px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }} 
          onClick={() => {
            console.log('Dispatching DECREMENT event');
            store.dispatch({ type: 'DECREMENT' });
          }}
        >
          -
        </button>
        <button 
          style={{ 
            fontSize: '24px', 
            padding: '10px 20px', 
            borderRadius: '4px',
            backgroundColor: '#eee',
            cursor: 'pointer',
            height: '50px',
            width: '50px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }} 
          onClick={() => {
            console.log('Dispatching INCREMENT event');
            store.dispatch({ type: 'INCREMENT' });
          }}
        >
          +
        </button>
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '8px',
        border: '1px solid #ddd',
        padding: '8px',
        borderRadius: '4px',
        backgroundColor: '#f5f5f5',
        width: '100%',
        maxWidth: '400px',
        justifyContent: 'center'
      }}>
        <label htmlFor="counter-value">Set value:</label>
        <input
          id="counter-value"
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(Number(e.target.value))}
          style={{ 
            padding: '8px', 
            borderRadius: '4px',
            border: '1px solid #ccc',
            width: '120px',
            fontSize: '16px',
            height: '40px'
          }}
        />
        <button 
          style={{ 
            padding: '8px 16px', 
            borderRadius: '4px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            height: '40px',
            minWidth: '80px'
          }}
          onClick={() => {
            console.log('Dispatching SET event with value:', inputValue);
            store.dispatch({ type: 'SET', value: inputValue });
          }}
        >
          Set
        </button>
      </div>
    </div>
  );
} 