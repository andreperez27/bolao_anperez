import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { GrupoProvider } from "./contexts/GrupoContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename="/bolao_anperez">
      <AuthProvider>
        <GrupoProvider>
          <App />
        </GrupoProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
