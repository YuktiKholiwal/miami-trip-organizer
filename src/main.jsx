import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { TripProvider } from "./state/TripContext.jsx";

// When a new service worker takes control (i.e. a new deploy is live),
// reload once so the device stops running stale cached code. This is what
// gets everyone off old buggy versions automatically.
if ("serviceWorker" in navigator) {
  // Whether a SW already controlled this page at load. If not, the upcoming
  // controllerchange is just the first install — don't reload for that.
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading || !hadController) return;
    reloading = true;
    window.location.reload();
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <TripProvider>
        <App />
      </TripProvider>
    </BrowserRouter>
  </StrictMode>
);
