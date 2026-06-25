import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import SuperAdminLayout from "./pages/SuperAdminLayout";
import Convite from "./pages/Convite";
import EntrarGrupo from "./pages/EntrarGrupo";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { GrupoProvider } from "./contexts/GrupoContext";
import "./styles/global.css";



ReactDOM.createRoot(document.getElementById("root")).render(
    <HashRouter>
      <Routes>
        <Route path="/g/:slug/entrar" element={<EntrarGrupo />} />
        <Route path="/g/:slug/*" element={<AuthProvider><GrupoProvider><ErrorBoundary><App /></ErrorBoundary></GrupoProvider></AuthProvider>} />
        <Route path="/convite/:token" element={<Convite />} />
        <Route path="/superadmin/*" element={<AuthProvider><ErrorBoundary><SuperAdminLayout /></ErrorBoundary></AuthProvider>} />
        <Route path="*" element={<Navigate to="/superadmin" replace />} />
      </Routes>
    </HashRouter>
  );
