import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
// Radix portals + React 19 strict double render déclenchaient un removeChild runtime error en dev.
// On désactive StrictMode pour garantir la stabilité pendant l'intervention d'urgence.
root.render(<App />);
