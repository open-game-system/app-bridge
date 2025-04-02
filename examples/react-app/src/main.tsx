import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { bridge, BridgeContext } from "./bridge";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BridgeContext.Provider bridge={bridge}>
      <App />
    </BridgeContext.Provider>
  </React.StrictMode>
);
