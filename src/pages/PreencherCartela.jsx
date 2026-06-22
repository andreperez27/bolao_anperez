import React, { useState, useEffect, useMemo } from "react";
import { Card } from "../components/Card";
import { Btn } from "../components/Btn";
import { JogoCard } from "../components/JogoCard";
import { getFaseAtual, pontosCampeaoPorFase, pontosVicePorFase, PONTOS_ARTILHEIRO, PONTOS_COMBO } from "../utils/pontuacao";
import { isJogoBloqueado } from "../utils/datas";
import { listarCartelasIA } from "../services/ia";
import SugestoesIA from "../components/SugestoesIA";
import { useAuth } from "../contexts/AuthContext";
import { useGrupo } from "../contexts/GrupoContext";
import { listarTimesEdicao, getFasesComPartidas } from "../services/competitions";

const CORES_IA_BTN = {
  "🤖 Gemini (Google)": { cor: "#4285F4", label: "Gemini" },
  "🤖 ChatGPT (OpenAI)": { cor: "#10a37f", label: "ChatGPT" },
  "🤖 Claude (Anthropic)": { cor: "#d97706", label: "Claude" },
};

const LABEL_MAP = {
  "1_16": "Segunda Rodada", "oitavas": "Oitavas", "quartas": "Quartas",
  "semi": "Semi", "disputa_3": "3º Lugar", "final": "Final",
};

const TAB_LABEL_MAP = {
  "1_16": "1/16", "oitavas": "Oit.", "quartas": "Quartas",
  "semi": "Semi", "disputa_3": "3º", "final": "Final",
};

const FASE_ORDEM = ["grupos", "1_16", "oitavas", "quartas", "semi", "final"];

function tabLabel(stageSlug) {
  if (stageSlug.startsWith("grupo_")) return stageSlug.slice(6).toUpperCase();
  return TAB_LABEL_MAP[stageSlug] || stageSlug;
}

function headingLabel(stageSlug) {
  if (stageSlug.startsWith("grupo_")) return "Grupo " + stageSlug.slice(6).toUpperCase();
  return LABEL_MAP[stageSlug] || stageSlug;
}

function normalizarPartida(m) {
  let horarioBrasilia = "";
  if (m.data_iso && m.horario) {
    try {
      const d = new Date(m.data_iso + "T" + m.horario + ":00");
      horarioBrasilia = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${m.horario}`;
    } catch {
      horarioBrasilia = `${m.data_iso} ${m.horario}`;
    }
  }
  return {
    ...m,
    id: m.id,
    time_a: m.time_a_nome,
    time_b: m.time_b_nome,
    grupo: m.grupo_letra ? "Grupo " + m.grupo_letra : "",
    horario_brasilia: horarioBrasilia,
    data_iso: m.data_iso,
  };
}

export default function PreencherCartela({ cartela, resultados, config, onSalvar, onVoltar, onPrintCartela }) {
  const { jogador, user } = useAuth();
  const { edition } = useGrupo();
  const nomeUsuario = jogador?.nome || user?.nome || "";
  const isDono = !cartela?.participante || cartela.participante === nomeUsuario;

  const editionId = edition?.edition_id || edition?.id;

  const [times, setTimes] = useState([]);
  const [stages, setStages] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [loadingDados, setLoadingDados] = useState(true);

  const [nomeCartela, setNomeCartela] = useState(cartela?.nome || "");
  const [palpites, setPalpites] = useState(cartela?.palpites || {});
  const [campeaoId, setCampeaoId] = useState(cartela?.campeao_id || "");
  const [viceCampeaoId, setViceCampeaoId] = useState(cartela?.vice_campeao_id || "");
  const [artilheiroNome, setArtilheiroNome] = useState(cartela?.artilheiro_nome || "");
  const [artilheiroSelecao, setArtilheiroSelecao] = useState(cartela?.artilheiro_selecao || "");
  const [grupoAtivo, setGrupoAtivo] = useState("");
  const [iaCartelas, setIaCartelas] = useState([]);
  const [campeaoTravado, setCampeaoTravado] = useState(false);

  useEffect(() => {
    if (!editionId) return;
    setLoadingDados(true);
    Promise.all([
      listarTimesEdicao(editionId),
      getFasesComPartidas(editionId),
    ]).then(([timesData, stagesData]) => {
      const t = Array.isArray(timesData) ? timesData : [];
      const s = Array.isArray(stagesData) ? stagesData : [];
      setTimes(t);
      setStages(s);
      const flat = [];
      for (const st of s) {
        if (Array.isArray(st.partidas)) {
          for (const p of st.partidas) {
            flat.push({ ...p, stage_slug: st.stage_slug, stage_nome: st.stage_nome, stage_ordem: st.stage_ordem });
          }
        }
      }
      setPartidas(flat);
      setLoadingDados(false);
    }).catch(() => setLoadingDados(false));
  }, [editionId]);

  useEffect(() => {
    if (!grupoAtivo && stages.length > 0) {
      const first = stages.find(s => s.stage_tipo === "groups") || stages[0];
      setGrupoAtivo(first.stage_slug);
    }
  }, [stages, grupoAtivo]);

  useEffect(() => {
    listarCartelasIA().then(setIaCartelas).catch(() => {});
  }, []);

  const faseAtual = getFaseAtual(resultados, partidas);

  useEffect(() => {
    if (cartela?.id && faseAtual !== "grupos" && faseAtual !== (cartela?.campeao_fase || "grupos")) {
      setCampeaoTravado(true);
    } else {
      setCampeaoTravado(false);
    }
  }, [cartela?.id, cartela?.campeao_fase, faseAtual]);

  const fasesParaMostrar = useMemo(() => {
    return stages.map(s => s.stage_slug);
  }, [stages]);

  const isNew = !cartela?.id;
  const valorAposta = config?.valor_aposta || 20;

  const campeaoNome = useMemo(() => {
    if (campeaoId) {
      const t = times.find(t => t.id === campeaoId);
      if (t) return t.nome;
    }
    return cartela?.campeao_nome || "";
  }, [campeaoId, times, cartela?.campeao_nome]);

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
      const partida = partidas.find((p) => p.id === jogoId);
      if (partida && isJogoBloqueado(normalizarPartida(partida))) continue;
      novos[jogoId] = valor;
      count++;
    }
    if (count === 0) {
      alert("Nenhum palpite disponível para importar (todos os jogos já iniciaram).");
      return;
    }
    const campeaoIA = iaCartela.campeao || "";
    const teamMatch = times.find(t => t.nome === campeaoIA);
    setPalpites(novos);
    setCampeaoId(teamMatch?.id || "");
    if (!window.confirm(
      "Criar nova cartela baseada em " + iaCartela.participante + " com " + count + " palpites?\n\n" +
      "Isso substituirá qualquer edição não salva no formulário."
    )) return;
    onSalvar({
      nome: (nomeCartela || nomeUsuario) + " (IA " + iaCartela.participante.split(" ")[1] + ")",
      palpites: novos,
      campeaoId: teamMatch?.id || null,
      campeao_fase: campeaoIA ? faseAtual : undefined,
      viceCampeaoId, artilheiroNome, artilheiroSelecao,
    });
  };

  const handleUnlockCampeao = () => {
    const ptsAtuais = pontosCampeaoAtual;
    const ptsNovos = pontosCampeaoSeMudar;
    const diff = ptsAtuais - ptsNovos;
    if (!window.confirm(
      "O campeão está travado porque a " + faseLabel + " já começou.\n\n" +
      "Pontos atuais: " + ptsAtuais + " pts\n" +
      "Se desbloquear e mudar: " + ptsNovos + " pts (" + (diff > 0 ? "perda de " + diff : "mantém") + " pts)\n\n" +
      "Deseja desbloquear?"
    )) return;
    setCampeaoTravado(false);
  };

  const handleSalvar = () => {
    const palpitesFiltrados = { ...(cartela?.palpites || {}) };
    for (const [jogoId, valor] of Object.entries(palpites)) {
      const partida = partidas.find((p) => p.id === jogoId);
      if (!partida || !isJogoBloqueado(normalizarPartida(partida))) {
        palpitesFiltrados[jogoId] = valor;
      }
    }

    let novaCampeaoFase = cartela?.campeao_fase;
    if (!novaCampeaoFase) {
      novaCampeaoFase = campeaoId ? faseAtual : undefined;
    } else if (campeaoId !== cartela?.campeao_id && !campeaoTravado) {
      novaCampeaoFase = faseAtual;
    }

    onSalvar({
      ...cartela,
      nome: nomeCartela.trim() || "Cartela",
      palpites: palpitesFiltrados,
      campeaoId: campeaoId || null,
      campeao_fase: novaCampeaoFase,
      viceCampeaoId: viceCampeaoId || null,
      artilheiroNome: artilheiroNome.trim() || null,
      artilheiroSelecao: artilheiroSelecao || null,
    });
  };

  const jogosPorGrupo = (stageSlug) => {
    const stage = stages.find(s => s.stage_slug === stageSlug);
    if (!stage) return [];
    return (stage.partidas || []).map(normalizarPartida);
  };

  const totalJogos = partidas.length;
  const totalPalpitados = Object.keys(palpites).filter((k) => k !== "__campeo").length;

  const faseLabel = LABEL_MAP[faseAtual] || "Fase de Grupos";

  if (loadingDados) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B9CC8" }}>
        Carregando...
      </div>
    );
  }

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
              {isNew ? "Nova" : "Editando"} {"\u00B7"} R$ {valorAposta.toFixed(2).replace(".", ",")}
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
              ({cartela?.campeao_fase ? pontosCampeaoPorFase(cartela.campeao_fase) + " pts na " + headingLabel(cartela.campeao_fase) : faseLabel})
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
              value={campeaoId}
              onChange={(e) => setCampeaoId(e.target.value)}
              disabled={!isDono || campeaoTravado}
              style={{
                flex: 1,
                background: "#1a2234",
                border: "2px solid " + (campeaoTravado ? "#C8102E" : (campeaoId ? "#FFD700" : "#1E2A45")),
                borderRadius: 8,
                color: campeaoTravado ? "#C8102E" : (campeaoId ? "#FFD700" : "#8B9CC8"),
                padding: "10px 12px",
                fontSize: 15,
                fontWeight: campeaoId ? 700 : 400,
                cursor: campeaoTravado ? "not-allowed" : "pointer",
                opacity: campeaoTravado ? 0.6 : 1,
              }}
            >
              <option value="">Selecione o campeão...</option>
              {times.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
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

        <Card style={{ marginBottom: 14, border: "2px solid #C0C0C044" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ color: "#C0C0C0", fontWeight: 800, fontSize: 14 }}>
              {"\uD83E\uDD48"} Vice-campeão +{pontosVicePorFase(cartela?.campeao_fase || faseAtual)} pts
            </span>
            <span style={{ color: "#8B9CC8", fontSize: 12, fontWeight: 400 }}>
              ({cartela?.campeao_fase ? pontosVicePorFase(cartela.campeao_fase) + " pts na " + headingLabel(cartela.campeao_fase) : faseLabel})
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={viceCampeaoId}
              onChange={(e) => setViceCampeaoId(e.target.value)}
              disabled={!isDono}
              style={{
                flex: 1,
                background: "#1a2234",
                border: "2px solid " + (viceCampeaoId ? "#C0C0C0" : "#1E2A45"),
                borderRadius: 8,
                color: viceCampeaoId ? "#C0C0C0" : "#8B9CC8",
                padding: "10px 12px", fontSize: 15,
                fontWeight: viceCampeaoId ? 700 : 400,
                cursor: "pointer",
              }}
            >
              <option value="">Selecione o vice...</option>
              {times.filter(t => t.id !== campeaoId).map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>
        </Card>

        <Card style={{ marginBottom: 14, border: "2px solid #22d3ee44" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ color: "#22d3ee", fontWeight: 800, fontSize: 14 }}>
              {"\u26BD"} Artilheiro +{PONTOS_ARTILHEIRO} pts
            </span>
            <span style={{ color: "#8B9CC8", fontSize: 12, fontWeight: 400 }}>
              (bônus combo +{PONTOS_COMBO} se acertar campeão + vice + artilheiro)
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={artilheiroNome}
              onChange={(e) => setArtilheiroNome(e.target.value)}
              disabled={!isDono}
              placeholder="Nome do artilheiro"
              maxLength={60}
              style={{
                flex: 1,
                background: "#1a2234",
                border: "2px solid " + (artilheiroNome ? "#22d3ee" : "#1E2A45"),
                borderRadius: 8,
                color: artilheiroNome ? "#22d3ee" : "#F0F4FF",
                padding: "10px 12px", fontSize: 15,
              }}
            />
            <select
              value={artilheiroSelecao}
              onChange={(e) => setArtilheiroSelecao(e.target.value)}
              disabled={!isDono}
              style={{
                background: "#1a2234",
                border: "2px solid #1E2A45",
                borderRadius: 8,
                color: "#F0F4FF",
                padding: "10px 12px", fontSize: 13,
                cursor: "pointer",
              }}
            >
              <option value="">Seleção</option>
              {times.map((t) => (
                <option key={t.id} value={t.nome}>{t.nome}</option>
              ))}
            </select>
          </div>
        </Card>

        {stages.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <span style={{ color: "#8B9CC8", fontSize: 13, alignSelf: "center" }}>Fase:</span>
            {fasesParaMostrar.map((slug) => (
              <button
                key={slug}
                onClick={() => setGrupoAtivo(slug)}
                style={{
                  flexShrink: 0,
                  background: grupoAtivo === slug ? "#FFD700" : "#111827",
                  color: grupoAtivo === slug ? "#000" : "#8B9CC8",
                  border: "1px solid " + (grupoAtivo === slug ? "#FFD700" : "#1E2A45"),
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {tabLabel(slug)}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            color: "#8B9CC8",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 10,
            letterSpacing: 1,
          }}
        >
          {headingLabel(grupoAtivo)}
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
