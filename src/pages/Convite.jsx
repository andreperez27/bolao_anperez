import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabaseFetch } from "../services/supabase";

export default function Convite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [grupoInfo, setGrupoInfo] = useState(null);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setErro("Link inválido"); setLoading(false); return; }
    supabaseFetch("/rest/v1/rpc/usar_convite", {
      method: "POST",
      body: JSON.stringify({ p_token: token }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
          let msg = txt;
          try { const j = JSON.parse(txt); msg = j.message || txt; } catch {}
          throw new Error(msg);
        }
        return res.json();
      })
      .then((data) => {
        setGrupoInfo(data); // { grupo_id, nome, slug }
        setLoading(false);
      })
      .catch((e) => { setErro(e.message); setLoading(false); });
  }, [token]);

  const irParaGrupo = () => {
    if (grupoInfo?.slug) navigate("/" + grupoInfo.slug + "/login");
    else navigate("/geral/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#111827", border: "1px solid #1E2A45", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%", textAlign: "center" }}>
        {loading ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div style={{ color: "#8B9CC8", fontSize: 14 }}>Validando convite...</div>
          </>
        ) : erro ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
            <div style={{ color: "#C8102E", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Ops!</div>
            <div style={{ color: "#8B9CC8", fontSize: 14, lineHeight: 1.5 }}>{erro}</div>
            <button onClick={() => navigate("/geral/login")}
              style={{ marginTop: 16, background: "#0033A0", border: "none", borderRadius: 8, color: "#fff", padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Ir para o Bolão
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <div style={{ color: "#10b981", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Convite Válido!</div>
            <div style={{ color: "#8B9CC8", fontSize: 14, lineHeight: 1.5, marginBottom: 4 }}>
              Você foi convidado para:
            </div>
            <div style={{ color: "#F0F4FF", fontWeight: 900, fontSize: 20, marginBottom: 16 }}>
              {grupoInfo?.nome}
            </div>
            <button onClick={irParaGrupo}
              style={{ background: "#10b981", border: "none", borderRadius: 8, color: "#fff", padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Entrar no Grupo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
