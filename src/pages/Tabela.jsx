import React, { useMemo, useRef } from "react";
import { JOGOS_GRUPOS, JOGOS_OITAVAS, JOGOS_QUARTAS, JOGOS_SEMI, JOGOS_FINAL, ISO } from "../services/jogos";

const GRUPOS = Array.from({ length: 12 }, (_, i) => "Grupo " + String.fromCharCode(65 + i));

function Flag({ time, w = 20 }) {
  const iso = ISO[time];
  if (!iso) return null;
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt={time}
      style={{ width: w, height: (w * 14) / 20, borderRadius: 2, marginRight: 6, verticalAlign: "middle", flexShrink: 0 }}
      onError={(e) => { e.target.style.display = "none"; }}
    />
  );
}

function calcularClassificacao(jogos, resultados) {
  const stats = {};
  jogos.forEach((j) => {
    const res = resultados?.[j.id];
    if (res?.placar_a === undefined || res?.placar_b === undefined) return;
    const ga = Number(res.placar_a);
    const gb = Number(res.placar_b);
    [j.time_a, j.time_b].forEach((t) => {
      if (!stats[t]) stats[t] = { V: 0, E: 0, D: 0, GP: 0, GC: 0, PTS: 0 };
    });
    stats[j.time_a].GP += ga; stats[j.time_a].GC += gb;
    stats[j.time_b].GP += gb; stats[j.time_b].GC += ga;
    if (ga > gb) { stats[j.time_a].V++; stats[j.time_a].PTS += 3; stats[j.time_b].D++; }
    else if (gb > ga) { stats[j.time_b].V++; stats[j.time_b].PTS += 3; stats[j.time_a].D++; }
    else { stats[j.time_a].E++; stats[j.time_b].E++; stats[j.time_a].PTS++; stats[j.time_b].PTS++; }
  });
  return Object.entries(stats)
    .map(([time, s]) => ({ time, ...s, SG: s.GP - s.GC }))
    .sort((a, b) => b.PTS - a.PTS || b.SG - a.SG || b.GP - a.GP);
}

function resolverAvancos(estatisticasMap) {
  const adv = {};
  GRUPOS.forEach((g, i) => {
    const letra = String.fromCharCode(65 + i);
    const t = estatisticasMap.get(g);
    if (t && t.length >= 2) {
      adv[`1${letra}`] = t[0].time;
      adv[`2${letra}`] = t[1].time;
    }
  });
  return adv;
}

function resolverOitavas(oitavas, avancos, resultados) {
  const map = {};
  oitavas.forEach((j) => {
    const ta = avancos[j.time_a] || j.time_a;
    const tb = avancos[j.time_b] || j.time_b;
    const res = resultados?.[j.id];
    map[j.id] = { ...j, time_a: ta, time_b: tb, res };
    if (res?.placar_a !== undefined && res?.placar_b !== undefined) {
      const ga = Number(res.placar_a), gb = Number(res.placar_b);
      if (ga !== gb) map[`V ${j.id.replace("oit", "Oit")}`] = ga > gb ? ta : tb;
    }
  });
  return map;
}

function resolverQuartas(quartas, oitavasResolvidas, resultados) {
  const map = {};
  quartas.forEach((j) => {
    const ta = oitavasResolvidas[j.time_a] || j.time_a;
    const tb = oitavasResolvidas[j.time_b] || j.time_b;
    const res = resultados?.[j.id];
    map[j.id] = { ...j, time_a: ta, time_b: tb, res };
    if (res?.placar_a !== undefined && res?.placar_b !== undefined) {
      const ga = Number(res.placar_a), gb = Number(res.placar_b);
      if (ga !== gb) map[`V ${j.id.replace("qua", "Qua")}`] = ga > gb ? ta : tb;
    }
  });
  return map;
}

function resolverSemifinal(semis, quartasResolvidas, resultados) {
  const map = {};
  semis.forEach((j) => {
    const ta = quartasResolvidas[j.time_a] || j.time_a;
    const tb = quartasResolvidas[j.time_b] || j.time_b;
    const res = resultados?.[j.id];
    map[j.id] = { ...j, time_a: ta, time_b: tb, res };
    if (res?.placar_a !== undefined && res?.placar_b !== undefined) {
      const ga = Number(res.placar_a), gb = Number(res.placar_b);
      if (ga !== gb) map[`V ${j.id.replace("sem", "Sem")}`] = ga > gb ? ta : tb;
    }
  });
  return map;
}

function resolverFinal(finais, semisResolvidas, resultados) {
  const map = {};
  finais.forEach((j) => {
    const ta = semisResolvidas[j.time_a] || j.time_a;
    const tb = semisResolvidas[j.time_b] || j.time_b;
    const res = resultados?.[j.id];
    map[j.id] = { ...j, time_a: ta, time_b: tb, res };
  });
  return map;
}

function PlacarDisplay({ res }) {
  if (!res?.placar_a === undefined || res?.placar_b === undefined) return <span style={{ color: "#555", fontSize: 11 }}>—</span>;
  const ga = Number(res.placar_a), gb = Number(res.placar_b);
  return <span style={{ fontWeight: 700, color: "#FFD700" }}>{ga}×{gb}</span>;
}

function GrupoTabela({ letra, classificacao, jogos, resultados }) {
  return (
    <div style={{ background: "#111827", border: "1px solid #1E2A45", borderRadius: 12, overflow: "hidden" }}>
      <div style={{
        background: "linear-gradient(90deg, #0033A0, #001a66)", padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 8, borderBottom: "2px solid #FFD700"
      }}>
        <Flag time={classificacao[0]?.time} w={22} />
        <span style={{ color: "#FFD700", fontWeight: 800, fontSize: 14, letterSpacing: 1, flex: 1 }}>
          {letra}
        </span>
        {classificacao.length === 4 && (
          <span style={{ color: "#8B9CC8", fontSize: 10 }}>
            {classificacao[0]?.time?.slice(0, 10)}{classificacao[0]?.time?.length > 10 ? "…" : ""} / {classificacao[1]?.time?.slice(0, 10)}{classificacao[1]?.time?.length > 10 ? "…" : ""}
          </span>
        )}
      </div>

      {classificacao.length > 0 && (
        <div style={{ padding: "8px 10px", borderBottom: "1px solid #1E2A4520" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ color: "#8B9CC8", fontSize: 9, textTransform: "uppercase" }}>
                <th style={{ textAlign: "left", padding: "2px 4px", fontWeight: 600 }}>#</th>
                <th style={{ textAlign: "left", padding: "2px 4px", fontWeight: 600 }}>Time</th>
                <th style={{ textAlign: "center", padding: "2px 4px", fontWeight: 600 }}>P</th>
                <th style={{ textAlign: "center", padding: "2px 4px", fontWeight: 600 }}>V</th>
                <th style={{ textAlign: "center", padding: "2px 4px", fontWeight: 600 }}>E</th>
                <th style={{ textAlign: "center", padding: "2px 4px", fontWeight: 600 }}>D</th>
                <th style={{ textAlign: "center", padding: "2px 4px", fontWeight: 600 }}>GP</th>
                <th style={{ textAlign: "center", padding: "2px 4px", fontWeight: 600 }}>GC</th>
                <th style={{ textAlign: "center", padding: "2px 4px", fontWeight: 600 }}>SG</th>
              </tr>
            </thead>
            <tbody>
              {classificacao.map((t, i) => (
                <tr key={t.time} style={{
                  color: i < 2 ? "#F0F4FF" : "#8B9CC8",
                  fontWeight: i < 2 ? 700 : 400,
                  background: i < 2 ? "rgba(0,51,160,0.08)" : "transparent"
                }}>
                  <td style={{ padding: "3px 4px" }}>{i + 1}</td>
                  <td style={{ padding: "3px 4px", display: "flex", alignItems: "center", gap: 4 }}>
                    <Flag time={t.time} w={14} />
                    <span>{t.time}</span>
                  </td>
                  <td style={{ textAlign: "center", padding: "3px 4px", fontWeight: 800, color: "#FFD700" }}>{t.PTS}</td>
                  <td style={{ textAlign: "center", padding: "3px 4px" }}>{t.V}</td>
                  <td style={{ textAlign: "center", padding: "3px 4px" }}>{t.E}</td>
                  <td style={{ textAlign: "center", padding: "3px 4px" }}>{t.D}</td>
                  <td style={{ textAlign: "center", padding: "3px 4px" }}>{t.GP}</td>
                  <td style={{ textAlign: "center", padding: "3px 4px" }}>{t.GC}</td>
                  <td style={{ textAlign: "center", padding: "3px 4px", fontWeight: 600 }}>{t.SG > 0 ? "+" : ""}{t.SG}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ padding: "6px 10px" }}>
        {jogos.map((j) => {
          const r = resultados?.[j.id];
          return (
            <div key={j.id} style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 0",
              borderBottom: "1px solid #1E2A4510", fontSize: 12
            }}>
              <span style={{ color: "#8B9CC8", fontSize: 9, minWidth: 24, textAlign: "right", flexShrink: 0 }}>{j.horario_brasilia}</span>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 3, overflow: "hidden" }}>
                <Flag time={j.time_a} w={13} />
                <span style={{ color: "#F0F4FF", fontWeight: 500, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.time_a}</span>
              </div>
              <div style={{ minWidth: 40, textAlign: "center", flexShrink: 0 }}>
                <PlacarDisplay res={r} />
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end", overflow: "hidden" }}>
                <span style={{ color: "#F0F4FF", fontWeight: 500, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.time_b}</span>
                <Flag time={j.time_b} w={13} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KOCard({ jogo, campeao }) {
  const isFinal = jogo.id === "fin-1";
  const vencedor = (jogo.res?.placar_a !== undefined && jogo.res?.placar_b !== undefined)
    ? (Number(jogo.res.placar_a) > Number(jogo.res.placar_b) ? jogo.time_a
      : Number(jogo.res.placar_b) > Number(jogo.res.placar_a) ? jogo.time_b : null)
    : null;
  return (
    <div style={{
      background: isFinal ? "linear-gradient(135deg, #B8860B, #FFD700)" : "#111827",
      border: isFinal ? "2px solid #FFD700" : "1px solid #1E2A45",
      borderRadius: 10, padding: "8px 10px", textAlign: "center",
      boxShadow: isFinal ? "0 0 20px rgba(255,215,0,0.2)" : "none",
    }}>
      <div style={{ color: isFinal ? "#000" : "#C8102E", fontWeight: 800, fontSize: 10, marginBottom: 4, letterSpacing: 1 }}>
        {jogo.grupo.toUpperCase()}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 4 }}>
        <div style={{ flex: 1, textAlign: "right" }}>
          <span style={{
            color: vencedor === jogo.time_a ? (isFinal ? "#000" : "#FFD700") : (isFinal ? "#333" : "#8B9CC8"),
            fontWeight: vencedor === jogo.time_a ? 800 : 500, fontSize: 12,
          }}>{jogo.time_a}</span>
        </div>
        <div style={{ minWidth: 36, textAlign: "center", padding: "2px 6px", background: isFinal ? "rgba(0,0,0,0.15)" : "#0d1b2a", borderRadius: 4 }}>
          <PlacarDisplay res={jogo.res} />
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <span style={{
            color: vencedor === jogo.time_b ? (isFinal ? "#000" : "#FFD700") : (isFinal ? "#333" : "#8B9CC8"),
            fontWeight: vencedor === jogo.time_b ? 800 : 500, fontSize: 12,
          }}>{jogo.time_b}</span>
        </div>
      </div>
      <div style={{ color: isFinal ? "#000" : "#8B9CC8", fontSize: 9 }}>{jogo.horario_brasilia}</div>
    </div>
  );
}

function BracketRound({ label, jogos, campeao }) {
  return (
    <div style={{ flex: 1, minWidth: 160 }}>
      <div style={{ color: "#C8102E", fontWeight: 800, fontSize: 11, marginBottom: 8, textAlign: "center", letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {jogos.map((j) => <KOCard key={j.id} jogo={j} campeao={campeao} />)}
      </div>
    </div>
  );
}

export default function Tabela({ resultados, campeoReal, onVoltar }) {
  const printRef = useRef(null);

  const { classificacaoMap, avancos, oitavasResolved, quartasResolved, semisResolved, finalResolved } = useMemo(() => {
    const map = new Map();
    GRUPOS.forEach((g) => {
      const jogos = JOGOS_GRUPOS.filter((j) => j.grupo === g);
      map.set(g, calcularClassificacao(jogos, resultados));
    });
    const avanc = resolverAvancos(map);
    const oRes = resolverOitavas(JOGOS_OITAVAS, avanc, resultados);
    const qRes = resolverQuartas(JOGOS_QUARTAS, oRes, resultados);
    const sRes = resolverSemifinal(JOGOS_SEMI, qRes, resultados);
    const fRes = resolverFinal(JOGOS_FINAL, sRes, resultados);
    return {
      classificacaoMap: map,
      avancos: avanc,
      oitavasResolved: Object.values(oRes),
      quartasResolved: Object.values(qRes),
      semisResolved: Object.values(sRes),
      finalResolved: Object.values(fRes),
    };
  }, [resultados]);

  const handleDownload = () => {
    const content = printRef.current;
    if (!content) return;
    const clone = content.cloneNode(true);
    const styles = Array.from(document.styleSheets)
      .map((s) => { try { return Array.from(s.cssRules || []).map((r) => r.cssText).join(""); } catch { return ""; } })
      .filter(Boolean)
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tabela da Copa 2026</title><style>${styles}</style></head><body style="background:#fff;padding:20px;font-family:Arial,sans-serif">${clone.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "tabela_copa_2026.html"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={printRef} className="scroll-suave" style={{ minHeight: "100vh", background: "#0A0E1A", paddingBottom: 60 }}>

      <div style={{ background: "linear-gradient(135deg, #0033A0, #001a66)", padding: "16px 20px 14px", borderBottom: "2px solid #FFD700" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <button onClick={onVoltar} style={{ background: "rgba(0,0,0,0.2)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ← Voltar
          </button>
          <button onClick={handleDownload} style={{ background: "#FFD700", color: "#000", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 15 }}>⬇</span> Download HTML
          </button>
          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{ color: "#FFD700", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>COPA DO MUNDO 2026</div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>Tabela da Copa</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 16px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {GRUPOS.map((g) => {
            const letra = g.replace("Grupo ", "");
            const jogos = JOGOS_GRUPOS.filter((j) => j.grupo === g);
            const classif = classificacaoMap.get(g) || [];
            return <GrupoTabela key={g} letra={g} classificacao={classif} jogos={jogos} resultados={resultados} />;
          })}
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ color: "#FFD700", fontWeight: 800, fontSize: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🏆</span> Fases Eliminatórias
          </div>
          <div style={{
            display: "flex", gap: 12, overflowX: "auto", paddingBottom: 10,
            justifyContent: "space-between", flexWrap: "nowrap"
          }}>
            <BracketRound label="OITAVAS DE FINAL" jogos={oitavasResolved} campeao={campeoReal} />
            <BracketRound label="QUARTAS DE FINAL" jogos={quartasResolved} campeao={campeoReal} />
            <BracketRound label="SEMIFINAL" jogos={semisResolved} campeao={campeoReal} />
            <BracketRound label="GRANDE FINAL" jogos={finalResolved} campeao={campeoReal} />
          </div>
        </div>

        {campeoReal && (
          <div style={{ marginTop: 24, background: "linear-gradient(135deg, #B8860B, #FFD700)", borderRadius: 14, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>🏆</div>
            <div style={{ color: "#000", fontSize: 14, fontWeight: 800, marginBottom: 6, letterSpacing: 1 }}>
              CAMPEÃO MUNDIAL 2026
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Flag time={campeoReal} w={32} />
              <span style={{ color: "#000", fontSize: 24, fontWeight: 900 }}>{campeoReal}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
