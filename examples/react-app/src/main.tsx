import { createWebBridge } from "@open-game-system/app-bridge";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BridgeProvider } from "./bridge";
import "./index.css";
import { AppStores } from "./types";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BridgeProvider bridge={createWebBridge<AppStores>()}>
      <App />
    </BridgeProvider>
  </React.StrictMode>
);
