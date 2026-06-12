import React, { useState } from "react";

export function LegendaDesempate() {
  const [mostrar, setMostrar] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <button
        onClick={() => setMostrar(v => !v)}
        style={{
          width: "100%",
          background: "transparent",
          border: "1px solid #1E2A45",
          borderRadius: 8,
          color: "#8B9CC8",
          padding: "8px 12px",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>ℹ️ Critérios de desempate</span>
        <span>{mostrar ? "▲" : "▼"}</span>
      </button>
      {mostrar && (
        <div
          style={{
            background: "#111827",
            border: "1px solid #1E2A45",
            borderRadius: "0 0 8px 8px",
            padding: "10px 14px",
            fontSize: 12,
            color: "#8B9CC8",
            lineHeight: 1.8,
          }}
        >
          <div>1. <span style={{color:"#F0F4FF"}}>Maior pontuação total</span></div>
          <div>2. <span style={{color:"#FFD700"}}>🎯 Mais placares exatos (5pts)</span></div>
          <div>3. <span style={{color:"#22c55e"}}>⚽ Mais diferenças certas (4pts)</span></div>
          <div>4. <span style={{color:"#3b82f6"}}>✅ Mais vencedores certos (3pts)</span></div>
          <div>5. <span style={{color:"#F0F4FF"}}>Menos empates apostados</span></div>
          <div>6. <span style={{color:"#F0F4FF"}}>Mais jogos pontuados</span></div>
          <div>7. <span style={{color:"#8B9CC8"}}>Ordem alfabética</span></div>
        </div>
      )}
    </div>
  );
}
