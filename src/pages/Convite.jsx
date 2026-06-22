import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSession } from "../services/auth";
import { usarConviteParticipante } from "../services/groups";

export default function Convite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const session = getSession();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setMsg("Link inv\u00E1lido"); setLoading(false); return; }
    if (!session?.sessao_token) {
      navigate("/superadmin?convite=" + token);
      return;
    }
    usarConviteParticipante(token, session.sessao_token)
      .then((data) => {
        const slug = data?.grupo_slug;
        if (slug) navigate(`/g/${slug}/minhas-cartelas`);
        else navigate("/superadmin");
      })
      .catch((e) => { setMsg(e.message || "Erro ao usar convite"); })
      .finally(() => setLoading(false));
  }, [token, session]);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#111827", border: "1px solid #1E2A45", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%", textAlign: "center" }}>
        {loading ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u23F3"}</div>
            <div style={{ color: "#8B9CC8", fontSize: 14 }}>Usando convite...</div>
          </>
        ) : msg ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{msg.startsWith("Voc\u00EA precisa") ? "\uD83D\uDD11" : "\uD83D\uDE15"}</div>
            <div style={{ color: msg.startsWith("Voc\u00EA precisa") ? "#FFD700" : "#C8102E", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              {msg.startsWith("Voc\u00EA precisa") ? "Fa\u00E7a login" : "Ops!"}
            </div>
            <div style={{ color: "#8B9CC8", fontSize: 14, lineHeight: 1.5 }}>{msg}</div>
            <button onClick={() => navigate("/superadmin")}
              style={{ marginTop: 16, background: "#0033A0", border: "none", borderRadius: 8, color: "#fff", padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {msg.startsWith("Voc\u00EA precisa") ? "Fazer Login" : "Ir para o Bol\u00E3o"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
