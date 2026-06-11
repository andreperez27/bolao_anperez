import React from "react";
import { baixarCartelaHTML } from "../utils/baixarCartela";

export function PrintArea({ cartela, participante, onDone }) {
  if (!cartela) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{
        background: "#111827", border: "1px solid #1E2A45", borderRadius: 16,
        padding: 32, maxWidth: 400, width: "100%", textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{"\uD83D\uDCC4"}</div>
        <div style={{ color: "#FFD700", fontWeight: 900, fontSize: 18, marginBottom: 8 }}>
          Baixar Cartela
        </div>
        <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
          Será baixado um arquivo <strong>.html</strong> com a sua cartela.
          Abra o arquivo e use <strong>Ctrl+P</strong> (ou Cmd+P) para imprimir ou salvar como PDF.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              baixarCartelaHTML(cartela, participante);
              if (onDone) onDone();
            }}
            style={{
              flex: 1, background: "#0033A0", color: "#fff", border: "none",
              borderRadius: 8, padding: "12px 20px", fontWeight: 700, fontSize: 15,
              cursor: "pointer",
            }}
          >
            {"\u2B07"} Baixar Cartela
          </button>
          <button
            onClick={() => { if (onDone) onDone(); }}
            style={{
              background: "transparent", border: "1px solid #1E2A45",
              borderRadius: 8, padding: "12px 16px", color: "#8B9CC8",
              fontSize: 14, cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
