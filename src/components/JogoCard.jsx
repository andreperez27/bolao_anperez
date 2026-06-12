import React, { useState, useEffect } from "react";
import { Flag } from "./Flag";
import { isJogoBloqueado } from "../utils/datas";
import { calcularPontos } from "../utils/pontuacao";

const FRASES_FEEDBACK = {
  placar_exato: {
    emoji: "🎯",
    cor: "#FFD700",
    borda: "#FFD700",
    fundo: "#1a1500",
    frase: (pts) => `Placar exato! Você fez ${pts} pontos — incrível! 🏆`,
  },
  diferenca_certa: {
    emoji: "⚽",
    cor: "#22c55e",
    borda: "#22c55e44",
    fundo: "#0d1f12",
    frase: (pts) => `Diferença certa! ${pts} pontos para você — muito bem! 👏`,
  },
  vencedor_certo: {
    emoji: "✅",
    cor: "#3b82f6",
    borda: "#3b82f644",
    fundo: "#0d1220",
    frase: (pts) => `Vencedor certo! Você garantiu ${pts} pontos. Continue assim! 💪`,
  },
  errou: {
    emoji: "😬",
    cor: "#C8102E",
    borda: "#C8102E44",
    fundo: "#1a0d0d",
    frase: () => `Que pena, neste jogo não deu. Boa sorte nos próximos! 🍀`,
  },
};

export function JogoCard({ jogo, palpite, resultado, onChange, disabled }) {
  const [ga, setGa] = useState(palpite?.gols_a ?? "");
  const [gb, setGb] = useState(palpite?.gols_b ?? "");

  useEffect(() => {
    setGa(palpite?.gols_a ?? "");
    setGb(palpite?.gols_b ?? "");
  }, [palpite]);

  const handle = (side, val) => {
    const n = val === "" ? "" : Math.max(0, Math.min(99, parseInt(val) || 0));
    const newGa = side === "a" ? n : ga;
    const newGb = side === "b" ? n : gb;
    if (side === "a") setGa(n);
    else setGb(n);
    if (newGa !== "" && newGb !== "") onChange(jogo.id, { gols_a: Number(newGa), gols_b: Number(newGb) });
  };

  const salvo = palpite?.gols_a !== undefined;
  const bloqueado = disabled || isJogoBloqueado(jogo);

  const feedback = (palpite?.gols_a !== undefined && resultado)
    ? calcularPontos(palpite, resultado)
    : null;

  const badge = (txt, bg) => (
    <span
      style={{
        background: bg,
        color: "#fff",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
      }}
    >
      {txt}
    </span>
  );

  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1E2A45",
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        opacity: bloqueado ? 0.65 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        {badge(jogo.grupo, "#0033A0")}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {bloqueado && <span style={{ fontSize: 11, color: "#C8102E", fontWeight: 700 }}>{"\uD83D\uDD12"}</span>}
          <span style={{ color: "#8B9CC8", fontSize: 12 }}>{jogo.horario_brasilia} {jogo.estadio && <span style={{color:"#6B7CA8",fontSize:10,marginLeft:4}}>{jogo.estadio}</span>}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <Flag pais={jogo.time_a} size={28} />
          <div style={{ color: "#F0F4FF", fontSize: 13, fontWeight: 700, marginTop: 4 }}>{jogo.time_a}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            max="99"
            value={ga}
            onChange={(e) => handle("a", e.target.value)}
            disabled={bloqueado}
            style={{
              width: 48,
              textAlign: "center",
              fontSize: 20,
              fontWeight: 800,
              background: "#1a2234",
              border: `2px solid ${salvo && !bloqueado ? "#16a34a" : bloqueado ? "#C8102E66" : "#1E2A45"}`,
              borderRadius: 8,
              color: bloqueado ? "#8B9CC8" : "#F0F4FF",
              padding: "6px 0",
            }}
          />
          <span style={{ color: "#8B9CC8", fontSize: 18, fontWeight: 700 }}>{"×"}</span>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            max="99"
            value={gb}
            onChange={(e) => handle("b", e.target.value)}
            disabled={bloqueado}
            style={{
              width: 48,
              textAlign: "center",
              fontSize: 20,
              fontWeight: 800,
              background: "#1a2234",
              border: `2px solid ${salvo && !bloqueado ? "#16a34a" : bloqueado ? "#C8102E66" : "#1E2A45"}`,
              borderRadius: 8,
              color: bloqueado ? "#8B9CC8" : "#F0F4FF",
              padding: "6px 0",
            }}
          />
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <Flag pais={jogo.time_b} size={28} />
          <div style={{ color: "#F0F4FF", fontSize: 13, fontWeight: 700, marginTop: 4 }}>{jogo.time_b}</div>
        </div>
      </div>

      {feedback && feedback.tipo !== "pendente" && (() => {
        const f = FRASES_FEEDBACK[feedback.tipo];
        if (!f) return null;
        return (
          <div
            style={{
              marginTop: 12,
              padding: "8px 12px",
              borderRadius: 8,
              background: f.fundo,
              border: `1px solid ${f.borda}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>{f.emoji}</span>
            <div style={{ flex: 1 }}>
              <span style={{ color: f.cor, fontSize: 12, fontWeight: 700 }}>
                {f.frase(feedback.pts)}
              </span>
            </div>
            <div
              style={{
                background: f.cor,
                color: f.cor === "#FFD700" ? "#000" : "#fff",
                borderRadius: 999,
                padding: "2px 10px",
                fontSize: 13,
                fontWeight: 900,
                minWidth: 36,
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              {feedback.pts}pts
            </div>
          </div>
        );
      })()}

      {resultado && resultado.placar_a !== undefined && (
        <div
          style={{
            textAlign: "center",
            marginTop: 6,
            color: "#8B9CC8",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          Resultado: {resultado.placar_a} × {resultado.placar_b}
        </div>
      )}
    </div>
  );
}