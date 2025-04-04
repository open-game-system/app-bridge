import { CounterContext } from "./bridge";

function App() {
  const Counter = () => {
    const value = CounterContext.useSelector((state) => state.value);
    return (
      <div>
        <h1>Counter</h1>
        <p>{value}</p>
      </div>
    );
  };

  return (
    <div>
      <h1>App Bridge Example</h1>
    </div>
  );
}

export default App;
