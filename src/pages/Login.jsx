import React, { useState } from "react";
import { Card } from "../components/Card";
import { Btn } from "../components/Btn";
import { useAuth } from "../contexts/AuthContext";
import { useGrupo } from "../contexts/GrupoContext";

export default function Login({ onLogin }) {
  const { user, loading: authLoading, senhaPadrao, signIn, signUp, signInAdmin } = useAuth();
  const { grupo } = useGrupo();
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [erro, setErro] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modo, setModo] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminSenha, setAdminSenha] = useState("");

  const handleEntrar = async () => {
    if (!nome.trim() || !senha) return;
    setSubmitting(true);
    setErro("");
    try {
      await signIn(nome.trim(), senha);
      onLogin({ isAdmin: false, senhaPadrao: senha === '123456' });
    } catch (e) {
      setErro(e.message);
    }
    setSubmitting(false);
  };

  const handleCadastrar = async () => {
    if (!nome.trim() || !senha) return;
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (senha !== confirmSenha) {
      setErro("Senhas não conferem!");
      return;
    }
    setSubmitting(true);
    setErro("");
    try {
      await signUp(nome.trim(), senha);
      onLogin({ isAdmin: false, senhaPadrao: senha === '123456' });
    } catch (e) {
      setErro(e.message);
    }
    setSubmitting(false);
  };

  const handleAdminLogin = async () => {
    if (!adminSenha) return;
    setSubmitting(true);
    setErro("");
    try {
      await signInAdmin(adminSenha);
      onLogin({ isAdmin: true });
    } catch (e) {
      setErro(e.message);
    }
    setSubmitting(false);
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0A0E1A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#FFD700", fontSize: 18, fontWeight: 700 }}>
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0E1A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 8 }}>{"\uD83C\uDFC6"}</div>
      <h1
        style={{
          color: "#FFD700",
          fontSize: 28,
          fontWeight: 900,
          margin: 0,
          letterSpacing: 1,
          textAlign: "center",
        }}
      >
        BOLÃO DA COPA 2026
      </h1>
      <div style={{ color: "#10b981", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
        {grupo?.nome || "Bolão Geral"}
      </div>
      <p style={{ color: "#8B9CC8", marginBottom: 32, fontSize: 15 }}>
        Bolão 2026 {"—"} Faça seus palpites!
      </p>

      <Card style={{ width: "100%", maxWidth: 380 }}>
        {!user ? (
          <>
            <div style={{ color: "#F0F4FF", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
              {modo === "cadastro" ? "Novo Cadastro" : "Entrar"}
            </div>

            <input
              value={nome}
              onChange={(e) => { setNome(e.target.value); setErro(""); }}
              placeholder="Seu nome"
              onKeyDown={(e) => e.key === "Enter" && !modo && senha && handleEntrar()}
              style={{
                width: "100%",
                background: "#1a2234",
                border: "2px solid #1E2A45",
                borderRadius: 8,
                color: "#F0F4FF",
                padding: "10px 14px",
                fontSize: 16,
                boxSizing: "border-box",
                marginBottom: 10,
              }}
            />

            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha (6 dígitos)"
              onKeyDown={(e) => e.key === "Enter" && modo === "cadastro"
                ? confirmSenha && handleCadastrar()
                : handleEntrar()}
              style={{
                width: "100%",
                background: "#1a2234",
                border: "2px solid #1E2A45",
                borderRadius: 8,
                color: "#F0F4FF",
                padding: "10px 14px",
                fontSize: 16,
                boxSizing: "border-box",
                marginBottom: 14,
              }}
            />

            {modo === "cadastro" && (
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
                placeholder="Confirmar senha"
                onKeyDown={(e) => e.key === "Enter" && handleCadastrar()}
                style={{
                  width: "100%",
                  background:
                    confirmSenha && confirmSenha !== senha ? "#2a1a1a" : "#1a2234",
                  border: `2px solid ${
                    confirmSenha && confirmSenha !== senha ? "#C8102E" : "#1E2A45"
                  }`,
                  borderRadius: 8,
                  color: "#F0F4FF",
                  padding: "10px 14px",
                  fontSize: 16,
                  boxSizing: "border-box",
                  marginBottom: 14,
                }}
              />
            )}

            {erro && (
              <div
                style={{
                  color: erro.includes("Bem-vindo") ? "#22c55e" : "#C8102E",
                  fontSize: 13,
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                {erro}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <Btn
                onClick={handleEntrar}
                style={{ flex: 1 }}
                disabled={!nome || !senha || submitting}
              >
                {submitting ? "Entrando..." : "Entrar"}
              </Btn>
              <Btn
                onClick={() => {
                  if (modo !== "cadastro") {
                    setModo("cadastro");
                    setErro("");
                  } else {
                    handleCadastrar();
                  }
                }}
                cor="#16a34a"
                style={{ flex: 1 }}
                disabled={
                  !nome || !senha || (modo === "cadastro" && (!confirmSenha || confirmSenha !== senha)) || submitting
                }
              >
                {submitting ? "Aguarde..." : modo === "cadastro" ? "Confirmar Cadastro" : "Cadastrar"}
              </Btn>
            </div>
          </>
        ) : (
          <>
            <div style={{ color: "#F0F4FF", textAlign: "center", marginBottom: 12 }}>
              Você já está logado como <strong>{user?.nome}</strong>
            </div>
            <Btn onClick={() => onLogin({ isAdmin: false, senhaPadrao })} cor="#16a34a" style={{ width: "100%" }}>
              Continuar
            </Btn>
          </>
        )}
      </Card>

      {!user && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          {!showAdminLogin ? (
            <button
              onClick={() => { setShowAdminLogin(true); setErro(""); }}
              style={{
                background: "transparent",
                border: "none",
                color: "#8B9CC8",
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "underline",
                padding: 4,
              }}
            >
              {"\uD83D\uDD10"} Entrar como Administrador
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8, maxWidth: 380, margin: "0 auto", flexDirection: "column" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="password"
                  value={adminSenha}
                  onChange={(e) => setAdminSenha(e.target.value)}
                  placeholder="Senha do admin"
                  onKeyDown={(e) => e.key === "Enter" && adminSenha && handleAdminLogin()}
                  style={{
                    flex: 1,
                    background: "#1a2234",
                    border: "1px solid #1E2A45",
                    borderRadius: 8,
                    color: "#F0F4FF",
                    padding: "8px 12px",
                    fontSize: 14,
                  }}
                />
                <Btn onClick={handleAdminLogin} cor="#C8102E" disabled={!adminSenha || submitting}>
                  Entrar
                </Btn>
                <button
                  onClick={() => { setShowAdminLogin(false); setAdminSenha(""); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#8B9CC8",
                    fontSize: 16,
                    cursor: "pointer",
                    padding: "0 4px",
                  }}
                >
                  {"\u2715"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
