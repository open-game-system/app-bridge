import { useStore } from './store';

function App() {
  const { state, dispatch } = useStore('counter');

  return (
    <div>
      <h1>App Bridge Example</h1>
      {state === null ? (
        <div>Loading...</div>
      ) : (
        <div>
          <div>Counter: {state.value}</div>
          <button onClick={() => dispatch({ type: 'INCREMENT' })}>Increment</button>
          <button onClick={() => dispatch({ type: 'DECREMENT' })}>Decrement</button>
          <button onClick={() => dispatch({ type: 'SET', value: 100 })}>Set to 100</button>
        </div>
      )}
    </div>
  );
}

export default App;
