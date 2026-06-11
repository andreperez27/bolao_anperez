import React, { useState } from "react";
import { Btn } from "./Btn";

export function ModalInstrucoes({ onFechar }) {
  const [fechando, setFechando] = useState(false);
  const handleFechar = () => {
    setFechando(true);
    setTimeout(onFechar, 200);
  };

  return (
    <div
      onClick={handleFechar}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "overlayIn .2s ease",
        opacity: fechando ? 0 : 1,
        transition: "opacity .2s",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="scroll-suave"
        style={{
          background: "#111827",
          border: "1px solid #1E2A45",
          borderRadius: 16,
          padding: 28,
          maxWidth: 420,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          animation: "fadeIn .25s ease",
          transform: fechando ? "scale(0.95)" : "scale(1)",
          transition: "transform .2s, opacity .2s",
          opacity: fechando ? 0 : 1,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ color: "#FFD700", fontWeight: 900, fontSize: 18 }}>
            {"\uD83D\uDCCB"} Regras do Bolão
          </div>
          <button
            onClick={handleFechar}
            style={{
              background: "transparent",
              border: "none",
              color: "#8B9CC8",
              fontSize: 22,
              cursor: "pointer",
              padding: 4,
            }}
          >
            {"\u2715"}
          </button>
        </div>
        <div style={{ color: "#F0F4FF", fontSize: 14, lineHeight: 1.7 }}>
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: "#0d1b2a",
              borderRadius: 8,
              borderLeft: "3px solid #FFD700",
            }}
          >
            <strong style={{ color: "#FFD700" }}>{"\uD83D\uDCB0"} Cartela Fechada</strong>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginTop: 4 }}>
              Cada <strong style={{ color: "#F0F4FF" }}>Cartela</strong> contém palpites para todos os jogos
              da Fase de Grupos + palpite do campeão. Você pode ter{" "}
              <strong style={{ color: "#FFD700" }}>múltiplas cartelas</strong> para aumentar suas chances!
              Cada cartela precisa ser <strong style={{ color: "#16a34a" }}>validada pelo administrador</strong>{" "}
              após o pagamento.
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong style={{ color: "#22c55e" }}>{"\u26BD"} Pontuação por Jogo</strong>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6, fontSize: 13 }}>
              <span>
                <span style={{ color: "#FFD700", fontWeight: 700 }}>5 pts</span> {"—"} Placar Exato
              </span>
              <span>
                <span style={{ color: "#22c55e", fontWeight: 700 }}>4 pts</span> {"—"} Diferença Certa (vitórias)
              </span>
              <span>
                <span style={{ color: "#16a34a", fontWeight: 700 }}>3 pts</span> {"—"} Vencedor ou Empate
              </span>
              <span>
                <span style={{ color: "#C8102E", fontWeight: 700 }}>0 pts</span> {"—"} Erro
              </span>
            </div>
          </div>
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: "#0d1b2a",
              borderRadius: 8,
              borderLeft: "3px solid #FFD700",
            }}
          >
            <strong style={{ color: "#FFD700" }}>{"\uD83C\uDFC6"} Campeão: Pontuação Progressiva</strong>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginTop: 4 }}>
              Os pontos por acertar o campeão dependem de quando você salvou o palpite:
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                marginTop: 6,
                fontSize: 12,
                color: "#8B9CC8",
              }}
            >
              <span>
                {"\u2022"} Fase de Grupos: <strong style={{ color: "#FFD700" }}>20 pts</strong>
              </span>
              <span>
                {"\u2022"} Oitavas de Final: <strong style={{ color: "#FFD700" }}>15 pts</strong>
              </span>
              <span>
                {"\u2022"} Quartas de Final: <strong style={{ color: "#FFD700" }}>10 pts</strong>
              </span>
              <span>
                {"\u2022"} Semifinais: <strong style={{ color: "#FFD700" }}>5 pts</strong>
              </span>
              <span>
                {"\u2022"} Final: <strong style={{ color: "#FFD700" }}>2 pts</strong>
              </span>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong style={{ color: "#F0F4FF" }}>{"\uD83C\uDFC5"} Premiação</strong>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginTop: 6,
                fontSize: 13,
                color: "#8B9CC8",
              }}
            >
              <span>
                {"\uD83E\uDD47"} 1º {"—"}{" "}
                <strong style={{ color: "#FFD700" }}>60%</strong>
              </span>
              <span>
                {"\uD83E\uDD48"} 2º {"—"}{" "}
                <strong style={{ color: "#F0F4FF" }}>25%</strong>
              </span>
              <span>
                {"\uD83E\uDD49"} 3º {"—"}{" "}
                <strong style={{ color: "#f97316" }}>15%</strong>
              </span>
            </div>
          </div>
        </div>
        <Btn onClick={handleFechar} cor="#FFD700" style={{ width: "100%", color: "#000", marginTop: 8 }}>
          Entendi! {"\u2192"}
        </Btn>
      </div>
    </div>
  );
}
