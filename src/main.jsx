import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Convite from "./pages/Convite";
import { AuthProvider } from "./contexts/AuthContext";
import { GrupoProvider } from "./contexts/GrupoContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/:slug/*" element={<GrupoProvider><AuthProvider><App /></AuthProvider></GrupoProvider>} />
        <Route path="/convite/:token" element={<Convite />} />
        <Route path="*" element={<GrupoProvider><AuthProvider><App /></AuthProvider></GrupoProvider>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
