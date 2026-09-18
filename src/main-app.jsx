import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/app.css";

// Mounts the Virtual Fitting Room SPA into the <div id="root"> element
// defined in app.html. This is the only JavaScript entry point for that
// page — everything visible on it is rendered by React from here down.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
