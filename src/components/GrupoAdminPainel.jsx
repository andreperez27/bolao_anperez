import React, { useState, useEffect, useCallback } from "react";
import { listarMembrosGrupo, gerarConvite, listarConvites, atualizarConfigGrupo } from "../services/grupos";
import { useAuth } from "../contexts/AuthContext";
import { useGrupo } from "../contexts/GrupoContext";

const styles = {
  container: { maxWidth: 700, margin: "0 auto", padding: 20 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 8 },
  title: { fontSize: 22, fontWeight: "bold", margin: 0 },
  subtitle: { color: "#666", fontSize: 14, margin: 0 },
  card: { background: "#fff", borderRadius: 8, padding: 16, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e0e0e0" },
  cardTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  input: { width: "100%", padding: 8, marginBottom: 8, border: "1px solid #ccc", borderRadius: 4, fontSize: 14, boxSizing: "border-box" },
  inputSmall: { padding: 8, border: "1px solid #ccc", borderRadius: 4, fontSize: 14, width: 120 },
  btn: { background: "#1976d2", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 4, cursor: "pointer", fontSize: 14, fontWeight: "bold" },
  btnSmall: { background: "#e8e8e8", color: "#333", border: "none", padding: "6px 12px", borderRadius: 4, cursor: "pointer", fontSize: 12 },
  btnOutline: { background: "transparent", color: "#1976d2", border: "1px solid #1976d2", padding: "6px 12px", borderRadius: 4, cursor: "pointer", fontSize: 12 },
  tab: { display: "flex", gap: 4, marginBottom: 16 },
  tabBtn: { padding: "8px 16px", border: "none", background: "#f0f0f0", cursor: "pointer", borderRadius: "4px 4px 0 0", fontSize: 14 },
  tabBtnActive: { padding: "8px 16px", border: "none", background: "#1976d2", color: "#fff", cursor: "pointer", borderRadius: "4px 4px 0 0", fontSize: 14 },
  label: { display: "block", fontSize: 12, fontWeight: "bold", marginBottom: 4, color: "#666" },
  row: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  conviteCode: { fontFamily: "monospace", fontSize: 18, fontWeight: "bold", letterSpacing: 2, padding: "8px 12px", background: "#f5f5f5", borderRadius: 4, border: "1px dashed #ccc", display: "inline-block" },
  error: { color: "#d32f2f", fontSize: 13, marginTop: 4 },
  success: { color: "#2e7d32", fontSize: 13, marginTop: 4 },
  muted: { color: "#888", fontSize: 13 },
  badgeUsado: { display: "inline-block", background: "#ffebee", color: "#c62828", padding: "2px 8px", borderRadius: 12, fontSize: 11 },
  badgeDisponivel: { display: "inline-block", background: "#e8f5e9", color: "#2e7d32", padding: "2px 8px", borderRadius: 12, fontSize: 11 },
};

export default function GrupoAdminPainel() {
  const { user } = useAuth();
  const { grupo } = useGrupo();
  const [tab, setTab] = useState("convites");
  const [membros, setMembros] = useState([]);
  const [convites, setConvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [valor, setValor] = useState("");
  const [ptsCheio, setPtsCheio] = useState("");
  const [ptsVencedor, setPtsVencedor] = useState("");
  const [ptsGols, setPtsGols] = useState("");

  useEffect(() => {
    if (grupo) {
      setValor(String(grupo.valor_aposta || ""));
      setPtsCheio(String(grupo.pontos_acerto_cheio || ""));
      setPtsVencedor(String(grupo.pontos_acerto_vencedor || ""));
      setPtsGols(String(grupo.pontos_acerto_gols || ""));
    }
  }, [grupo]);

  const loadMembros = useCallback(async () => {
    if (!grupo) return;
    try {
      const data = await listarMembrosGrupo(grupo.id);
      setMembros(data || []);
    } catch {}
  }, [grupo]);

  const loadConvites = useCallback(async () => {
    if (!grupo) return;
    try {
      const data = await listarConvites(grupo.id);
      setConvites(data || []);
    } catch {}
  }, [grupo]);

  useEffect(() => {
    if (tab === "participantes") loadMembros();
    if (tab === "convites") loadConvites();
  }, [tab, loadMembros, loadConvites]);

  const handleGerarConvite = async () => {
    setError(null);
    setSuccess(null);
    if (!grupo || !user) return;
    try {
      const data = await gerarConvite(grupo.id, user.nome);
      setSuccess(`Convite gerado: ${data.codigo}`);
      loadConvites();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSalvarConfig = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!grupo || !user) return;
    try {
      await atualizarConfigGrupo(grupo.id, user.nome, {
        valor_aposta: Number(valor),
        pontos_acerto_cheio: Number(ptsCheio),
        pontos_acerto_vencedor: Number(ptsVencedor),
        pontos_acerto_gols: Number(ptsGols),
      });
      setSuccess("Configurações salvas!");
    } catch (e) {
      setError(e.message);
    }
  };

  const copiarConvite = (codigo) => {
    navigator.clipboard.writeText(codigo).catch(() => {});
    setSuccess("Código copiado!");
  };

  if (!grupo) return <p>Carregando grupo...</p>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Admin: {grupo.nome}</h2>
          <p style={styles.subtitle}>/{grupo.slug}</p>
        </div>
      </div>

      <div style={styles.tab}>
        <button style={tab === "convites" ? styles.tabBtnActive : styles.tabBtn} onClick={() => setTab("convites")}>Convites</button>
        <button style={tab === "participantes" ? styles.tabBtnActive : styles.tabBtn} onClick={() => setTab("participantes")}>Participantes</button>
        <button style={tab === "config" ? styles.tabBtnActive : styles.tabBtn} onClick={() => setTab("config")}>Configurações</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {tab === "convites" && (
        <div>
          <button style={styles.btn} onClick={handleGerarConvite}>Gerar Novo Convite</button>

          {convites.length === 0 ? (
            <p style={{ ...styles.muted, marginTop: 16 }}>Nenhum convite gerado ainda.</p>
          ) : (
            convites.map((c) => (
              <div key={c.id} style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={styles.conviteCode}>{c.codigo}</span>
                    <div style={{ marginTop: 4 }}>
                      {c.usado ? (
                        <span style={styles.badgeUsado}>Usado por {c.usado_por}</span>
                      ) : (
                        <span style={styles.badgeDisponivel}>Disponível</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {!c.usado && <button style={styles.btnOutline} onClick={() => copiarConvite(c.codigo)}>Copiar</button>}
                    <span style={styles.muted}>{new Date(c.criado_em).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "participantes" && (
        <div>
          {membros.length === 0 ? (
            <p style={styles.muted}>Nenhum participante ainda.</p>
          ) : (
            membros.filter((m) => m.role !== "group_admin").map((m) => (
              <div key={m.nome} style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span><strong>{m.nome}</strong></span>
                  <span style={styles.muted}>{m.role}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "config" && (
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Configurações do Grupo</h3>
          <form onSubmit={handleSalvarConfig}>
            <label style={styles.label}>Valor da aposta (R$)</label>
            <input style={styles.inputSmall} type="number" value={valor} onChange={(e) => setValor(e.target.value)} />

            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <div>
                <label style={styles.label}>Acerto cheio (pts)</label>
                <input style={styles.inputSmall} type="number" value={ptsCheio} onChange={(e) => setPtsCheio(e.target.value)} />
              </div>
              <div>
                <label style={styles.label}>Acerto vencedor (pts)</label>
                <input style={styles.inputSmall} type="number" value={ptsVencedor} onChange={(e) => setPtsVencedor(e.target.value)} />
              </div>
              <div>
                <label style={styles.label}>Acerto gols (pts)</label>
                <input style={styles.inputSmall} type="number" value={ptsGols} onChange={(e) => setPtsGols(e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <button type="submit" style={styles.btn}>Salvar Configurações</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
