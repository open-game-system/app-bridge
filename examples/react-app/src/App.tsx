import { Counter } from "./Counter";
import { BridgeProvider, webBridge } from "./bridge";

function App() {
  return (
    <BridgeProvider bridge={webBridge}>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          padding: "4px",
          background: webBridge.isSupported() ? "green" : "red",
          color: "white",
          textAlign: "center",
          zIndex: 9999,
        }}
      >
        Bridge Status:{" "}
        {webBridge.isSupported()
          ? "Detected (Running in WebView)"
          : "Not Detected (Running in Browser)"}
      </div>
      <Counter />
    </BridgeProvider>
  );
}

export default App;
