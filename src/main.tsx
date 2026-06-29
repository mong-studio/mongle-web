import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.js";
import { ErrorBoundary } from "./app/ErrorBoundary.js";
import { MobileGate } from "./app/MobileGate.js";
import { RouteGate } from "./app/RouteGate.js";
import "./app/global.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MobileGate>
        <RouteGate>
          <App />
        </RouteGate>
      </MobileGate>
    </ErrorBoundary>
  </React.StrictMode>,
);
