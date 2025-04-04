import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { bridge, BridgeProvider } from "./bridge";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BridgeProvider bridge={bridge}>
      <App />
    </BridgeProvider>
  </React.StrictMode>
);
