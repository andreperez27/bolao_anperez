import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseFetch } from "../services/supabase";
import { getSession } from "../services/auth";
import { Card } from "../components/Card";
import { Btn } from "../components/Btn";
import { useGrupo } from "../contexts/GrupoContext";

export default function TrocarSenha() {
  const navigate = useNavigate();
  const { grupoId } = useGrupo();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [erro, setErro] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const session = getSession();

  const handleTrocar = async () => {
    if (!senhaAtual || !senhaNova) { setErro("Preencha todos os campos"); return; }
    if (senhaNova.length < 6) { setErro("A nova senha deve ter pelo menos 6 caracteres"); return; }
    if (senhaNova !== confirmSenha) { setErro("Senhas não conferem"); return; }
    setSubmitting(true);
    setErro("");
    try {
      const res = await supabaseFetch("/rest/v1/rpc/trocar_senha", {
        method: "POST",
        body: JSON.stringify({ p_nome: session?.nome, p_senha_antiga: senhaAtual, p_senha_nova: senhaNova, p_grupo_id: grupoId }),
      });
      if (!res.ok) { const t = await res.text(); let m = t; try { const j = JSON.parse(t); m = j.message || t; } catch {} throw new Error(m); }
      setSucesso(true);
      setTimeout(() => navigate("minhas-cartelas", { replace: true }), 1500);
    } catch (e) {
      setErro(e.message);
    }
    setSubmitting(false);
  };

  if (sucesso) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{"\u2705"}</div>
          <div style={{ color: "#10b981", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Senha alterada com sucesso!</div>
          <div style={{ color: "#8B9CC8", fontSize: 13 }}>Redirecionando...</div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Card style={{ maxWidth: 380, width: "100%" }}>
        <div style={{ color: "#F0F4FF", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Trocar Senha</div>
        <div style={{ color: "#8B9CC8", fontSize: 12, marginBottom: 16 }}>Primeiro acesso? Escolha uma nova senha segura.</div>

        <input type="password" inputMode="numeric" pattern="[0-9]*" value={senhaAtual} onChange={e => { setSenhaAtual(e.target.value); setErro(""); }}
          placeholder="Senha atual" onKeyDown={e => e.key === "Enter" && handleTrocar()}
          style={{ width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 14px", fontSize: 16, boxSizing: "border-box", marginBottom: 10 }} />

        <input type="password" inputMode="numeric" pattern="[0-9]*" value={senhaNova} onChange={e => { setSenhaNova(e.target.value); setErro(""); }}
          placeholder="Nova senha (6+ dígitos)" onKeyDown={e => e.key === "Enter" && handleTrocar()}
          style={{ width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 14px", fontSize: 16, boxSizing: "border-box", marginBottom: 10 }} />

        <input type="password" inputMode="numeric" pattern="[0-9]*" value={confirmSenha} onChange={e => setConfirmSenha(e.target.value)}
          placeholder="Confirmar nova senha" onKeyDown={e => e.key === "Enter" && handleTrocar()}
          style={{ width: "100%", background: confirmSenha && confirmSenha !== senhaNova ? "#2a1a1a" : "#1a2234", border: `2px solid ${confirmSenha && confirmSenha !== senhaNova ? "#C8102E" : "#1E2A45"}`, borderRadius: 8, color: "#F0F4FF", padding: "10px 14px", fontSize: 16, boxSizing: "border-box", marginBottom: 14 }} />

        {erro && <div style={{ color: "#C8102E", fontSize: 13, marginBottom: 10, textAlign: "center" }}>{erro}</div>}

        <Btn onClick={handleTrocar} style={{ width: "100%" }} disabled={!senhaAtual || !senhaNova || !confirmSenha || submitting}>
          {submitting ? "Alterando..." : "Alterar Senha"}
        </Btn>
      </Card>
    </div>
  );
}
