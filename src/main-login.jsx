import React from "react";
import ReactDOM from "react-dom/client";
import LoginApp from "./LoginApp.jsx";
import "./styles/login.css";

// Mounts the Login page into the <div id="root"> defined in login.html.
// Per the assignment, login.html contains only the minimal markup needed
// to mount React — every visible element comes from LoginApp.jsx down.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LoginApp />
  </React.StrictMode>
);
