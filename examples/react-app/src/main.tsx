import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BridgeProvider, webBridge } from "./bridge";
import "./index.css";
import { AppStores } from "./types";

// Log whether ReactNativeWebView exists when the app starts
console.log("main.tsx: ReactNativeWebView exists on window?", !!window.ReactNativeWebView);

// Do not create any shim - the bridge should only work in an actual WebView
if (!window.ReactNativeWebView) {
  console.log("Running in standalone browser - bridge should be unsupported");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BridgeProvider bridge={webBridge}>
      <App />
    </BridgeProvider>
  </React.StrictMode>
);
