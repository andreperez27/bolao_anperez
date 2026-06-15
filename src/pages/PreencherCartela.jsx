import React, { useState, useEffect } from "react";
import { Card } from "../components/Card";
import { Btn } from "../components/Btn";
import { JogoCard } from "../components/JogoCard";
import {
  JOGOS_GRUPOS,
  JOGOS_1_16,
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

const CORES_IA_BTN = {
  "🤖 Gemini (Google)": { cor: "#4285F4", label: "Gemini" },
  "🤖 ChatGPT (OpenAI)": { cor: "#10a37f", label: "ChatGPT" },
  "🤖 Claude (Anthropic)": { cor: "#d97706", label: "Claude" },
};

export default function PreencherCartela({ cartela, resultados, config, onSalvar, onVoltar, onPrintCartela }) {
  const { jogador, user } = useAuth();
  const nomeUsuario = jogador?.nome || user?.nome || "";
  const isDono = !cartela?.participante || cartela.participante === nomeUsuario;

  const [nomeCartela, setNomeCartela] = useState(cartela?.nome || "");
  const [palpites, setPalpites] = useState(cartela?.palpites || {});
  const [campeao, setCampeao] = useState(cartela?.campeao || "");
  const [grupoAtivo, setGrupoAtivo] = useState("Grupo A");
  const [iaCartelas, setIaCartelas] = useState([]);
  const [campeaoTravado, setCampeaoTravado] = useState(false);

  const faseAtual = getFaseAtual(resultados);

  useEffect(() => {
    listarCartelasIA().then(setIaCartelas).catch(() => {});
  }, []);

  useEffect(() => {
    if (cartela?.id && faseAtual !== "grupos" && faseAtual !== (cartela?.campeao_fase || "grupos")) {
      setCampeaoTravado(true);
    } else {
      setCampeaoTravado(false);
    }
  }, [cartela?.id, cartela?.campeao_fase, faseAtual]);

  const fasesParaMostrar = [
    "Grupo A","Grupo B","Grupo C","Grupo D",
    "Grupo E","Grupo F","Grupo G","Grupo H",
    "Grupo I","Grupo J","Grupo K","Grupo L",
    "Segunda Rodada","Oitavas","Quartas","Semi","Final",
  ];

  const isNew = !cartela?.id;
  const valorAposta = config?.valor_aposta || 20;
  const pontosCampeaoAtual = pontosCampeaoPorFase(cartela?.campeao_fase || faseAtual);
  const pontosCampeaoSeMudar = pontosCampeaoPorFase(faseAtual);

  const handlePalpite = (jogoId, valor) => {
    setPalpites((prev) => ({ ...prev, [jogoId]: valor }));
  };

  const handleImportarIA = (iaCartela) => {
    const iaPts = iaCartela.palpites || {};
    const novos = {};
    let count = 0;
    for (const [jogoId, valor] of Object.entries(iaPts)) {
      if (jogoId === "__campeo") continue;
      const jogo = JOGOS_TODOS.find((j) => j.id === jogoId);
      if (jogo && isJogoBloqueado(jogo)) continue;
      novos[jogoId] = valor;
      count++;
    }
    if (count === 0) {
      alert("Nenhum palpite disponível para importar (todos os jogos já iniciaram).");
      return;
    }
    const campeaoIA = iaCartela.campeao || "";
    setPalpites(novos);
    setCampeao(campeaoIA);
    if (!window.confirm(
      `Criar nova cartela baseada em ${iaCartela.participante} com ${count} palpites?\n\n` +
      `Isso substituirá qualquer edição não salva no formulário.`
    )) return;
    onSalvar({
      nome: `${nomeCartela || nomeUsuario} (IA ${iaCartela.participante.split(" ")[1]})`,
      palpites: novos,
      campeao: campeaoIA,
      campeao_fase: campeaoIA ? faseAtual : undefined,
    });
  };

  const handleUnlockCampeao = () => {
    const ptsAtuais = pontosCampeaoAtual;
    const ptsNovos = pontosCampeaoSeMudar;
    const diff = ptsAtuais - ptsNovos;
    if (!window.confirm(
      `O campeão está travado porque a ${faseLabel} já começou.\n\n` +
      `Pontos atuais: ${ptsAtuais} pts\n` +
      `Se desbloquear e mudar: ${ptsNovos} pts (${diff > 0 ? `perda de ${diff}` : "mantém"} pts)\n\n` +
      `Deseja desbloquear?`
    )) return;
    setCampeaoTravado(false);
  };

  const handleSalvar = () => {
    const palpitesFiltrados = { ...(cartela?.palpites || {}) };
    for (const [jogoId, valor] of Object.entries(palpites)) {
      const jogo = JOGOS_TODOS.find((j) => j.id === jogoId);
      if (!jogo || !isJogoBloqueado(jogo)) {
        palpitesFiltrados[jogoId] = valor;
      }
    }

    let novaCampeaoFase = cartela?.campeao_fase;
    if (!novaCampeaoFase) {
      novaCampeaoFase = campeao ? faseAtual : undefined;
    } else if (campeao !== cartela?.campeao && campeaoTravado === false) {
      novaCampeaoFase = faseAtual;
    }

    onSalvar({
      ...cartela,
      nome: nomeCartela.trim() || "Cartela",
      palpites: palpitesFiltrados,
      campeao,
      campeao_fase: novaCampeaoFase,
    });
  };

  const jogosPorGrupo = (grupo) => {
    if (grupo.startsWith("Grupo")) return JOGOS_GRUPOS.filter((j) => j.grupo === grupo);
    if (grupo === "Segunda Rodada") return JOGOS_1_16;
    if (grupo === "Oitavas") return JOGOS_OITAVAS;
    if (grupo === "Quartas") return JOGOS_QUARTAS;
    if (grupo === "Semi") return JOGOS_SEMI;
    if (grupo === "Final") return JOGOS_FINAL;
    return [];
  };

  const totalJogos = (() => {
    let t = JOGOS_GRUPOS.length;
    if (faseAtual !== "grupos") t += JOGOS_1_16.length;
    if (faseAtual !== "grupos") t += JOGOS_OITAVAS.length;
    if (["quartas", "semi", "final"].includes(faseAtual)) t += JOGOS_QUARTAS.length;
    if (["semi", "final"].includes(faseAtual)) t += JOGOS_SEMI.length;
    if (faseAtual === "final") t += JOGOS_FINAL.length;
    return t;
  })();

  const totalPalpitados = Object.keys(palpites).filter((k) => k !== "__campeo").length;

  const faseLabelParaExibir = (f) => f === "grupos" ? "Fase de Grupos"
    : f === "1_16" ? "Segunda Rodada"
    : f === "oitavas" ? "Oitavas"
    : f === "quartas" ? "Quartas"
    : f === "semi" ? "Semifinal"
    : "Final";

  const faseLabel = faseAtual === "grupos" ? "Fase de Grupos"
    : faseAtual === "1_16" ? "Segunda Rodada"
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

        <Card style={{ marginBottom: 14 }}>
          <div style={{ color: "#8B9CC8", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
            Nome da Cartela
          </div>
          <input
            value={nomeCartela}
            onChange={(e) => setNomeCartela(e.target.value)}
            disabled={!isDono}
            placeholder="Ex: Cartela do João"
            maxLength={60}
            style={{
              width: "100%",
              background: "#1a2234",
              border: "2px solid #1E2A45",
              borderRadius: 8,
              color: "#F0F4FF",
              padding: "10px 12px",
              fontSize: 15,
            }}
          />
        </Card>

        <Card style={{ marginBottom: 14, border: "2px solid #FFD70044" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ color: "#FFD700", fontWeight: 800, fontSize: 14 }}>
              {"\uD83C\uDFC6"} Campeão +{pontosCampeaoAtual} pts
            </span>
            <span style={{ color: "#8B9CC8", fontSize: 12, fontWeight: 400 }}>
              ({cartela?.campeao_fase ? `${pontosCampeaoPorFase(cartela.campeao_fase)} pts na ${faseLabelParaExibir(cartela.campeao_fase)}` : faseLabel})
            </span>
            {campeaoTravado && isDono && (
              <button
                onClick={handleUnlockCampeao}
                title="Clique para desbloquear (reduz pontos)"
                style={{
                  background: "transparent",
                  border: "1px solid #FFD70044",
                  borderRadius: 6,
                  color: "#FFD700",
                  fontSize: 16,
                  cursor: "pointer",
                  padding: "4px 8px",
                  marginLeft: "auto",
                }}
              >
                {"\uD83D\uDD12"}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={campeao}
              onChange={(e) => setCampeao(e.target.value)}
              disabled={!isDono || campeaoTravado}
              style={{
                flex: 1,
                background: "#1a2234",
                border: `2px solid ${campeaoTravado ? "#C8102E" : campeao ? "#FFD700" : "#1E2A45"}`,
                borderRadius: 8,
                color: campeaoTravado ? "#C8102E" : campeao ? "#FFD700" : "#8B9CC8",
                padding: "10px 12px",
                fontSize: 15,
                fontWeight: campeao ? 700 : 400,
                cursor: campeaoTravado ? "not-allowed" : "pointer",
                opacity: campeaoTravado ? 0.6 : 1,
              }}
            >
              <option value="">Selecione o campeão...</option>
              {TODOS_TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {campeaoTravado && (
            <div style={{ color: "#C8102E", fontSize: 11, marginTop: 6, textAlign: "center" }}>
              {"\uD83D\uDD12"} Travado — {faseLabel} já começou. Clique no cadeado para desbloquear (pontos caem para {pontosCampeaoSeMudar} pts).
            </div>
          )}
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

        {isDono && iaCartelas.length > 0 && (
          <Card style={{ marginBottom: 14, border: "1px solid #4285F444" }}>
            <div style={{ color: "#8B9CC8", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
              {"\uD83D\uDCA1"} Importar palpites das IAs
            </div>
            <div style={{ color: "#8B9CC8", fontSize: 11, marginBottom: 10 }}>
              Copia apenas palpites de jogos ainda não iniciados.
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {iaCartelas.map((ia) => {
                const c = CORES_IA_BTN[ia.participante] || { cor: "#8B9CC8", label: "IA" };
                return (
                  <button
                    key={ia.participante}
                    onClick={() => handleImportarIA(ia)}
                    style={{
                      background: c.cor + "22",
                      border: "1px solid " + c.cor + "66",
                      borderRadius: 8,
                      color: c.cor,
                      padding: "8px 16px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {"\u2B07"} {c.label}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

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
