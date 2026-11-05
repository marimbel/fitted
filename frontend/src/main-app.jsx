import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/app.css";
import { initAnalytics } from "./services/analytics.js";

// GA4 client-side tracking starts here, before anything renders, so the
// very first pageview (and every event after it) is captured.
initAnalytics();

// Mounts the Virtual Fitting Room SPA into the <div id="root"> element
// defined in app.html. This is the only JavaScript entry point for that
// page — everything visible on it is rendered by React from here down.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
