import React, { useState, useEffect, useCallback } from "react";
import { listarTodosGrupos, criarGrupo, atualizarGrupoAdmin, deletarGrupo } from "../services/grupos";
import { useAuth } from "../contexts/AuthContext";

const s = {
  container: { maxWidth: 800, margin: "0 auto", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold" },
  tabBar: { display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #e0e0e0" },
  tab: { padding: "10px 24px", border: "none", background: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#888", borderBottom: "2px solid transparent", marginBottom: -2 },
  tabActive: { padding: "10px 24px", border: "none", background: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#1976d2", borderBottom: "2px solid #1976d2", marginBottom: -2 },
  card: { background: "#fff", borderRadius: 8, padding: 16, marginBottom: 10, border: "1px solid #e0e0e0" },
  grupoNome: { fontSize: 16, fontWeight: "bold" },
  muted: { color: "#888", fontSize: 13 },
  input: { width: "100%", padding: 10, marginBottom: 10, border: "1px solid #ccc", borderRadius: 4, fontSize: 14, boxSizing: "border-box" },
  inputSmall: { padding: 8, border: "1px solid #ccc", borderRadius: 4, fontSize: 13, width: "100%", boxSizing: "border-box" },
  btn: { background: "#1976d2", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 4, cursor: "pointer", fontSize: 14, fontWeight: "bold" },
  btnSmall: { padding: "5px 12px", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 },
  btnOutline: { background: "none", border: "1px solid #1976d2", color: "#1976d2", padding: "5px 12px", borderRadius: 4, cursor: "pointer", fontSize: 12 },
  btnDanger: { background: "#d32f2f", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 4, cursor: "pointer", fontSize: 14 },
  error: { color: "#d32f2f", fontSize: 13, marginTop: 4, marginBottom: 8 },
  success: { color: "#2e7d32", fontSize: 13, marginTop: 4, marginBottom: 8 },
  label: { display: "block", fontSize: 12, fontWeight: "bold", marginBottom: 3, color: "#555" },
  link: { color: "#1976d2", textDecoration: "none", fontSize: 13 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
};

export default function SuperAdminPainel() {
  const { signOut } = useAuth();
  const [tab, setTab] = useState("criar");
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editando, setEditando] = useState(null);

  const [form, setForm] = useState({ nome: "", slug: "", admin_nome: "", admin_senha: "" });
  const [editForm, setEditForm] = useState({ nome: "", novo_admin: "", nova_senha_admin: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarTodosGrupos();
      setGrupos(data || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCriar = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!form.nome || !form.slug || !form.admin_nome) { setError("Preencha nome, slug e admin"); return; }
    try {
      await criarGrupo({ nome: form.nome, slug: form.slug, admin_nome: form.admin_nome, admin_senha: form.admin_senha || "123456" });
      setSuccess(`Grupo "${form.nome}" criado!`);
      setForm({ nome: "", slug: "", admin_nome: "", admin_senha: "" });
      load();
    } catch (e) { setError(e.message); }
  };

  const handleEditar = async (g) => {
    setError(null); setSuccess(null);
    try {
      await atualizarGrupoAdmin(g.id, {
        nome: editForm.nome || undefined,
        novo_admin: editForm.novo_admin || undefined,
        nova_senha_admin: editForm.nova_senha_admin || undefined,
      });
      setSuccess("Grupo atualizado!");
      setEditando(null);
      load();
    } catch (e) { setError(e.message); }
  };

  const handleExcluir = async (g) => {
    if (!window.confirm(`Excluir grupo "${g.nome}"? Todas as cartelas e participantes serão removidos.`)) return;
    setError(null); setSuccess(null);
    try {
      await deletarGrupo(g.id);
      setSuccess(`Grupo "${g.nome}" excluído.`);
      load();
    } catch (e) { setError(e.message); }
  };

  const abrirEditar = (g) => {
    setEditando(g.id);
    setEditForm({ nome: g.nome, novo_admin: "", nova_senha_admin: "" });
    setError(null); setSuccess(null);
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={s.title}>Painel Super Admin</h1>
        <button style={s.btnDanger} onClick={signOut}>Sair</button>
      </div>

      <div style={s.tabBar}>
        <button style={tab === "criar" ? s.tabActive : s.tab} onClick={() => setTab("criar")}>Criar Grupo</button>
        <button style={tab === "grupos" ? s.tabActive : s.tab} onClick={() => setTab("grupos")}>Grupos Criados</button>
      </div>

      {error && <div style={s.error}>{error}</div>}
      {success && <div style={s.success}>{success}</div>}

      {tab === "criar" && (
        <form onSubmit={handleCriar}>
          <div style={s.card}>
            <label style={s.label}>Nome do grupo</label>
            <input style={s.input} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Bolão da Família" />

            <label style={s.label}>Slug (URL única)</label>
            <input style={s.input} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Ex: familia" />

            <label style={s.label}>Nome do administrador</label>
            <input style={s.input} value={form.admin_nome} onChange={(e) => setForm({ ...form, admin_nome: e.target.value })} placeholder="Ex: Joao" />

            <label style={s.label}>Senha do administrador</label>
            <input style={s.input} type="password" value={form.admin_senha} onChange={(e) => setForm({ ...form, admin_senha: e.target.value })} placeholder="Deixe em branco para '123456'" />

            <button type="submit" style={s.btn}>Criar Grupo</button>
          </div>
        </form>
      )}

      {tab === "grupos" && (
        loading ? <p>Carregando...</p> :
        grupos.length === 0 ? <p>Nenhum grupo criado ainda.</p> :
        grupos.map((g) => (
          <div key={g.id} style={s.card}>
            {editando === g.id ? (
              <div>
                <label style={s.label}>Nome</label>
                <input style={s.inputSmall} value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} />
                <label style={{ ...s.label, marginTop: 8 }}>Novo admin (opcional)</label>
                <input style={s.inputSmall} value={editForm.novo_admin} onChange={(e) => setEditForm({ ...editForm, novo_admin: e.target.value })} placeholder="Nome do novo admin" />
                <label style={{ ...s.label, marginTop: 8 }}>Nova senha do admin (opcional)</label>
                <input style={s.inputSmall} type="password" value={editForm.nova_senha_admin} onChange={(e) => setEditForm({ ...editForm, nova_senha_admin: e.target.value })} placeholder="Nova senha" />
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button style={s.btnSmall} onClick={() => handleEditar(g)}>Salvar</button>
                  <button style={{ ...s.btnSmall, background: "#e0e0e0" }} onClick={() => setEditando(null)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={s.grupoNome}>{g.nome}</div>
                  <div style={s.muted}>/{g.slug}</div>
                  {g.admin_nome && <div style={s.muted}>Admin: {g.admin_nome}</div>}
                  <div style={s.muted}>{g.total_participantes || 0} participantes</div>
                  <div style={{ marginTop: 4 }}>
                    <a style={s.link} href={`/bolao_anperez/grupo/${g.slug}`} target="_blank" rel="noopener">Abrir grupo</a>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={s.btnOutline} onClick={() => abrirEditar(g)}>Editar</button>
                  <button style={{ ...s.btnSmall, background: "#d32f2f", color: "#fff" }} onClick={() => handleExcluir(g)}>Excluir</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
