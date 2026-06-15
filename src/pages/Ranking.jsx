import React from "react";
import { Card } from "../components/Card";
import { Btn } from "../components/Btn";
import { StatusBadge } from "../components/StatusBadge";
import { PainelFinanceiro } from "../components/PainelFinanceiro";
import { AdminPanel } from "../components/AdminPanel";
import { LegendaDesempate } from "../components/LegendaDesempate";
import { calcularPontos, pontosCampeaoPorFase } from "../utils/pontuacao";
import { NOMES_IA } from "../services/ia";
import { GroupSelector } from "../components/GroupSelector";

function SuperAdminPainel() {
  const [grupos, setGrupos] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [nome, setNome] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [admin, setAdmin] = React.useState("");
  const [valor, setValor] = React.useState(20);
  const [msg, setMsg] = React.useState("");
  const [membrosAberto, setMembrosAberto] = React.useState(null);
  const [membros, setMembros] = React.useState([]);

  const carregar = React.useCallback(async () => {
    setLoading(true);
    try {
      const { listarTodosGrupos } = await import("../services/grupos");
      const data = await listarTodosGrupos();
      setGrupos(data || []);
    } catch { setGrupos([]); }
    setLoading(false);
  }, []);

  React.useEffect(() => { carregar(); }, [carregar]);

  const criar = async () => {
    if (!nome || !slug || !admin) { setMsg("Preencha nome, slug e admin."); return; }
    try {
      const { criarGrupo } = await import("../services/grupos");
      await criarGrupo(nome, slug, admin, valor);
      setMsg("Grupo criado!");
      setNome(""); setSlug(""); setAdmin(""); setValor(20);
      carregar();
    } catch (e) { setMsg("Erro: " + e.message); }
  };

  const inputStyle = { width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 12px", fontSize: 14, fontWeight: 500, boxSizing: "border-box" };

  const verMembros = async (g) => {
    if (membrosAberto === g.id) { setMembrosAberto(null); return; }
    try {
      const { listarMembros } = await import("../services/grupos");
      const data = await listarMembros(g.id);
      setMembros(data || []);
      setMembrosAberto(g.id);
    } catch { setMembros([]); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", paddingBottom: 60 }}>
      <div style={{ background: "linear-gradient(135deg, #0033A0, #001a66)", padding: "16px 20px 14px", borderBottom: "2px solid #FFD700" }}>
        <div style={{ color: "#FFD700", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>BOLÃO DA COPA 2026</div>
        <div style={{ color: "#F0F4FF", fontSize: 20, fontWeight: 900, marginTop: 4 }}>Painel do Administrador</div>
      </div>
      <div style={{ padding: "14px 16px 0", maxWidth: 600, margin: "0 auto" }}>
        {msg && <div style={{ color: "#10b981", fontSize: 12, marginBottom: 8 }}>{msg}</div>}
        <div style={{ background: "#111827", border: "1px solid #1E2A45", borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ color: "#FFD700", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Criar Novo Grupo</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input placeholder="Nome do grupo" value={nome} onChange={e => setNome(e.target.value)} style={inputStyle} />
            <input placeholder="Slug (ex: familia)" value={slug} onChange={e => setSlug(e.target.value)} style={inputStyle} />
            <input placeholder="Admin (nome do jogador)" value={admin} onChange={e => setAdmin(e.target.value)} style={inputStyle} />
            <input type="number" placeholder="Valor aposta (R$)" value={valor} onChange={e => setValor(Number(e.target.value))} style={inputStyle} />
            <button onClick={criar} style={{ background: "#C8102E", border: "none", borderRadius: 8, color: "#fff", padding: "10px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Criar Grupo</button>
          </div>
        </div>

        <div style={{ background: "#111827", border: "1px solid #1E2A45", borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ color: "#FFD700", fontWeight: 800, fontSize: 14 }}>Grupos Existentes</div>
            <button onClick={carregar} style={{ background: "transparent", border: "1px solid #1E2A45", borderRadius: 6, color: "#8B9CC8", padding: "6px 10px", fontSize: 11, cursor: "pointer" }}>Atualizar</button>
          </div>
          {loading ? <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", padding: 12 }}>Carregando...</div> : grupos.length === 0 ? <div style={{ color: "#8B9CC8", fontSize: 12, padding: 8 }}>Nenhum grupo criado.</div> : grupos.map(g => (
            <div key={g.id} style={{ background: "#1a2234", borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 14 }}>{g.nome} <span style={{ color: "#8B9CC8", fontSize: 11 }}>/{g.slug}</span></div>
              <div style={{ color: "#8B9CC8", fontSize: 11, marginTop: 4 }}>Admin: {g.admin_nome} | Valor: R$ {g.valor_aposta}</div>
              <button onClick={() => verMembros(g)} style={{ background: "transparent", border: "none", color: "#10b981", cursor: "pointer", fontSize: 12, marginTop: 4 }}>Membros</button>
              {membrosAberto === g.id && (
                <div style={{ marginTop: 8 }}>
                  {membros.length === 0 ? <div style={{ color: "#8B9CC8", fontSize: 11 }}>Nenhum membro.</div> : membros.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #1E2A4520" }}>
                      <span style={{ color: "#F0F4FF", fontSize: 13 }}>{m.usuario_id || m.nome}</span>
                      <span style={{ color: "#8B9CC8", fontSize: 11 }}>{m.role}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Ranking({
  cartelas,
  resultados,
  campeoReal,
  isAdmin,
  config,
  ultimaAtualizacao,
  onVoltar,
  onValidarCartela,
  onResultadosChange,
  onShowInstrucoes,
  onVerTabela,
  onVerCartela,
}) {
  if (isAdmin) return <SuperAdminPainel />;
  const medalhas = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];

  const ranking = Object.values(
    cartelas.filter((c) => !NOMES_IA.includes(c.participante)).reduce((acc, c) => {
      let pts = 0;
      let total = 0;
      let acertos = 0;
      let placaresExatos = 0;
      let diferencasCertas = 0;
      let vencedoresCertos = 0;
      let empatesPalpitados = 0;
      for (const [k, v] of Object.entries(c.palpites || {})) {
        if (k === "__campeo") continue;
        total++;
        const r = resultados[k];
        const { pts: pt, tipo } = calcularPontos(v, r);
        pts += pt;
        if (tipo !== "errou" && tipo !== "pendente") acertos++;
        if (tipo === "placar_exato")    placaresExatos++;
        if (tipo === "diferenca_certa") diferencasCertas++;
        if (tipo === "vencedor_certo")  vencedoresCertos++;
        if (v?.gols_a !== undefined && v.gols_a === v.gols_b) empatesPalpitados++;
      }
      if (campeoReal && c.campeao === campeoReal) {
        pts += pontosCampeaoPorFase(c.campeao_fase || "grupos");
      }
      pts += Number(config?.bonus_geral) || 0;
      const existente = acc[c.participante];
      if (!existente || pts > existente.pts) {
        acc[c.participante] = {
          ...c, pts, total, acertos,
          placaresExatos, diferencasCertas,
          vencedoresCertos, empatesPalpitados,
        };
      }
      return acc;
    }, {})
  ).sort((a, b) => {
    if (b.pts !== a.pts)                           return b.pts - a.pts;
    if (b.placaresExatos !== a.placaresExatos)     return b.placaresExatos - a.placaresExatos;
    if (b.diferencasCertas !== a.diferencasCertas) return b.diferencasCertas - a.diferencasCertas;
    if (b.vencedoresCertos !== a.vencedoresCertos) return b.vencedoresCertos - a.vencedoresCertos;
    if (a.empatesPalpitados !== b.empatesPalpitados) return a.empatesPalpitados - b.empatesPalpitados;
    if (b.acertos !== a.acertos)                   return b.acertos - a.acertos;
    return (a.participante || "").localeCompare(b.participante || "", "pt-BR");
  });

  const iasNoRanking = Object.values(
    cartelas.filter((c) => NOMES_IA.includes(c.participante)).reduce((acc, c) => {
      let pts = 0;
      let total = 0;
      let acertos = 0;
      let placaresExatos = 0;
      let diferencasCertas = 0;
      let vencedoresCertos = 0;
      let empatesPalpitados = 0;
      for (const [k, v] of Object.entries(c.palpites || {})) {
        if (k === "__campeo") continue;
        total++;
        const r = resultados[k];
        const { pts: pt, tipo } = calcularPontos(v, r);
        pts += pt;
        if (tipo !== "errou" && tipo !== "pendente") acertos++;
        if (tipo === "placar_exato")    placaresExatos++;
        if (tipo === "diferenca_certa") diferencasCertas++;
        if (tipo === "vencedor_certo")  vencedoresCertos++;
        if (v?.gols_a !== undefined && v.gols_a === v.gols_b) empatesPalpitados++;
      }
      if (campeoReal && c.campeao === campeoReal) {
        pts += pontosCampeaoPorFase(c.campeao_fase || "grupos");
      }
      pts += Number(config?.bonus_geral) || 0;
      const existente = acc[c.participante];
      if (!existente || pts > existente.pts) {
        acc[c.participante] = {
          ...c, pts, total, acertos,
          placaresExatos, diferencasCertas,
          vencedoresCertos, empatesPalpitados,
        };
      }
      return acc;
    }, {})
  ).sort((a, b) => {
    if (b.pts !== a.pts)                           return b.pts - a.pts;
    if (b.placaresExatos !== a.placaresExatos)     return b.placaresExatos - a.placaresExatos;
    if (b.diferencasCertas !== a.diferencasCertas) return b.diferencasCertas - a.diferencasCertas;
    if (b.vencedoresCertos !== a.vencedoresCertos) return b.vencedoresCertos - a.vencedoresCertos;
    if (a.empatesPalpitados !== b.empatesPalpitados) return a.empatesPalpitados - b.empatesPalpitados;
    if (b.acertos !== a.acertos)                   return b.acertos - a.acertos;
    return (a.participante || "").localeCompare(b.participante || "", "pt-BR");
  });

  const primeiro = ranking[0] || null;
  const segundo = ranking[1] || null;
  const terceiro = ranking[2] || null;

  return (
    <div className="scroll-suave" style={{ minHeight: "100vh", background: "#0A0E1A", paddingBottom: 60 }}>
      <div
        style={{
          background: "linear-gradient(135deg, #B8860B, #FFD700)",
          padding: "16px 20px 14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <button
            onClick={onVoltar}
            style={{
              background: "rgba(0,0,0,0.25)",
              color: "#000",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {"\u2190"} Voltar
          </button>
          {onVerTabela && (
            <button
              onClick={onVerTabela}
              style={{
                background: "rgba(0,0,0,0.15)",
                border: "1px solid rgba(0,0,0,0.3)",
                borderRadius: 8,
                color: "#000",
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {"\uD83D\uDCC5"} Tabela
            </button>
          )}
          <button
            onClick={onShowInstrucoes}
            style={{
              background: "rgba(0,0,0,0.15)",
              border: "none",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            {"\u2753"}
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#000", fontSize: 22, fontWeight: 900 }}>
            {"\uD83C\uDFC5"} Ranking do Bolão
          </div>
          <GroupSelector />
        </div>
        <div style={{ color: "rgba(0,0,0,0.6)", fontSize: 13 }}>
          {new Set(cartelas.filter((c) => !NOMES_IA.includes(c.participante)).map((c) => c.participante)).size} participantes, {cartelas.filter((c) => !NOMES_IA.includes(c.participante)).length} cartelas
          {cartelas.filter((c) => NOMES_IA.includes(c.participante)).length > 0 && ` + ${new Set(cartelas.filter((c) => NOMES_IA.includes(c.participante)).map((c) => c.participante)).size} IAs`}
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        <PainelFinanceiro
          totalParticipantes={new Set(cartelas.filter((c) => !NOMES_IA.includes(c.participante)).map((c) => c.participante)).size}
          valorAposta={config?.valor_aposta || 20}
        />

        {ranking.length > 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, #1a1a2e, #16213e)",
              border: "1px solid #1E2A45",
              borderRadius: 12,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                gap: 12,
                padding: "8px 0",
              }}
            >
              {segundo ? (
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 28 }}>{"\uD83E\uDD48"}</div>
                  <div style={{ color: "#F0F4FF", fontSize: 13, fontWeight: 800, marginTop: 4 }}>
                    {segundo.participante}
                  </div>
                  <div style={{ color: "#FFD700", fontSize: 18, fontWeight: 900 }}>
                    {segundo.pts}
                  </div>
                  <div style={{ color: "#8B9CC8", fontSize: 11 }}>pts</div>
                </div>
              ) : (
                <div style={{ flex: 1 }} />
              )}
              {primeiro ? (
                <div style={{ textAlign: "center", flex: 1.3 }}>
                  <div style={{ fontSize: 36 }}>{"\uD83E\uDD47"}</div>
                  <div style={{ color: "#F0F4FF", fontSize: 15, fontWeight: 800, marginTop: 4 }}>
                    {primeiro.participante}
                  </div>
                  <div style={{ color: "#FFD700", fontSize: 22, fontWeight: 900 }}>
                    {primeiro.pts}
                  </div>
                  <div style={{ color: "#8B9CC8", fontSize: 11 }}>pts</div>
                </div>
              ) : (
                <div style={{ flex: 1.3 }} />
              )}
              {terceiro ? (
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 28 }}>{"\uD83E\uDD49"}</div>
                  <div style={{ color: "#F0F4FF", fontSize: 13, fontWeight: 800, marginTop: 4 }}>
                    {terceiro.participante}
                  </div>
                  <div style={{ color: "#FFD700", fontSize: 18, fontWeight: 900 }}>
                    {terceiro.pts}
                  </div>
                  <div style={{ color: "#8B9CC8", fontSize: 11 }}>pts</div>
                </div>
              ) : (
                <div style={{ flex: 1 }} />
              )}
            </div>
          </div>
        )}

        <LegendaDesempate />

        {(() => {
          const renderCard = (c, idx, isIA) => (
            <div
              key={c.id}
              onClick={() => onVerCartela?.(c)}
              style={{
                cursor: "pointer",
                background: isIA ? "#0d1b2a" : "#111827",
                border: isIA ? "1px solid #4285F466" : "1px solid #1E2A45",
                borderRadius: 12,
                padding: 16,
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  color: !isIA && idx < 3 ? "#FFD700" : "#8B9CC8",
                  fontWeight: 900,
                  fontSize: 18,
                  width: 32,
                  textAlign: "center",
                }}
              >
                {!isIA && idx < 3 ? medalhas[idx] : `${idx + 1}º`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 15 }}>
                  {c.participante}{" "}
                  {isIA && (
                    <span style={{ background: "#4285F4", color: "#fff", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, marginLeft: 4, verticalAlign: "middle" }}>
                      IA
                    </span>
                  )}
                  <span style={{ color: "#8B9CC8", fontWeight: 400, fontSize: 12 }}>
                    ({c.nome || "Cartela"})
                  </span>
                </div>
                <div style={{ color: "#8B9CC8", fontSize: 12, marginTop: 2 }}>
                  {c.acertos}/{c.total} acertos{" "}
                  {c.placaresExatos > 0 && (
                    <span style={{ color: "#FFD700", fontWeight: 700 }}>
                      · 🎯 {c.placaresExatos} exatos
                    </span>
                  )}
                  {c.empatesPalpitados > 0 && (
                    <span style={{ color: "#8B9CC8" }}>
                      {" "}· ={c.empatesPalpitados} empates apostados
                    </span>
                  )}
                  {" "}· Campeão: {c.campeao || "—"}{" "}
                  {c.campeao === campeoReal && campeoReal
                    ? "\u2705 +" + pontosCampeaoPorFase(c.campeao_fase || "grupos")
                    : ""}
                  <span style={{ marginLeft: 6 }}>
                    <StatusBadge status={c.status} />
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#FFD700", fontWeight: 900, fontSize: 20 }}>{c.pts}</div>
                <div style={{ color: "#8B9CC8", fontSize: 11 }}>pts</div>
              </div>
            </div>
          );

          return (
            <>
              {ranking.length > 0 ? ranking.map((c, idx) => renderCard(c, idx, false)) : (
                <div style={{ textAlign: "center", color: "#8B9CC8", padding: 40 }}>
                  Nenhuma cartela ainda
                </div>
              )}
              {iasNoRanking.length > 0 && (
                <>
                  <div style={{ color: "#8B9CC8", fontSize: 13, fontWeight: 700, marginBottom: 8, marginTop: 16, paddingTop: 12, borderTop: "1px solid #1E2A45" }}>
                    {"\uD83E\uDD16"} Bancada de IAs
                  </div>
                  {iasNoRanking.map((c, idx) => renderCard(c, idx, true))}
                </>
              )}
            </>
          );
        })()}

        <AdminPanel
          cartelas={cartelas}
          resultados={resultados}
          campeoReal={campeoReal}
          isAdmin={isAdmin}
          ultimaAtualizacao={ultimaAtualizacao}
          onValidarCartela={onValidarCartela}
          onResultadosChange={onResultadosChange}
        />
      </div>
    </div>
  );
}
