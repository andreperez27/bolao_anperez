import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usarConvite } from "../services/grupos";

export default function Convite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, jogador, refreshUser } = useAuth();
  const [msg, setMsg] = useState("Validando convite...");
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!token) {
      setMsg("Link inválido");
      setErro(true);
      return;
    }

    const nome = jogador?.nome || user?.nome;
    if (!nome) {
      setMsg("Faça login para aceitar o convite");
      setErro(true);
      return;
    }

    usarConvite(token, nome)
      .then((res) => {
        if (res.mensagem) {
          setMsg(res.mensagem + " (" + res.grupo_nome + ")");
        } else {
          setMsg("Você entrou no grupo " + res.grupo_nome + "!");
        }
        refreshUser();
        setTimeout(() => navigate("/minhas-cartelas"), 2000);
      })
      .catch((e) => {
        setMsg(e.message);
        setErro(true);
      });
  }, [token, user, jogador, navigate, refreshUser]);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#111827", border: "1px solid #1E2A45", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{erro ? "😕" : "🎉"}</div>
        <div style={{ color: erro ? "#C8102E" : "#10b981", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
          {erro ? "Ops!" : "Convite Aceito!"}
        </div>
        <div style={{ color: "#8B9CC8", fontSize: 14, lineHeight: 1.5 }}>{msg}</div>
        {erro ? (
          <button
            onClick={() => navigate("/minhas-cartelas")}
            style={{ marginTop: 16, background: "#0033A0", border: "none", borderRadius: 8, color: "#fff", padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Ir para o Bolão
          </button>
        ) : (
          <div style={{ color: "#4B5563", fontSize: 11, marginTop: 12 }}>Redirecionando...</div>
        )}
      </div>
    </div>
  );
}
