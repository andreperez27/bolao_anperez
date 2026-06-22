import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SuperAdminDashboard from "./SuperAdminDashboard";

function SuperAdminLogin() {
  const { user, signIn, signUp, loading } = useAuth();
  const [nome, setNome] = React.useState("");
  const [senha, setSenha] = React.useState("");
  const [modo, setModo] = React.useState("entrar");
  const [erro, setErro] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#8B9CC8", fontSize: 14 }}>Carregando...</div>
      </div>
    );
  }

  if (user) return <Navigate to="/superadmin" replace />;

  const handleSubmit = async () => {
    if (!nome.trim() || !senha) return;
    setSubmitting(true); setErro("");
    try {
      if (modo === "entrar") {
        await signIn(nome.trim(), senha);
      } else {
        await signUp(nome.trim(), senha);
      }
    } catch (e) { setErro(e.message); }
    setSubmitting(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>{"\uD83C\uDFC6"}</div>
      <h1 style={{ color: "#FFD700", fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: 1, textAlign: "center" }}>
        Bolão Anperez
      </h1>
      <p style={{ color: "#8B9CC8", marginBottom: 32, fontSize: 15, textAlign: "center" }}>
        Plataforma para gest\u00E3o de bol\u00F5es por grupo e campeonato
      </p>
      <div style={{ background: "#111827", border: "1px solid #1E2A45", borderRadius: 16, padding: 24, maxWidth: 380, width: "100%" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => { setModo("entrar"); setErro(""); }}
            style={{ flex: 1, padding: "8px", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer", background: modo === "entrar" ? "#0033A0" : "#1a2234", color: modo === "entrar" ? "#fff" : "#8B9CC8" }}>
            Entrar
          </button>
          <button onClick={() => { setModo("cadastrar"); setErro(""); }}
            style={{ flex: 1, padding: "8px", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer", background: modo === "cadastrar" ? "#10b981" : "#1a2234", color: modo === "cadastrar" ? "#fff" : "#8B9CC8" }}>
            Cadastrar
          </button>
        </div>
        {erro && <div style={{ color: "#C8102E", fontSize: 13, marginBottom: 10, textAlign: "center" }}>{erro}</div>}
        {modo === "cadastrar" && (
          <div style={{ color: "#8B9CC8", fontSize: 12, marginBottom: 12, textAlign: "center" }}>
            Crie sua conta para participar dos bol\u00F5es.
          </div>
        )}
        <input value={nome} onChange={(e) => { setNome(e.target.value); setErro(""); }}
          placeholder="Seu nome" autoFocus
          onKeyDown={(e) => e.key === "Enter" && !submitting && handleSubmit()}
          style={{ width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 14px", fontSize: 16, boxSizing: "border-box", marginBottom: 10 }} />
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          onKeyDown={(e) => e.key === "Enter" && !submitting && handleSubmit()}
          style={{ width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 14px", fontSize: 16, boxSizing: "border-box", marginBottom: 14 }} />
        <button onClick={handleSubmit} disabled={!nome || !senha || submitting}
          style={{ width: "100%", background: modo === "entrar" ? "#0033A0" : "#10b981", border: "none", borderRadius: 8, color: "#fff", padding: "12px", fontWeight: 700, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer", opacity: !nome || !senha || submitting ? 0.6 : 1 }}>
          {submitting ? (modo === "entrar" ? "Entrando..." : "Cadastrando...") : (modo === "entrar" ? "Entrar" : "Cadastrar")}
        </button>
      </div>
    </div>
  );
}

export default function SuperAdminLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#8B9CC8", fontSize: 14 }}>Carregando...</div>
      </div>
    );
  }

  if (!user) return <SuperAdminLogin />;

  return (
    <Routes>
      <Route index element={<SuperAdminDashboard />} />
      <Route path="grupos" element={<SuperAdminDashboard />} />
      <Route path="grupos/novo" element={<SuperAdminDashboard />} />
      <Route path="*" element={<Navigate to="/superadmin" replace />} />
    </Routes>
  );
}
