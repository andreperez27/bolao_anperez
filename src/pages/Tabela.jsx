import React, { useRef } from "react";
import { JOGOS_GRUPOS, JOGOS_OITAVAS, JOGOS_QUARTAS, JOGOS_SEMI, JOGOS_FINAL, ISO } from "../services/jogos";

const KO_PAIRS = [
  { label: "Oitavas de Final", jogos: JOGOS_OITAVAS },
  { label: "Quartas de Final", jogos: JOGOS_QUARTAS },
  { label: "Semifinal", jogos: JOGOS_SEMI },
  { label: "Grande Final", jogos: JOGOS_FINAL },
];

function Flag({ time }) {
  const iso = ISO[time];
  if (!iso) return null;
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt={time}
      style={{ width: 20, height: 14, borderRadius: 2, marginRight: 6, verticalAlign: "middle" }}
      onError={(e) => { e.target.style.display = "none"; }}
    />
  );
}

function ResultadoDisplay({ resultado }) {
  if (!resultado || resultado.placar_a === undefined) return <span style={{ color: "#555", fontSize: 11 }}>—</span>;
  const ga = Number(resultado.placar_a);
  const gb = Number(resultado.placar_b);
  return (
    <span style={{ fontWeight: 700, color: "#FFD700" }}>
      {ga} × {gb}
    </span>
  );
}

export default function Tabela({ resultados, campeoReal, onVoltar }) {
  const printRef = useRef(null);

  const handleDownload = () => {
    const content = printRef.current;
    if (!content) return;
    const clone = content.cloneNode(true);
    const styles = Array.from(document.styleSheets)
      .map((s) => {
        try {
          return Array.from(s.cssRules || []).map((r) => r.cssText).join("");
        } catch { return ""; }
      })
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tabela da Copa 2026</title><style>${styles}</style></head><body style="background:#fff;padding:20px">${clone.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "tabela_copa_2026.html"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={printRef} className="scroll-suave" style={{ minHeight: "100vh", background: "#0A0E1A", paddingBottom: 60 }}>

      {/* Cabeçalho */}
      <div style={{ background: "linear-gradient(135deg, #0033A0, #001a66)", padding: "16px 20px 14px", borderBottom: "2px solid #FFD700" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <button onClick={onVoltar} style={{ background: "rgba(0,0,0,0.2)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {"\u2190"} Voltar
          </button>
          <button onClick={handleDownload} style={{ background: "rgba(0,0,0,0.2)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {"\uD83D\uDDA8\uFE0F"} Download
          </button>
          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{ color: "#FFD700", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>COPA DO MUNDO 2026</div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>Tabela da Copa</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>

        {/* Grupos A-L */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i)).map((letra) => {
            const grupo = "Grupo " + letra;
            const jogos = JOGOS_GRUPOS.filter((j) => j.grupo === grupo);
            return (
              <div key={grupo} style={{ background: "#111827", border: "1px solid #1E2A45", borderRadius: 12, padding: 14 }}>
                <div style={{ color: "#FFD700", fontWeight: 800, fontSize: 14, marginBottom: 10, letterSpacing: 1 }}>
                  Grupo {letra}
                </div>
                {jogos.map((j) => {
                  const r = resultados?.[j.id];
                  return (
                    <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: "1px solid #1E2A4520", fontSize: 13 }}>
                      <span style={{ color: "#8B9CC8", fontSize: 10, minWidth: 28, textAlign: "right" }}>{j.horario_brasilia}</span>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
                        <Flag time={j.time_a} />
                        <span style={{ color: "#F0F4FF", fontWeight: 600 }}>{j.time_a}</span>
                      </div>
                      <div style={{ minWidth: 50, textAlign: "center" }}>
                        <ResultadoDisplay resultado={r} />
                      </div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                        <span style={{ color: "#F0F4FF", fontWeight: 600 }}>{j.time_b}</span>
                        <Flag time={j.time_b} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Fases Eliminatórias */}
        <div style={{ marginTop: 24 }}>
          <div style={{ color: "#FFD700", fontWeight: 800, fontSize: 16, marginBottom: 14 }}>
            {"\uD83C\uDFC6"} Fases Eliminatórias
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {KO_PAIRS.map(({ label, jogos }) => (
              <div key={label} style={{ background: "#111827", border: "1px solid #1E2A45", borderRadius: 12, padding: 14 }}>
                <div style={{ color: "#C8102E", fontWeight: 800, fontSize: 13, marginBottom: 10 }}>{label}</div>
                {jogos.map((j) => {
                  const r = resultados?.[j.id];
                  const isFinal = label === "Grande Final";
                  return (
                    <div key={j.id} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "8px 0",
                      borderBottom: "1px solid #1E2A4520", fontSize: 13,
                      background: isFinal ? "rgba(255,215,0,0.05)" : "transparent",
                      borderRadius: isFinal ? 8 : 0,
                    }}>
                      <span style={{ color: "#8B9CC8", fontSize: 10, minWidth: 28, textAlign: "right" }}>{j.horario_brasilia}</span>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "#F0F4FF", fontWeight: 600 }}>{j.time_a}</span>
                      </div>
                      <div style={{ minWidth: 50, textAlign: "center" }}>
                        <ResultadoDisplay resultado={r} />
                      </div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                        <span style={{ color: "#F0F4FF", fontWeight: 600 }}>{j.time_b}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Campeão Real */}
        {campeoReal && (
          <div style={{ marginTop: 20, background: "linear-gradient(135deg, #B8860B, #FFD700)", borderRadius: 12, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 4 }}>
              {"\uD83C\uDFC6"}
            </div>
            <div style={{ color: "#000", fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              Campeão Mundial 2026
            </div>
            <div style={{ color: "#000", fontSize: 24, fontWeight: 900 }}>
              <Flag time={campeoReal} /> {campeoReal}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
