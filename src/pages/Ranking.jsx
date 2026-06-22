import React, { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Btn } from "../components/Btn";
import { StatusBadge } from "../components/StatusBadge";
import { PainelFinanceiro } from "../components/PainelFinanceiro";
import { LegendaDesempate } from "../components/LegendaDesempate";
import { calcularPontos, pontosCampeaoPorFase } from "../utils/pontuacao";
import { GroupSelector } from "../components/GroupSelector";
import { useGrupo } from "../contexts/GrupoContext";
import { listarPredictions } from "../services/predictions";

export default function Ranking({
  resultados,
  campeoReal,
  config,
  onVoltar,
  onShowInstrucoes,
  onVerTabela,
  onVerCartela,
}) {
  const { grupoId } = useGrupo();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!grupoId) return;
    setLoading(true);
    listarPredictions(grupoId)
      .then((data) => {
        setPredictions(Array.isArray(data) ? data : []);
      })
      .catch(() => setPredictions([]))
      .finally(() => setLoading(false));
  }, [grupoId]);

  const medalhas = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];

  const ranking = Object.values(
    predictions.reduce((acc, c) => {
      let pts = 0, total = 0, acertos = 0, placaresExatos = 0, diferencasCertas = 0, vencedoresCertos = 0, empatesPalpitados = 0;
      for (const [k, v] of Object.entries(c.palpites || {})) {
        if (k === "__campeo") continue;
        total++;
        const r = resultados[k];
        const { pts: pt, tipo } = calcularPontos(v, r);
        pts += pt;
        if (tipo !== "errou" && tipo !== "pendente") acertos++;
        if (tipo === "placar_exato") placaresExatos++;
        if (tipo === "diferenca_certa") diferencasCertas++;
        if (tipo === "vencedor_certo") vencedoresCertos++;
        if (v?.gols_a !== undefined && v.gols_a === v.gols_b) empatesPalpitados++;
      }
      if (campeoReal && c.campeao_nome === campeoReal) pts += pontosCampeaoPorFase(c.campeao_fase || "grupos");
      pts += Number(config?.bonus_geral) || 0;
      const existente = acc[c.participante];
      if (!existente || pts > existente.pts) {
        acc[c.participante] = { ...c, pts, total, acertos, placaresExatos, diferencasCertas, vencedoresCertos, empatesPalpitados };
      }
      return acc;
    }, {})
  ).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.placaresExatos !== a.placaresExatos) return b.placaresExatos - a.placaresExatos;
    if (b.diferencasCertas !== a.diferencasCertas) return b.diferencasCertas - a.diferencasCertas;
    if (b.vencedoresCertos !== a.vencedoresCertos) return b.vencedoresCertos - a.vencedoresCertos;
    if (a.empatesPalpitados !== b.empatesPalpitados) return a.empatesPalpitados - b.empatesPalpitados;
    if (b.acertos !== a.acertos) return b.acertos - a.acertos;
    return (a.participante || "").localeCompare(b.participante || "", "pt-BR");
  });

  const primeiro = ranking[0] || null;
  const segundo = ranking[1] || null;
  const terceiro = ranking[2] || null;

  const participantesUnicos = new Set(predictions.map((c) => c.participante));

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFD700" }}>
        Carregando ranking...
      </div>
    );
  }

  return (
    <div className="scroll-suave" style={{ minHeight: "100vh", background: "#0A0E1A", paddingBottom: 60 }}>
      <div style={{ background: "linear-gradient(135deg, #B8860B, #FFD700)", padding: "16px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <button onClick={onVoltar} style={{ background: "rgba(0,0,0,0.25)", color: "#000", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{"\u2190"} Voltar</button>
          {onVerTabela && <button onClick={onVerTabela} style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(0,0,0,0.3)", borderRadius: 8, color: "#000", padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{"\uD83D\uDCC5"} Tabela</button>}
          <button onClick={onShowInstrucoes} style={{ background: "rgba(0,0,0,0.15)", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 18, cursor: "pointer" }}>{"\u2753"}</button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#000", fontSize: 22, fontWeight: 900 }}>{"\uD83C\uDFC5"} Ranking do Bolão</div>
          <GroupSelector />
        </div>
        <div style={{ color: "rgba(0,0,0,0.6)", fontSize: 13 }}>
          {participantesUnicos.size} participantes, {predictions.length} cartelas
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        <PainelFinanceiro totalParticipantes={participantesUnicos.size} valorAposta={config?.valor_aposta || 20} />

        {ranking.length > 0 && (
          <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", border: "1px solid #1E2A45", borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12, padding: "8px 0" }}>
              {segundo ? (
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 28 }}>{"\uD83E\uDD48"}</div>
                  <div style={{ color: "#F0F4FF", fontSize: 13, fontWeight: 800, marginTop: 4 }}>{segundo.participante}</div>
                  <div style={{ color: "#FFD700", fontSize: 18, fontWeight: 900 }}>{segundo.pts}</div>
                  <div style={{ color: "#8B9CC8", fontSize: 11 }}>pts</div>
                </div>
              ) : <div style={{ flex: 1 }} />}
              {primeiro ? (
                <div style={{ textAlign: "center", flex: 1.3 }}>
                  <div style={{ fontSize: 36 }}>{"\uD83E\uDD47"}</div>
                  <div style={{ color: "#F0F4FF", fontSize: 15, fontWeight: 800, marginTop: 4 }}>{primeiro.participante}</div>
                  <div style={{ color: "#FFD700", fontSize: 22, fontWeight: 900 }}>{primeiro.pts}</div>
                  <div style={{ color: "#8B9CC8", fontSize: 11 }}>pts</div>
                </div>
              ) : <div style={{ flex: 1.3 }} />}
              {terceiro ? (
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 28 }}>{"\uD83E\uDD49"}</div>
                  <div style={{ color: "#F0F4FF", fontSize: 13, fontWeight: 800, marginTop: 4 }}>{terceiro.participante}</div>
                  <div style={{ color: "#FFD700", fontSize: 18, fontWeight: 900 }}>{terceiro.pts}</div>
                  <div style={{ color: "#8B9CC8", fontSize: 11 }}>pts</div>
                </div>
              ) : <div style={{ flex: 1 }} />}
            </div>
          </div>
        )}

        <LegendaDesempate />

        {(() => {
          const renderCard = (c, idx) => (
            <div key={c.id} onClick={() => onVerCartela?.(c)} style={{ cursor: "pointer", background: "#111827", border: "1px solid #1E2A45", borderRadius: 12, padding: 16, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: idx < 3 ? "#FFD700" : "#8B9CC8", fontWeight: 900, fontSize: 18, width: 32, textAlign: "center" }}>{idx < 3 ? medalhas[idx] : `${idx + 1}\u00BA`}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 15 }}>{c.participante}<span style={{ color: "#8B9CC8", fontWeight: 400, fontSize: 12 }}> ({c.nome || "Cartela"})</span></div>
                <div style={{ color: "#8B9CC8", fontSize: 12, marginTop: 2 }}>{c.acertos}/{c.total} acertos {c.placaresExatos > 0 && <span style={{ color: "#FFD700", fontWeight: 700 }}> \u00B7 \uD83C\uDFAF {c.placaresExatos} exatos</span>}{c.empatesPalpitados > 0 && <span style={{ color: "#8B9CC8" }}> \u00B7 ={c.empatesPalpitados} empates apostados</span>} \u00B7 Campe\u00E3o: {c.campeao_nome || "\u2014"} {c.campeao_nome === campeoReal && campeoReal ? " \u2705 +" + pontosCampeaoPorFase(c.campeao_fase || "grupos") : ""}{c.vice_campeao_nome ? ` \u00B7 Vice: ${c.vice_campeao_nome}` : ""}{c.artilheiro_nome ? ` \u00B7 Art: ${c.artilheiro_nome}` : ""}<span style={{ marginLeft: 6 }}><StatusBadge status={c.status} /></span></div>
              </div>
              <div style={{ textAlign: "right" }}><div style={{ color: "#FFD700", fontWeight: 900, fontSize: 20 }}>{c.pts}</div><div style={{ color: "#8B9CC8", fontSize: 11 }}>pts</div></div>
            </div>
          );

          return (
            <>
              {ranking.length > 0 ? ranking.map((c, idx) => renderCard(c, idx)) : <div style={{ textAlign: "center", color: "#8B9CC8", padding: 40 }}>Nenhuma cartela ainda</div>}
            </>
          );
        })()}

      </div>
    </div>
  );
}
