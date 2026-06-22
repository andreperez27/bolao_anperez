import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usarAdminInvite } from "../services/groups";
import { getSession } from "../services/auth";

export default function ConviteAdmin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [msg, setMsg] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleUsar = async () => {
    if (!codigo.trim()) return;
    setCarregando(true); setMsg("");
    try {
      const session = getSession();
      if (!session?.sessao_token) { setMsg("Você precisa estar logado primeiro. Faça login no grupo e volte aqui."); setCarregando(false); return; }
      const grupoId = sessionStorage.getItem("grupo_id_" + slug);
      if (!grupoId) { setMsg("Grupo não encontrado. Acesse o grupo primeiro."); setCarregando(false); return; }
      await usarAdminInvite(grupoId, codigo.trim(), session.sessao_token);
      setMsg("Convite válido! Você agora é admin do grupo.");
      setTimeout(() => navigate(`/g/${slug}/admin`), 1500);
    } catch (e) { setMsg("Erro: " + e.message); }
    setCarregando(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#111827", border: "1px solid #1E2A45", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%" }}>
        <div style={{ fontSize: 48, marginBottom: 12, textAlign: "center" }}>🔑</div>
        <div style={{ color: "#F0F4FF", fontWeight: 800, fontSize: 18, marginBottom: 4, textAlign: "center" }}>Usar Convite de Admin</div>
        <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 20, textAlign: "center" }}>Digite o código de convite recebido para se tornar admin do grupo.</div>
        {msg && (
          <div style={{ color: msg.startsWith("Erro") ? "#C8102E" : "#10b981", fontSize: 13, marginBottom: 12, textAlign: "center", whiteSpace: "pre-line" }}>{msg}</div>
        )}
        <input value={codigo} onChange={(e) => setCodigo(e.target.value)}
          placeholder="Código do convite"
          onKeyDown={(e) => e.key === "Enter" && handleUsar()}
          style={{ width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 14px", fontSize: 16, boxSizing: "border-box", marginBottom: 14, textAlign: "center", letterSpacing: 3 }} />
        <button onClick={handleUsar} disabled={!codigo.trim() || carregando}
          style={{ width: "100%", background: "#10b981", border: "none", borderRadius: 8, color: "#fff", padding: "12px", fontWeight: 700, fontSize: 15, cursor: carregando ? "not-allowed" : "pointer", opacity: !codigo.trim() || carregando ? 0.6 : 1 }}>
          {carregando ? "Validando..." : "Usar Convite"}
        </button>
      </div>
    </div>
  );
}
