import React, { useState, useEffect } from "react";
import { Card } from "../components/Card";
import { Btn } from "../components/Btn";
import { JogoCard } from "../components/JogoCard";
import {
  JOGOS_GRUPOS,
  JOGOS_OITAVAS,
  JOGOS_QUARTAS,
  JOGOS_SEMI,
  JOGOS_FINAL,
  JOGOS_TODOS,
  TODOS_TIMES,
} from "../services/jogos";
import { getFaseAtual, pontosCampeaoPorFase } from "../utils/pontuacao";
import { isJogoBloqueado } from "../utils/datas";
import { listarCartelasIA } from "../services/ia";
import SugestoesIA from "../components/SugestoesIA";
import { useAuth } from "../contexts/AuthContext";

export default function PreencherCartela({ cartela, resultados, config, onSalvar, onVoltar, onPrintCartela }) {
  const { jogador, user } = useAuth();
  const nomeUsuario = jogador?.nome || user?.nome || "";
  const isDono = !cartela?.participante || cartela.participante === nomeUsuario;

  const [palpites, setPalpites] = useState(cartela?.palpites || {});
  const [campeao, setCampeao] = useState(cartela?.campeao || "");
  const [grupoAtivo, setGrupoAtivo] = useState("Grupo A");
  const [iaCartelas, setIaCartelas] = useState([]);

  useEffect(() => {
    listarCartelasIA().then(setIaCartelas).catch(() => {});
  }, []);
  const faseAtual = getFaseAtual(resultados);

  const fasesParaMostrar = [
    "Grupo A","Grupo B","Grupo C","Grupo D",
    "Grupo E","Grupo F","Grupo G","Grupo H",
    "Grupo I","Grupo J","Grupo K","Grupo L",
    "Oitavas","Quartas","Semi","Final",
  ];

  const isNew = !cartela?.id;
  const valorAposta = config?.valor_aposta || 20;
  const pontosCampeao = pontosCampeaoPorFase(faseAtual);

  const handlePalpite = (jogoId, valor) => {
    setPalpites((prev) => ({ ...prev, [jogoId]: valor }));
  };

  const handleSalvar = () => {
    const palpitesFiltrados = { ...(cartela?.palpites || {}) };
    for (const [jogoId, valor] of Object.entries(palpites)) {
      const jogo = JOGOS_TODOS.find((j) => j.id === jogoId);
      if (!jogo || !isJogoBloqueado(jogo)) {
        palpitesFiltrados[jogoId] = valor;
      }
    }

    onSalvar({
      ...cartela,
      palpites: palpitesFiltrados,
      campeao,
      campeao_fase: cartela?.campeao_fase || (campeao ? faseAtual : undefined),
    });
  };

  const jogosPorGrupo = (grupo) => {
    if (grupo.startsWith("Grupo")) return JOGOS_GRUPOS.filter((j) => j.grupo === grupo);
    if (grupo === "Oitavas") return JOGOS_OITAVAS;
    if (grupo === "Quartas") return JOGOS_QUARTAS;
    if (grupo === "Semi") return JOGOS_SEMI;
    if (grupo === "Final") return JOGOS_FINAL;
    return [];
  };

  const totalJogos = (() => {
    let t = JOGOS_GRUPOS.length;
    if (faseAtual !== "grupos") t += JOGOS_OITAVAS.length;
    if (["quartas", "semi", "final"].includes(faseAtual)) t += JOGOS_QUARTAS.length;
    if (["semi", "final"].includes(faseAtual)) t += JOGOS_SEMI.length;
    if (faseAtual === "final") t += JOGOS_FINAL.length;
    return t;
  })();

  const totalPalpitados = Object.keys(palpites).filter((k) => k !== "__campeo").length;

  const faseLabel = faseAtual === "grupos" ? "Fase de Grupos"
    : faseAtual === "oitavas" ? "Oitavas"
    : faseAtual === "quartas" ? "Quartas"
    : faseAtual === "semi" ? "Semifinal"
    : "Final";

  return (
    <div className="scroll-suave" style={{ minHeight: "100vh", background: "#0A0E1A", paddingBottom: 80 }}>
      <div
        style={{
          background: "linear-gradient(135deg, #16a34a, #0d6b2a)",
          padding: "14px 20px",
          borderBottom: "2px solid #FFD700",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <button
            onClick={onVoltar}
            style={{
              background: "rgba(0,0,0,0.2)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {"\u2190"} Voltar
          </button>
          {!isNew && (
            <button
              onClick={() => onPrintCartela(cartela)}
              style={{
                background: "rgba(0,0,0,0.2)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              {"\uD83D\uDDA8\uFE0F"}
            </button>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>
              {cartela?.nome || "Nova Cartela"}
              {!isDono && <span style={{ color: "#8B9CC8", fontSize: 11, fontWeight: 400, marginLeft: 8 }}>de {cartela?.participante}</span>}
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              {isNew ? "Nova" : "Editando"} {"·"} R$ {valorAposta.toFixed(2).replace(".", ",")}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        {cartela?.status === "validada" && (
          <div
            style={{
              background: "#0d3320",
              border: "1px solid #16a34a44",
              color: "#4ade80",
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 14,
              fontSize: 12,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {"\u2705"} Cartela validada — pagamento confirmado.
            Você ainda pode editar palpites de jogos não iniciados.
          </div>
        )}
        {cartela?.status === "aguardando" && !isNew && (
          <div
            style={{
              background: "#1a1a00",
              border: "1px solid #FFD70044",
              color: "#FFD700",
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 14,
              fontSize: 12,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {"\u23F3"} Aguardando validação do pagamento pelo administrador.
          </div>
        )}

        <Card style={{ marginBottom: 14, border: "2px solid #FFD70044" }}>
          <div style={{ color: "#FFD700", fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
            {"\uD83C\uDFC6"} Campeão +{pontosCampeao} pts ({faseLabel})
          </div>
          <select
            value={campeao}
            onChange={(e) => setCampeao(e.target.value)}
            disabled={!isDono}
            style={{
              width: "100%",
              background: "#1a2234",
              border: `2px solid ${campeao ? "#FFD700" : "#1E2A45"}`,
              borderRadius: 8,
              color: campeao ? "#FFD700" : "#8B9CC8",
              padding: "10px 12px",
              fontSize: 15,
              fontWeight: campeao ? 700 : 400,
              cursor: "pointer",
            }}
          >
            <option value="">Selecione o campeão...</option>
            {TODOS_TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Card>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ color: "#8B9CC8", fontSize: 13, alignSelf: "center" }}>Fase:</span>
          {fasesParaMostrar.map((g) => (
            <button
              key={g}
              onClick={() => setGrupoAtivo(g)}
              style={{
                flexShrink: 0,
                background: grupoAtivo === g ? "#FFD700" : "#111827",
                color: grupoAtivo === g ? "#000" : "#8B9CC8",
                border: `1px solid ${grupoAtivo === g ? "#FFD700" : "#1E2A45"}`,
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {g.replace("Grupo ", "")}
            </button>
          ))}
        </div>

        <div
          style={{
            color: "#8B9CC8",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 10,
            letterSpacing: 1,
          }}
        >
          {grupoAtivo.toUpperCase()}
        </div>

        {jogosPorGrupo(grupoAtivo).map((jogo) => (
          <div key={jogo.id}>
              <JogoCard
                jogo={jogo}
                palpite={palpites[jogo.id]}
                resultado={resultados?.[jogo.id]}
                onChange={handlePalpite}
                disabled={!isDono}
              />
            <SugestoesIA iaCartelas={iaCartelas} jogoId={jogo.id} />
          </div>
        ))}

        <div style={{ marginTop: 16, marginBottom: 24 }}>
          <div
            style={{
              color: "#8B9CC8",
              fontSize: 13,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            {totalPalpitados} de {totalJogos} palpites preenchidos
          </div>
          {isDono ? (
            <Btn
              onClick={handleSalvar}
              cor="#16a34a"
              style={{ width: "100%", fontSize: 16 }}
              disabled={false}
            >
              {isNew ? "Criar Cartela" : "Salvar Cartela"}
            </Btn>
          ) : (
            <div style={{ textAlign: "center", color: "#8B9CC8", fontSize: 13, marginTop: 8 }}>
              {"\uD83D\uDC41"} Visualizando cartela de <strong>{cartela?.participante}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
