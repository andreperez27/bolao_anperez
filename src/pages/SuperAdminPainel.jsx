import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { Btn } from "../components/Btn";
import { useAuth } from "../contexts/AuthContext";
import { useGrupo } from "../contexts/GrupoContext";
import { atualizarGrupo, atualizarConfigGrupo, excluirGrupo } from "../services/groups";
import { getSession } from "../services/auth";
import { AdminPanel } from "../components/AdminPanel";

export default function SuperAdminPainel({ resultados, onResultadosChange, ultimaAtualizacao, onVoltar }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { grupo, config, grupoSlug } = useGrupo();
  const [msg, setMsg] = React.useState("");
  const [carregando, setCarregando] = React.useState(false);
  const [editando, setEditando] = React.useState(false);
  const [dados, setDados] = React.useState({ nome: "", slug: "", valor_aposta: 20 });

  React.useEffect(() => {
    if (grupo && config) {
      setDados({ nome: grupo.nome || "", slug: grupo.slug || "", valor_aposta: config.valor_aposta || 20 });
    }
  }, [grupo, config]);

  const handleSalvar = async () => {
    setCarregando(true);
    setMsg("");
    try {
      const session = getSession();
      if (!session?.sessao_token) { setMsg("Erro: sessão inválida"); setCarregando(false); return; }
      if (!grupo?.id) { setMsg("Erro: grupo não carregado"); setCarregando(false); return; }
      const payload = {};
      if (dados.nome !== grupo.nome) payload.nome = dados.nome;
      if (dados.slug !== grupo.slug) payload.slug = dados.slug;
      if (Object.keys(payload).length > 0) {
        await atualizarGrupo({ grupoId: grupo.id, sessaoToken: session.sessao_token, ...payload });
      }
      if (dados.valor_aposta !== config?.valor_aposta) {
        await atualizarConfigGrupo({ grupoId: grupo.id, sessaoToken: session.sessao_token, valorAposta: dados.valor_aposta });
      }
      setMsg("Grupo atualizado!");
      setEditando(false);
    } catch (e) {
      setMsg("Erro: " + e.message);
    }
    setCarregando(false);
  };

  const handleExcluir = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir o grupo "${grupo?.nome}"? Esta ação não pode ser desfeita.`)) return;
    setCarregando(true);
    setMsg("");
    try {
      const session = getSession();
      if (!session?.sessao_token) { setMsg("Erro: sessão inválida"); setCarregando(false); return; }
      if (!grupo?.id) { setMsg("Erro: grupo não carregado"); setCarregando(false); return; }
      await excluirGrupo(grupo.id, session.sessao_token);
      navigate("/superadmin");
    } catch (e) {
      setMsg("Erro: " + e.message);
      setCarregando(false);
    }
  };

  const inputStyle = { width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 12px", fontSize: 14, fontWeight: 500, boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", paddingBottom: 60 }}>
      <div style={{ background: "linear-gradient(135deg, #0033A0, #001a66)", padding: "16px 20px 14px", borderBottom: "2px solid #FFD700" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <button onClick={onVoltar} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{"\u2190"} Voltar</button>
          <button onClick={signOut} style={{ background: "#C8102E", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Sair</button>
        </div>
        <div style={{ color: "#FFD700", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>BOLÃO ANPEREZ</div>
        <div style={{ color: "#F0F4FF", fontSize: 20, fontWeight: 900, marginTop: 4 }}>Painel do Administrador</div>
      </div>
      <div style={{ padding: "14px 16px 0", maxWidth: 600, margin: "0 auto" }}>
        {msg && <div style={{ color: msg.startsWith("Erro") ? "#C8102E" : "#10b981", fontSize: 12, marginBottom: 8 }}>{msg}</div>}

        <Card>
          {grupo && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "#FFD700", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{grupo.nome}</div>
              <div style={{ color: "#8B9CC8", fontSize: 12, marginBottom: 4 }}>/{grupo.slug}</div>
              <div style={{ color: "#F0F4FF", fontSize: 14, fontWeight: 600 }}>R$ {config?.valor_aposta || 20}</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => window.location.href = window.location.pathname.replace(/\/admin.*/, `/g/${grupoSlug}/ranking`)} cor="#0033A0" style={{ flex: 1 }}>Ver Ranking</Btn>
            <Btn onClick={() => setEditando(!editando)} cor="#FFD700" style={{ flex: 1 }}>{editando ? "Cancelar" : "Editar Grupo"}</Btn>
          </div>
        </Card>

        {editando && (
          <Card>
            <div style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Editar {grupo?.nome || "Grupo"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input placeholder="Nome do grupo" value={dados.nome} onChange={e => setDados({ ...dados, nome: e.target.value })} style={inputStyle} />
              <input placeholder="Slug (ex: familia)" value={dados.slug} onChange={e => setDados({ ...dados, slug: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Valor aposta (R$)" value={dados.valor_aposta} onChange={e => setDados({ ...dados, valor_aposta: Number(e.target.value) })} style={inputStyle} />
              <Btn onClick={handleSalvar} disabled={carregando} style={{ width: "100%" }}>{carregando ? "Salvando..." : "Salvar"}</Btn>
            </div>
          </Card>
        )}

        <Card>
          <div style={{ color: "#C8102E", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Zona de Perigo</div>
          <p style={{ color: "#8B9CC8", fontSize: 12, marginBottom: 12 }}>
            Excluir o grupo remove todos os dados associados. Esta ação não pode ser desfeita.
          </p>
          <button onClick={handleExcluir} disabled={carregando}
            style={{ width: "100%", background: "#C8102E", border: "none", borderRadius: 8, color: "#fff", padding: "12px", fontWeight: 700, fontSize: 14, cursor: carregando ? "not-allowed" : "pointer", opacity: carregando ? 0.6 : 1 }}>
            {carregando ? "Excluindo..." : "Excluir Grupo"}
          </button>
        </Card>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
        <AdminPanel
          resultados={resultados}
          onResultadosChange={onResultadosChange}
          ultimaAtualizacao={ultimaAtualizacao}
        />
      </div>
    </div>
  );
}
