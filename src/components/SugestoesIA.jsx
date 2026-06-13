import React from "react";

const CORES_IA = {
  "🤖 Gemini (Google)":   { cor: "#4285F4", bg: "#0d1b33" },
  "🤖 ChatGPT (OpenAI)":  { cor: "#10a37f", bg: "#0d1f16" },
  "🤖 Claude (Anthropic)":{ cor: "#d97706", bg: "#1f1406" },
};

export default function SugestoesIA({ iaCartelas, jogoId }) {
  if (!iaCartelas || iaCartelas.length === 0) return null;

  const palpites = [];
  for (const c of iaCartelas) {
    const p = c.palpites?.[jogoId];
    if (p && p.gols_a !== undefined && p.gols_b !== undefined) {
      palpites.push({ ia: c.participante, ga: p.gols_a, gb: p.gols_b });
    }
  }
  if (palpites.length === 0) return null;

  return (
    <div style={{ marginTop: 10, padding: "8px 12px", background: "#0d1117", borderRadius: 8, border: "1px solid #1E2A45" }}>
      <div style={{ color: "#8B9CC8", fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 }}>
        {"\uD83D\uDCA1"} Bancada de IAs
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {palpites.map(({ ia, ga, gb }) => {
          const c = CORES_IA[ia] || { cor: "#8B9CC8", bg: "#111827" };
          return (
            <div
              key={ia}
              style={{
                background: c.bg,
                border: "1px solid " + c.cor + "44",
                borderRadius: 6,
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
              }}
            >
              <span style={{ color: c.cor, fontWeight: 600, fontSize: 11 }}>{ia.split(" ")[0]}</span>
              <span style={{ color: "#F0F4FF", fontWeight: 700 }}>
                {ga}×{gb}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
