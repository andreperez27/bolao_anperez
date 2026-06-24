import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { listarEdicoesAtivas } from "../services/competitions";
import { criarGrupoAdmin, listarGruposDashboard, excluirGrupo, usarConviteParticipante } from "../services/groups";
import { getSession } from "../services/auth";

const inputStyle = { width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 12px", fontSize: 14, fontWeight: 500, boxSizing: "border-box" };
const selectStyle = { ...inputStyle, appearance: "auto" };
const cardStyle = { background: "#111827", border: "1px solid #1E2A45", borderRadius: 12, padding: 20, marginBottom: 16 };
const tabStyle = (active) => ({
  padding: "10px 20px", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14,
  cursor: "pointer", background: active ? "#0033A0" : "transparent", color: active ? "#fff" : "#8B9CC8",
});

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  

  const [aba, setAba] = useState("criar");
  const [edicoes, setEdicoes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [msg, setMsg] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conviteToken = params.get("convite");
    if (!conviteToken) return;
    const session = getSession();
    if (!session?.sessao_token) return;
    usarConviteParticipante(conviteToken, session.sessao_token)
      .then((data) => {
        const slug = data?.grupo_slug;
        if (slug) navigate("/g/" + slug + "/minhas-cartelas", { replace: true });
        else setMsg("Convite aceito! Acesse o grupo pelo painel.");
      })
      .catch((e) => setMsg("Erro ao usar convite: " + e.message));
  }, [location.search]);

  const [form, setForm] = useState({ nome: "", slug: "", editionId: "", adminNome: "", adminSenha: "" });
  const [credenciais, setCredenciais] = useState({});

  useEffect(() => {
    listarEdicoesAtivas().then((d) => setEdicoes(Array.isArray(d) ? d : [])).catch(() => {});
    carregarGrupos();
  }, []);

  const carregarGrupos = () => {
    listarGruposDashboard().then((d) => setGrupos(Array.isArray(d) ? d : [])).catch(() => {});
  };

  const handleCriar = async () => {
    if (!form.nome.trim() || !form.slug.trim() || !form.editionId || !form.adminNome.trim() || !form.adminSenha) {
      setMsg("Preencha todos os campos."); return;
    }
    if (form.adminSenha.length < 6) { setMsg("Senha do admin deve ter pelo menos 6 caracteres."); return; }
    setCarregando(true); setMsg("");
    try {
      const session = getSession();
      if (!session?.sessao_token) { setMsg("Erro: sessão inválida"); setCarregando(false); return; }
      const result = await criarGrupoAdmin({
        nome: form.nome.trim(), slug: form.slug.trim(),
        editionId: form.editionId,
        adminNome: form.adminNome.trim(), adminSenha: form.adminSenha,
        sessaoToken: session.sessao_token,
      });
      setCredenciais((prev) => ({ ...prev, [form.slug.trim()]: { nome: form.adminNome.trim(), senha: form.adminSenha } }));
      const link = `${window.location.origin}${import.meta.env.BASE_URL}#/g/${form.slug.trim()}/login`;
      setMsg(
        `Grupo "${form.nome}" criado com sucesso!\n\n` +
        `Link do grupo: ${link}\n` +
        `Admin: ${form.adminNome.trim()}\n` +
        `Senha: ${form.adminSenha}\n\n` +
        `Compartilhe o link, o nome do admin e a senha com o administrador do grupo.`
      );
      setForm({ nome: "", slug: "", editionId: "", adminNome: "", adminSenha: "" });
      carregarGrupos();
      setAba("grupos");
    } catch (e) { setMsg("Erro: " + e.message); }
    setCarregando(false);
  };

  const handleExcluir = async (g) => {
    if (!window.confirm(`Excluir o grupo "${g.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const session = getSession();
      if (!session?.sessao_token) return;
      await excluirGrupo(g.id, session.sessao_token);
      carregarGrupos();
    } catch (e) { alert("Erro: " + e.message); }
  };

  const copiarConviteAdmin = (g) => {
    const cred = credenciais[g.slug];
    const link = `${window.location.origin}${import.meta.env.BASE_URL}#/g/${g.slug}/login`;
    const adminNome = cred?.nome || g.admin_nome || "Admin";
    const adminSenha = cred?.senha || "(senha não disponível)";
    const texto = [
      `\uD83C\uDFC6 Convite - ${g.nome}`,
      `\uD83D\uDD17 Link: ${link}`,
      `\uD83D\uDC64 Admin: ${adminNome}`,
      `\uD83D\uDD11 Senha: ${adminSenha}`,
      ``,
      `\uD83D\uDCDD Instruções:`,
      `1. Acesse o link acima`,
      `2. Faça login com "${adminNome}" e a senha fornecida`,
      `3. Pronto! Você já pode gerenciar o grupo`,
    ].join("\n");
    navigator.clipboard.writeText(texto).then(() => {
      setMsg(`Convite completo para "${g.nome}" copiado! Compartilhe com o admin.`);
      setTimeout(() => setMsg(""), 5000);
    }).catch(() => setMsg("Erro ao copiar"));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", paddingBottom: 60 }} onError={(e) => console.error("SuperAdminDashboard error:", e)}>
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", borderBottom: "2px solid #FFD700" }}>
        <div style={{ padding: "20px 24px 14px", maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div>
              <div style={{ color: "#FFD700", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>BOLÃO ANPEREZ</div>
              <div style={{ color: "#F0F4FF", fontSize: 22, fontWeight: 900, marginTop: 2 }}>Painel Administrativo</div>
              <div style={{ color: "#8B9CC8", fontSize: 13 }}>Plataforma de gestão de Bolões</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {user && <span style={{ color: "#8B9CC8", fontSize: 13 }}>{user.nome}</span>}
              <button onClick={signOut} style={{ background: "#C8102E", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Sair</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={() => setAba("criar")} style={tabStyle(aba === "criar")}>Criar Grupo</button>
            <button onClick={() => setAba("grupos")} style={tabStyle(aba === "grupos")}>Grupos Criados</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 24px 0" }}>
        {msg && (
          <div style={{ ...cardStyle, borderColor: msg.startsWith("Erro") ? "#C8102E" : "#10b981", whiteSpace: "pre-line" }}>
            <div style={{ color: msg.startsWith("Erro") ? "#C8102E" : "#10b981", fontSize: 13 }}>{msg}</div>
          </div>
        )}

        {aba === "criar" && (
          <div style={cardStyle}>
            <div style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Criar Novo Grupo</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ color: "#8B9CC8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Nome do grupo</label>
                <input placeholder="Ex: Família, Empresa XPTO" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: "#8B9CC8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Slug (URL)</label>
                <input placeholder="Ex: familia, empresa-xpto" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: "#8B9CC8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Campeonato / Edição</label>
                <select value={form.editionId} onChange={(e) => setForm({ ...form, editionId: e.target.value })} style={selectStyle}>
                  <option value="">Selecione um campeonato...</option>
                  {edicoes.map((e) => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
              </div>
              <div style={{ borderTop: "1px solid #1E2A45", paddingTop: 12 }}>
                <div style={{ color: "#FFD700", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Credenciais do Admin do Grupo</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input placeholder="Nome do admin (ex: João)" value={form.adminNome} onChange={(e) => setForm({ ...form, adminNome: e.target.value })} style={inputStyle} />
                  <input type="password" placeholder="Senha do admin (mín. 6 caracteres)" value={form.adminSenha} onChange={(e) => setForm({ ...form, adminSenha: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <button onClick={handleCriar} disabled={carregando}
                style={{ width: "100%", background: "#10b981", border: "none", borderRadius: 8, color: "#fff", padding: "12px", fontWeight: 700, fontSize: 15, cursor: carregando ? "not-allowed" : "pointer", opacity: carregando ? 0.6 : 1 }}>
                {carregando ? "Criando..." : "Criar Grupo"}
              </button>
            </div>
          </div>
        )}

        {aba === "grupos" && (
          <div style={cardStyle}>
            <div style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              Grupos Criados ({grupos.length})
            </div>
            {grupos.length === 0 ? (
              <div style={{ color: "#8B9CC8", fontSize: 14, textAlign: "center", padding: 20 }}>Nenhum grupo criado ainda.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {grupos.map((g) => {
                  const cred = credenciais[g.slug];
                  const link = `${window.location.origin}${import.meta.env.BASE_URL}#/g/${g.slug}/login`;
                  const adminNome = cred?.nome || g.admin_nome || "Admin";
                  const adminSenha = cred?.senha || "—";
                  return (
                    <div key={g.id} style={{ background: "#1a2234", border: "1px solid #1E2A45", borderRadius: 12, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div style={{ color: "#FFD700", fontWeight: 800, fontSize: 16 }}>{g.nome}</div>
                          <div style={{ color: "#8B9CC8", fontSize: 12 }}>/{g.slug} · {g.edition_nome} · {g.participantes || 0} participantes</div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => navigate(`/g/${g.slug}/admin`)}
                            style={{ background: "#0033A0", border: "none", borderRadius: 6, color: "#fff", padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            Editar
                          </button>
                          <button onClick={() => handleExcluir(g)}
                            style={{ background: "#C8102E", border: "none", borderRadius: 6, color: "#fff", padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            Excluir
                          </button>
                        </div>
                      </div>
                      <div style={{ background: "#111827", borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 12, lineHeight: 1.6, color: "#8B9CC8", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
{`\uD83C\uDFC6 Convite - ${g.nome}
\uD83D\uDD17 Link: ${link}
\uD83D\uDC64 Admin: ${adminNome}
\uD83D\uDD11 Senha: ${adminSenha}`}
                      </div>
                      <button onClick={() => copiarConviteAdmin(g)}
                        style={{ width: "100%", background: "#10b981", border: "none", borderRadius: 8, color: "#fff", padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        \uD83D\uDCCB Copiar Convite Completo
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
