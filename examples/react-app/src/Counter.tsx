import { useState, useEffect } from 'react';
import { BridgeContext as DefaultBridgeContext, CounterContext as DefaultCounterContext } from './bridge';
import type { CounterState } from '../../shared/types';
import { createBridgeContext } from '@open-game-system/app-bridge-react';
import type { AppStores } from './types';

type BridgeContextType = ReturnType<typeof createBridgeContext<AppStores>>;
type StoreContextType = ReturnType<typeof DefaultBridgeContext.createStoreContext<'counter'>>;

type CounterProps = {
  BridgeContext?: BridgeContextType;
  CounterContext?: StoreContextType;
};

function CounterDisplay({ CounterContext }: { CounterContext: StoreContextType }) {
  const value = CounterContext.useSelector((state: CounterState) => state.value);
  
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

function CounterControls({ CounterContext }: { CounterContext: StoreContextType }) {
  const store = CounterContext.useStore();
  const [inputValue, setInputValue] = useState('0');

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
      }}>
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            width: '100px',
            fontSize: '16px'
          }}
        />
        <button
          onClick={() => {
            console.log('Dispatching SET event with value:', inputValue);
            store.dispatch({ type: 'SET', value: parseInt(inputValue, 10) || 0 });
          }}
          style={{
            padding: '4px 12px',
            borderRadius: '4px',
            backgroundColor: '#eee',
            border: '1px solid #ddd',
            cursor: 'pointer'
          }}
        >
          Set Value
        </button>
      </div>
    </div>
  );
}

export function Counter({ 
  BridgeContext = DefaultBridgeContext,
  CounterContext = DefaultCounterContext 
}: CounterProps = {}) {
  return (
    <div className="card">
      <h2>Counter Example</h2>
      <BridgeContext.Supported>
        <CounterContext.Provider>
          <CounterControls CounterContext={CounterContext} />
          <CounterDisplay CounterContext={CounterContext} />
        </CounterContext.Provider>
        <CounterContext.Loading>
          <div>Waiting for counter data from native app...</div>
        </CounterContext.Loading>
      </BridgeContext.Supported>
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