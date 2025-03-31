import { BridgeProvider } from "@open-game-system/app-bridge/react";
import { createWebBridge } from "@open-game-system/app-bridge/web";
import { useState } from "react";

const bridge = createWebBridge();

function AppContent() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <h1>React App</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BridgeProvider bridge={bridge}>
      <AppContent />
    </BridgeProvider>
  );
}

export default App;
