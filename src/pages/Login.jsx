import React, { useState } from "react";
import { Card } from "../components/Card";
import { Btn } from "../components/Btn";
import { useAuth } from "../contexts/AuthContext";
import { useGrupo } from "../contexts/GrupoContext";

export default function Login({ onLogin }) {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { grupo, edition, grupoSlug } = useGrupo();
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [erro, setErro] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modo, setModo] = useState(null);

  const handleEntrar = async () => {
    if (!nome.trim() || !senha) return;
    setSubmitting(true); setErro("");
    try {
      const s = await signIn(nome.trim(), senha);
      onLogin({ senhaPadrao: false });
    } catch (e) { setErro(e.message); }
    setSubmitting(false);
  };

  const handleCadastrar = async () => {
    if (!nome.trim() || !senha) return;
    setSubmitting(true); setErro("");
    try {
      const s = await signUp(nome.trim(), senha);
      onLogin({ senhaPadrao: false });
    } catch (e) { setErro(e.message); }
    setSubmitting(false);
  };

  if (authLoading) {
    return <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#FFD700", fontSize: 18, fontWeight: 700 }}>Carregando...</div>
    </div>;
  }

  const titulo = edition?.edition_nome || "Bolão Anperez";
  const subtitulo = edition?.edition_nome ? grupo?.nome || "" : "Plataforma de gestão de Bolões";

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>{edition ? "\u26BD" : "\uD83C\uDFC6"}</div>
      <h1 style={{ color: "#FFD700", fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: 1, textAlign: "center" }}>
        {titulo}
      </h1>
      <div style={{ color: edition ? "#10b981" : "#8B9CC8", fontSize: edition ? 15 : 13, fontWeight: edition ? 700 : 400, marginBottom: 4 }}>{subtitulo}</div>
      {edition && <p style={{ color: "#8B9CC8", marginBottom: 32, fontSize: 15 }}>{"Faça seus palpites!"}</p>}
      <Card style={{ width: "100%", maxWidth: 380 }}>
        {!user ? (
          <>
            <div style={{ color: "#F0F4FF", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
              {modo === "cadastro" ? "Novo Cadastro" : "Entrar"}
            </div>
            <input value={nome} onChange={(e) => { setNome(e.target.value); setErro(""); }}
              placeholder="Seu nome"
              onKeyDown={(e) => e.key === "Enter" && !modo && senha && handleEntrar()}
              style={{ width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 14px", fontSize: 16, boxSizing: "border-box", marginBottom: 10 }} />
            <input type="password" value={senha} onChange={(e) => { setSenha(e.target.value); setErro(""); }}
              placeholder="Senha"
              onKeyDown={(e) => e.key === "Enter" && modo === "cadastro" ? confirmSenha && handleCadastrar() : handleEntrar()}
              style={{ width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 14px", fontSize: 16, boxSizing: "border-box", marginBottom: 14 }} />
            {modo === "cadastro" && (
              <input type="password" value={confirmSenha} onChange={(e) => { setConfirmSenha(e.target.value); setErro(""); }}
                placeholder="Confirmar senha"
                onKeyDown={(e) => e.key === "Enter" && handleCadastrar()}
                style={{ width: "100%", background: confirmSenha && confirmSenha !== senha ? "#2a1a1a" : "#1a2234", border: `2px solid ${confirmSenha && confirmSenha !== senha ? "#C8102E" : "#1E2A45"}`, borderRadius: 8, color: "#F0F4FF", padding: "10px 14px", fontSize: 16, boxSizing: "border-box", marginBottom: 14 }} />
            )}
            {erro && <div style={{ color: "#C8102E", fontSize: 13, marginBottom: 10, textAlign: "center" }}>{erro}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={handleEntrar} style={{ flex: 1 }} disabled={!nome || !senha || submitting}>
                {submitting ? "Entrando..." : "Entrar"}
              </Btn>
              <Btn onClick={() => { if (modo !== "cadastro") { setModo("cadastro"); setErro(""); } else { handleCadastrar(); } }}
                cor="#16a34a" style={{ flex: 1 }}
                disabled={!nome || !senha || (modo === "cadastro" && (!confirmSenha || confirmSenha !== senha)) || submitting}>
                {submitting ? "Aguarde..." : modo === "cadastro" ? "Confirmar Cadastro" : "Cadastrar"}
              </Btn>
            </div>
          </>
        ) : (
          <>
            <div style={{ color: "#F0F4FF", textAlign: "center", marginBottom: 12 }}>
              Você já está logado como <strong>{user?.nome}</strong>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => onLogin({})} cor="#16a34a" style={{ flex: 1 }}>Continuar</Btn>
              <Btn onClick={signOut} cor="#C8102E" style={{ flex: 1 }}>Sair</Btn>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
