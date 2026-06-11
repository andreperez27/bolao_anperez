import React from "react";
import { formatarMoeda } from "../utils/datas";

export function PainelFinanceiro({ totalParticipantes, valorAposta }) {
  const v = valorAposta || 20;
  const acumulado = totalParticipantes * v;
  if (totalParticipantes === 0) return null;
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0d1b2a, #1b2838)",
        border: "2px solid #FFD70044",
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ color: "#FFD700", fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>
          Caixa Acumulado
        </span>
        <span style={{ color: "#FFD700", fontSize: 20, fontWeight: 900 }}>
          {formatarMoeda(acumulado)}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          fontSize: 12,
          color: "#8B9CC8",
          marginBottom: 4,
        }}
      >
        <span>
          1º: <strong style={{ color: "#FFD700" }}>{formatarMoeda(acumulado * 0.6)}</strong> (60%)
        </span>
        <span>
          2º: <strong style={{ color: "#F0F4FF" }}>{formatarMoeda(acumulado * 0.25)}</strong> (25%)
        </span>
        <span>
          3º: <strong style={{ color: "#f97316" }}>{formatarMoeda(acumulado * 0.15)}</strong> (15%)
        </span>
      </div>
      <div
        style={{
          color: "#8B9CC8",
          fontSize: 11,
          borderTop: "1px solid #1E2A45",
          paddingTop: 6,
          marginTop: 4,
        }}
      >
        {totalParticipantes} cartela{totalParticipantes !== 1 ? "s" : ""} {"×"} {formatarMoeda(v)}
      </div>
    </div>
  );
}
