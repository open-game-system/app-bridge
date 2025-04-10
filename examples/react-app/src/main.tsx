import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Do not create any shim - the bridge should only work in an actual WebView
if (!window.ReactNativeWebView) {
  console.log("Running in standalone browser - bridge should be unsupported");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
