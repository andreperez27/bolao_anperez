import React, { useEffect } from "react";
import { Btn } from "../components/Btn";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { PainelFinanceiro } from "../components/PainelFinanceiro";
import { calcularPontosCartela } from "../utils/pontuacao";
import { JOGOS_TODOS } from "../services/jogos";
import { useAuth } from "../contexts/AuthContext";
import { NOMES_IA } from "../services/ia";

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(2px)",
    }} onClick={onCancel}>
      <div style={{
        background: "#111827", border: "1px solid #1E2A45", borderRadius: 16, padding: 24, maxWidth: 400, width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ color: "#F0F4FF", fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{title}</div>
        <div style={{ color: "#8B9CC8", fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            background: "transparent", border: "1px solid #1E2A45", borderRadius: 8, color: "#8B9CC8",
            padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            background: "#C8102E", border: "none", borderRadius: 8, color: "#fff",
            padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

export default function MinhasCartelas({
  cartelas,
  config,
  resultados,
  onNovaCartela,
  onVerCartela,
  onVerRanking,
  onExcluirCartela,
  onPrintCartela,
  onSair,
  onExcluirConta,
  onShowInstrucoes,
  onImportarCartela,
  onRefreshCartelas,
  onVerTabela,
}) {
  const { jogador, user } = useAuth();
  const [confirmDelete, setConfirmDelete] = React.useState(null);
  const [confirmConta, setConfirmConta] = React.useState(false);

  useEffect(() => {
    if (onRefreshCartelas) onRefreshCartelas();
  }, [onRefreshCartelas]);

  const nomeParticipante = jogador?.nome || user?.nome || "";
  const minhas = cartelas.filter((c) => c.participante === nomeParticipante);
  const valorAposta = config?.valor_aposta || 20;

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", paddingBottom: 80 }}>
      <div
        style={{
          background: "linear-gradient(135deg, #0033A0, #001a66)",
          padding: "16px 20px 14px",
          borderBottom: "2px solid #FFD700",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div
              style={{
                color: "#FFD700",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                marginBottom: 2,
              }}
            >
              BOLÃO DA COPA 2026
            </div>
            <div style={{ color: "#F0F4FF", fontSize: 20, fontWeight: 900 }}>
              Olá, {jogador?.nome}! {"\uD83D\uDC4B"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={onShowInstrucoes}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              {"\u2753"}
            </button>
            <button
              onClick={onVerRanking}
              style={{
                background: "#FFD700",
                color: "#000",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {"\uD83C\uDFC5"} Ranking
            </button>
            {onVerTabela && (
              <button
                onClick={onVerTabela}
                style={{
                  background: "transparent",
                  border: "1px solid #FFD700",
                  borderRadius: 8,
                  color: "#FFD700",
                  padding: "8px 12px",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {"\uD83D\uDCC5"} Tabela
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        <PainelFinanceiro
          totalParticipantes={cartelas.filter((c) => !NOMES_IA.includes(c.participante)).length}
          valorAposta={valorAposta}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div style={{ color: "#F0F4FF", fontWeight: 800, fontSize: 16 }}>
            Minhas Cartelas
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="file"
              accept=".html"
              id="importCartelaInput"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportarCartela(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => document.getElementById("importCartelaInput").click()}
              style={{
                background: "transparent",
                border: "1px solid #1E2A45",
                borderRadius: 8,
                color: "#8B9CC8",
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {"\uD83D\uDCC2"} Importar
            </button>
            <Btn onClick={onNovaCartela} cor="#16a34a" style={{ padding: "8px 16px", fontSize: 13 }}>
              + Nova
            </Btn>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button
            onClick={onSair}
            style={{
              flex: 1,
              background: "transparent",
              border: "1px solid #1E2A45",
              borderRadius: 8,
              color: "#8B9CC8",
              padding: "8px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {"\u2190"} Sair
          </button>
          <button
            onClick={() => setConfirmConta(true)}
            style={{
              flex: 1,
              background: "transparent",
              border: "1px solid #C8102E44",
              borderRadius: 8,
              color: "#C8102E",
              padding: "8px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Excluir conta
          </button>
        </div>

        {minhas.length === 0 && (
          <Card>
            <div style={{ textAlign: "center", color: "#8B9CC8", padding: 20 }}>
              Você ainda não tem cartelas. Clique em + Nova para criar!
            </div>
          </Card>
        )}

        {confirmDelete && (
          <ConfirmModal
            title="Excluir cartela"
            message={`Tem certeza que deseja excluir "${confirmDelete.nome || confirmDelete.id}"? A cartela pode ser restaurada pelo administrador.`}
            onConfirm={() => { onExcluirCartela(confirmDelete.id); setConfirmDelete(null); }}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
        {confirmConta && (
          <ConfirmModal
            title="Excluir conta"
            message="Tem certeza que deseja excluir sua conta? Todos os seus dados serão perdidos."
            onConfirm={() => { onExcluirConta(); setConfirmConta(false); }}
            onCancel={() => setConfirmConta(false)}
          />
        )}
        {minhas.map((c) => {
          const preenchidos = Object.keys(c.palpites || {}).filter(
            (k) => k !== "__campeo"
          ).length;
          return (
            <div
              key={c.id}
              onClick={() => onVerCartela(c)}
              style={{
                background: "#111827",
                border: "1px solid #1E2A45",
                borderRadius: 12,
                padding: 16,
                marginBottom: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 28 }}>
                  {c.status === "validada"
                    ? "\u2705"
                    : c.status === "rejeitada"
                      ? "\u274C"
                      : "\u23F3"}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 15 }}>
                  {c.nome || "Cartela"}
                </div>
                <div style={{ color: "#8B9CC8", fontSize: 12, marginTop: 2 }}>
                  {preenchidos}/{JOGOS_TODOS.length} palpites {"·"} Campeão:{" "}
                  {c.campeao || "—"}
                </div>
                <div style={{ marginTop: 4 }}>
                  <StatusBadge status={c.status} />
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrintCartela(c);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#8B9CC8",
                  fontSize: 16,
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                {"\uD83D\uDDA8\uFE0F"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(c);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#C8102E",
                  fontSize: 18,
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                {"\uD83D\uDDD1\uFE0F"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
