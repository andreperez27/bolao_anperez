import React, { useState, useEffect, useMemo, useRef } from "react";
import { Flag } from "../components/Flag";
import { useGrupo } from "../contexts/GrupoContext";
import { getFasesComPartidas } from "../services/competitions";

function isPlaceholder(nome) {
  if (!nome) return true;
  return /^\d/.test(nome) || /^V\s+\w+/.test(nome) || /^[12]º/.test(nome) || nome.startsWith("1/");
}

function calcularClassificacao(matches, resultados) {
  const times = {};
  const validos = (matches || []).filter(m =>
    m.time_a_nome && !isPlaceholder(m.time_a_nome) &&
    m.time_b_nome && !isPlaceholder(m.time_b_nome)
  );
  for (const m of validos) {
    if (!times[m.time_a_nome]) times[m.time_a_nome] = { time: m.time_a_nome, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0, PTS: 0 };
    if (!times[m.time_b_nome]) times[m.time_b_nome] = { time: m.time_b_nome, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0, PTS: 0 };
  }
  for (const m of validos) {
    const res = resultados?.[m.id];
    if (res?.placar_a === null || res?.placar_a === undefined) continue;
    const ga = Number(res.placar_a), gb = Number(res.placar_b);
    const a = times[m.time_a_nome], b = times[m.time_b_nome];
    if (!a || !b) continue;
    a.J++; b.J++;
    a.GP += ga; a.GC += gb; a.SG = a.GP - a.GC;
    b.GP += gb; b.GC += ga; b.SG = b.GP - b.GC;
    if (ga > gb) { a.V++; a.PTS += 3; b.D++; }
    else if (ga < gb) { b.V++; b.PTS += 3; a.D++; }
    else { a.E++; a.PTS++; b.E++; b.PTS++; }
  }
  return Object.values(times).sort((a, b) =>
    b.PTS - a.PTS || b.SG - a.SG || b.GP - a.GP || a.time.localeCompare(b.time, "pt-BR")
  );
}

function vencedorDe(m) {
  if (!m?.res) return null;
  const ga = Number(m.res.placar_a), gb = Number(m.res.placar_b);
  if (isNaN(ga) || isNaN(gb) || ga === gb) return null;
  return ga > gb ? m.time_a : m.time_b;
}

function buildBracket(stages, resultados) {
  const groups = (stages || []).filter(s => s.stage_tipo === "groups");
  const knockouts = (stages || []).filter(s => s.stage_tipo === "knockout");
  const bracket = {};
  const advanceMap = {};

  for (const stage of groups) {
    const letra = (stage.stage_slug || "").replace("grupo_", "").toUpperCase();
    const classif = calcularClassificacao(stage.partidas || [], resultados);
    if (classif.length >= 1) advanceMap["1" + letra] = classif[0].time;
    if (classif.length >= 2) advanceMap["2" + letra] = classif[1].time;
    if (classif.length >= 3) advanceMap["3" + letra] = classif[2].time;
  }

  for (const stage of knockouts) {
    const resolved = (stage.partidas || []).map(m => {
      const timeA = advanceMap[m.time_a_nome] || m.time_a_nome;
      const timeB = advanceMap[m.time_b_nome] || m.time_b_nome;
      const res = resultados?.[m.id];
      return { ...m, time_a: timeA, time_b: timeB, res };
    });

    for (const m of resolved) {
      const v = vencedorDe(m);
      if (v) {
        if (m.slug) advanceMap["V " + m.slug] = v;
        const parts = (m.slug || "").match(/^(.+?)-?(\d+)$/);
        if (parts) {
          const root = parts[1];
          const num = parts[2];
          advanceMap["V " + root + num] = v;
          advanceMap["V " + root.charAt(0).toUpperCase() + root.slice(1) + num] = v;
        }
      }
    }

    bracket[stage.stage_slug] = resolved;
  }

  return { bracket, groups, knockouts };
}

function normalizarPartida(m) {
  let horarioBrasilia = "";
  if (m.data_iso && m.horario) {
    try {
      const d = new Date(m.data_iso + "T" + m.horario + ":00");
      horarioBrasilia = String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + " " + m.horario;
    } catch {
      horarioBrasilia = m.data_iso + " " + m.horario;
    }
  }
  return { ...m, time_a: m.time_a_nome, time_b: m.time_b_nome, horario_brasilia: horarioBrasilia };
}

function gerarHTMLDownload(innerHtml, titulo, temporada, campeoReal) {
  const data = new Date().toLocaleDateString("pt-BR");
  return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>' + titulo + ' — Bolão ANPEREZ</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#0A0E1A;color:#F0F4FF;font-family:Arial,Helvetica,sans-serif;padding:16px;}img{display:inline-block;vertical-align:middle;}table{border-collapse:collapse;width:100%;}</style></head><body><div style="text-align:center;padding:20px 0 24px;border-bottom:2px solid #FFD700;margin-bottom:20px;"><div style="color:#FFD700;font-size:11px;font-weight:700;letter-spacing:3px;">' + titulo.toUpperCase() + '</div><div style="color:#F0F4FF;font-size:26px;font-weight:900;">Tabela Oficial</div><div style="color:#8B9CC8;font-size:11px;margin-top:6px;">Bolão ANPEREZ · ' + data + (campeoReal ? ' · 🏆 ' + campeoReal : "") + '</div></div>' + innerHtml + '<div style="text-align:center;padding:24px;color:#4B5563;font-size:10px;margin-top:20px;">Horários em BRT (Brasília) · Bolão ANPEREZ ' + temporada + '</div></body></html>';
}

function GrupoCard({ stage, resultados }) {
  const letra = (stage.stage_slug || "").replace("grupo_", "").toUpperCase();
  const matches = (stage.partidas || []).filter(m => m.time_a_nome && m.time_b_nome);
  const classif = useMemo(() => calcularClassificacao(matches, resultados), [matches, resultados]);

  return (
    <div style={{ background: "#111827", border: "1px solid #1E2A45", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d2a5e 70%, #0a1628 100%)", padding: "10px 12px 10px", borderBottom: "2px solid rgba(255,215,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <div style={{ width: 3, height: 14, background: "#FFD700", borderRadius: 2, flexShrink: 0 }} />
          <span style={{ color: "#FFD700", fontWeight: 900, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>GRUPO {letra}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {classif.map((t, i) => (
            <div key={t.time} style={{ display: "flex", alignItems: "center", gap: 7, background: i < 2 ? "rgba(22,163,74,0.15)" : "rgba(255,255,255,0.04)", border: i < 2 ? "1px solid rgba(22,163,74,0.3)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "5px 8px" }}>
              <Flag pais={t.time} size={20} />
              {i < 2 && <span style={{ fontSize: 8, background: "#16a34a", color: "#fff", borderRadius: 3, padding: "1px 4px", fontWeight: 700, flexShrink: 0, lineHeight: 1.6 }}>✓</span>}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9, color: "#4B5563", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ display: "inline-block", width: 8, height: 8, background: "#16a34a", borderRadius: 2 }} />
          Classificado para as oitavas
        </div>
      </div>

      <div style={{ borderBottom: "1px solid #1E2A45" }}>
        {matches.map(j => {
          const res = resultados?.[j.id];
          const ok = res?.placar_a !== null && res?.placar_a !== undefined;
          const h = normalizarPartida(j);
          return (
            <div key={j.id} style={{ display: "grid", gridTemplateColumns: "1fr 58px 1fr", alignItems: "center", padding: "5px 10px", borderBottom: "1px solid rgba(30,42,69,0.35)", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end", minWidth: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#F0F4FF", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.time_a}</span>
                <Flag pais={h.time_a} size={13} />
              </div>
              <div style={{ textAlign: "center" }}>
                {ok ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                    <span style={{ background: "#0A0E1A", border: "1px solid #1E2A45", borderRadius: 4, width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#FFD700" }}>{res.placar_a}</span>
                    <span style={{ color: "#4B5563", fontSize: 9 }}>×</span>
                    <span style={{ background: "#0A0E1A", border: "1px solid #1E2A45", borderRadius: 4, width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#FFD700" }}>{res.placar_b}</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 8, color: "#4B5563", fontWeight: 700, letterSpacing: 0.3, lineHeight: 1.4 }}>{h.horario_brasilia.split(" ")[0] || h.data_iso}</div>
                    <div style={{ fontSize: 11, color: "#8B9CC8", fontWeight: 800 }}>{h.horario_brasilia.split(" ")[1] || h.horario}</div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                <Flag pais={h.time_b} size={13} />
                <span style={{ fontSize: 10, fontWeight: 600, color: "#F0F4FF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.time_b}</span>
              </div>
            </div>
          );
        })}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
        <thead>
          <tr style={{ background: "rgba(0,51,160,0.15)" }}>
            <th colSpan={2} style={{ padding: "4px 4px 4px 8px", textAlign: "left", color: "#4B5563", fontSize: 8, fontWeight: 700, letterSpacing: 1 }}>CLASSIFICAÇÃO</th>
            {["J","V","E","D","GP","GC","SG"].map(h => (
              <th key={h} style={{ padding: "4px 3px", textAlign: "center", color: "#4B5563", fontSize: 8, fontWeight: 700 }}>{h}</th>
            ))}
            <th style={{ padding: "4px 5px 4px 3px", textAlign: "center", color: "#FFD700", fontSize: 8, fontWeight: 700 }}>PTS</th>
          </tr>
        </thead>
        <tbody>
          {classif.map((r, i) => (
            <tr key={r.time} style={{ borderBottom: "1px solid rgba(30,42,69,0.25)", background: i < 2 ? "rgba(22,163,74,0.04)" : "transparent" }}>
              <td style={{ padding: "5px 3px 5px 0", borderLeft: "3px solid " + (i < 2 ? "#16a34a" : "transparent"), width: 18, textAlign: "center", color: i < 2 ? "#22c55e" : "#4B5563", fontWeight: 900, fontSize: 9 }}>{i + 1}</td>
              <td style={{ padding: "5px 4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Flag pais={r.time} size={13} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: i < 2 ? "#F0F4FF" : "#8B9CC8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90, display: "block" }}>{r.time}</span>
                </div>
              </td>
              {[r.J, r.V, r.E, r.D, r.GP, r.GC, r.SG].map((v, ci) => (
                <td key={ci} style={{ padding: "5px 3px", textAlign: "center", color: "#8B9CC8", fontWeight: 600, fontSize: 10 }}>{ci === 6 && v > 0 ? "+" + v : v}</td>
              ))}
              <td style={{ padding: "5px 5px 5px 3px", textAlign: "center", fontWeight: 900, fontSize: 13, color: "#FFD700" }}>{r.PTS}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KoJogo({ jogo, resultados, isFinal }) {
  const res = resultados?.[jogo.id];
  const ok = res?.placar_a !== null && res?.placar_a !== undefined;
  const hora = normalizarPartida(jogo);

  const lados = [
    { nome: jogo.time_a, gol: ok ? res.placar_a : null },
    { nome: jogo.time_b, gol: ok ? res.placar_b : null },
  ];
  const vencedor = ok && Number(res.placar_a) !== Number(res.placar_b)
    ? (Number(res.placar_a) > Number(res.placar_b) ? jogo.time_a : jogo.time_b)
    : null;

  return (
    <div style={{ background: "#111827", border: "1px solid " + (isFinal ? "#FFD700" : "#1E2A45"), borderRadius: 10, overflow: "hidden", boxShadow: isFinal ? "0 0 20px rgba(255,215,0,0.12)" : "none" }}>
      <div style={{ padding: "3px 8px", fontSize: 9, textAlign: "center", fontWeight: 700, letterSpacing: 0.5, background: isFinal ? "rgba(255,215,0,0.12)" : "rgba(0,51,160,0.2)", color: isFinal ? "#FFD700" : "#8B9CC8" }}>{hora.horario_brasilia}</div>
      {lados.map((l, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", borderBottom: i === 0 ? "1px solid rgba(30,42,69,0.5)" : "none", background: l.nome === vencedor ? "rgba(255,215,0,0.05)" : "transparent" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
            {!isPlaceholder(l.nome) && <Flag pais={l.nome} size={14} />}
            <span style={{ fontSize: 11, fontWeight: l.nome === vencedor ? 800 : 600, color: l.nome === vencedor ? "#FFD700" : "#F0F4FF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.nome}</span>
          </div>
          <div style={{ background: "#0A0E1A", border: "1px solid #1E2A45", borderRadius: 4, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 8, fontWeight: 900, fontSize: 12, color: l.gol !== null ? (isFinal ? "#FFD700" : l.nome === vencedor ? "#22c55e" : "#F0F4FF") : "#4B5563" }}>
            {l.gol !== null ? l.gol : "\u00B7"}
          </div>
        </div>
      ))}
    </div>
  );
}

const STAGE_LABEL = {
  "1_16": "SEGUNDA RODADA", "oitavas": "OITAVAS DE FINAL",
  "quartas": "QUARTAS DE FINAL", "semi": "SEMIFINAIS",
  "disputa_3": "DISPUTA DO 3\u00BA LUGAR", "final": "GRANDE FINAL",
};

export default function Tabela({ resultados, campeoReal, onVoltar }) {
  const { edition } = useGrupo();
  const editionId = edition?.edition_id || edition?.id;
  const editionNome = edition?.edition_nome || "Bolão";
  const temporada = edition?.temporada || "";

  const tabelaRef = useRef(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!editionId) return;
    setLoading(true);
    getFasesComPartidas(editionId)
      .then(data => { setStages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [editionId]);

  const { bracket, groups, knockouts } = useMemo(
    () => buildBracket(stages, resultados),
    [stages, resultados]
  );

  const finalSlug = knockouts.find(s => s.stage_slug === "final");
  const finalMatch = finalSlug?.partidas?.[0];
  const finalTerminou = finalMatch
    ? (resultados?.[finalMatch.id]?.placar_a !== null && resultados?.[finalMatch.id]?.placar_a !== undefined)
    : false;

  const handleDownload = () => {
    const html = tabelaRef.current?.innerHTML || "";
    const doc = gerarHTMLDownload(html, editionNome, temporada, campeoReal);
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tabela-" + (edition?.edition_slug || "bolao") + (finalTerminou ? "-final" : "") + ".html";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B9CC8" }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", paddingBottom: 80 }}>
      <div style={{ background: "linear-gradient(135deg, #0A1628, #0d2145, #0A1628)", borderBottom: "3px solid #FFD700", padding: "12px 16px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 960, margin: "0 auto" }}>
          <button onClick={onVoltar} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "#F0F4FF", padding: "7px 12px", cursor: "pointer", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {"\u2190"} Voltar
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#FFD700", fontSize: 9, fontWeight: 700, letterSpacing: 2 }}>{editionNome.toUpperCase()}</div>
            <div style={{ color: "#F0F4FF", fontSize: 17, fontWeight: 900, lineHeight: 1.1 }}>Tabela</div>
          </div>
          <button onClick={handleDownload} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, background: finalTerminou ? "linear-gradient(135deg, #B8860B, #FFD700)" : "rgba(0,51,160,0.5)", border: finalTerminou ? "none" : "1px solid #0033A0", color: finalTerminou ? "#000" : "#F0F4FF", fontWeight: 700, fontSize: 12, padding: "7px 14px", borderRadius: 999, cursor: "pointer", boxShadow: finalTerminou ? "0 0 16px rgba(255,215,0,0.3)" : "none" }}>
            {finalTerminou ? "\uD83C\uDFC6 Recordação" : "\uD83D\uDCE5 Baixar"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px 14px" }}>
        {campeoReal && finalTerminou && (
          <div style={{ background: "linear-gradient(135deg, #1a1200, #2a1f00)", border: "2px solid #FFD700", borderRadius: 16, padding: "20px", marginBottom: 20, textAlign: "center", boxShadow: "0 0 40px rgba(255,215,0,0.15)" }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>{"\uD83C\uDFC6"}</div>
            <div style={{ color: "#FFD700", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Campeão {temporada}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Flag pais={campeoReal} size={40} />
              <span style={{ fontSize: 26, fontWeight: 900, color: "#FFD700" }}>{campeoReal}</span>
            </div>
          </div>
        )}

        <div ref={tabelaRef}>
          {groups.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>{"\u26BD"}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#FFD700", letterSpacing: 1.5 }}>FASE DE GRUPOS</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 32 }}>
                {groups.map(s => (
                  <GrupoCard key={s.stage_slug} stage={s} resultados={resultados} />
                ))}
              </div>
            </>
          )}

          {knockouts.map(stage => {
            const slug = stage.stage_slug;
            const matches = bracket[slug] || [];
            const isFinal = slug === "final";
            const label = STAGE_LABEL[slug] || (stage.stage_nome || slug).toUpperCase();
            if (matches.length === 0) return null;
            return (
              <div key={slug}>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1.5, color: isFinal ? "#FFD700" : "#F0F4FF", borderLeft: "4px solid " + (isFinal ? "#FFD700" : "#0033A0"), paddingLeft: 10, marginTop: 28, marginBottom: 12 }}>
                  {isFinal ? "\uD83C\uDFC6 " + label : label}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {matches.map(j => (
                    <KoJogo key={j.id} jogo={j} resultados={resultados} isFinal={isFinal} />
                  ))}
                </div>
              </div>
            );
          })}

          {groups.length > 0 && (
            <div style={{ color: "#4B5563", fontSize: 9, marginTop: 20, textAlign: "center", letterSpacing: 0.5 }}>
              Horários em BRT (Brasília) · {"\u2713"} classificado para as oitavas · Bolão ANPEREZ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
