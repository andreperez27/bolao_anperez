import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "./Card";
import { Btn } from "./Btn";
import { StatusBadge } from "./StatusBadge";
import { useGrupo } from "../contexts/GrupoContext";
import { getSession } from "../services/auth";
import { getFasesComPartidas, salvarResultado, listarTimesEdicao } from "../services/competitions";
import { buscarConfigGrupo, atualizarConfigGrupo, listarMembros, removerMembro, gerarConviteParticipante, listarSolicitacoes, aprovarSolicitacao, recusarSolicitacao } from "../services/groups";
import { listarPredictions, listarPredictionsExcluidas, validarPrediction, restaurarPrediction, excluirPredictionDefinitivo } from "../services/predictions";
import { parseResultadosDeAPI, fetchResultadosDeURL } from "../utils/parseResultadosAPI";

function normalizarPartida(m) {
  let horarioBrasilia = "";
  if (m.data_iso && m.horario) {
    try {
      const d = new Date(m.data_iso + "T" + m.horario + ":00");
      horarioBrasilia = String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + " " + m.horario;
    } catch {
      horarioBrasilia = m.data_iso + " " + m.horario;
    }
  }
  return { ...m, time_a: m.time_a_nome, time_b: m.time_b_nome, horario_brasilia: horarioBrasilia };
}

function FormResultado({ partida, resultadoSalvo, onSalvar }) {
  const [ga, setGa] = useState(resultadoSalvo?.placar_a ?? "");
  const [gb, setGb] = useState(resultadoSalvo?.placar_b ?? "");
  useEffect(() => {
    setGa(resultadoSalvo?.placar_a ?? "");
    setGb(resultadoSalvo?.placar_b ?? "");
  }, [partida?.id, resultadoSalvo]);

  if (!partida) return null;
  const h = normalizarPartida(partida);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: "1px solid rgba(30,42,69,0.3)" }}>
      <span style={{ color: "#8B9CC8", fontSize: 10, minWidth: 50 }}>{h.horario_brasilia || h.data_iso}</span>
      <span style={{ color: "#F0F4FF", flex: 1, textAlign: "right", fontWeight: 600, fontSize: 12 }}>{h.time_a}</span>
      <input type="number" inputMode="numeric" value={ga} onChange={e => setGa(e.target.value)}
        style={{ width: 36, textAlign: "center", background: "#1a2234", border: "1px solid #1E2A45", borderRadius: 4, color: "#F0F4FF", padding: "4px 0", fontSize: 14, fontWeight: 700 }} />
      <span style={{ color: "#4B5563", fontSize: 11 }}>{"\u00D7"}</span>
      <input type="number" inputMode="numeric" value={gb} onChange={e => setGb(e.target.value)}
        style={{ width: 36, textAlign: "center", background: "#1a2234", border: "1px solid #1E2A45", borderRadius: 4, color: "#F0F4FF", padding: "4px 0", fontSize: 14, fontWeight: 700 }} />
      <span style={{ color: "#F0F4FF", flex: 1, fontWeight: 600, fontSize: 12 }}>{h.time_b}</span>
      <button onClick={() => { if (ga !== "" && gb !== "") onSalvar(partida.id, ga, gb); }}
        style={{ background: "#16a34a", border: "none", borderRadius: 4, color: "#fff", padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
        Salvar
      </button>
    </div>
  );
}

const TABS = [
  { key: "validar", label: "Validar" },
  { key: "resultados", label: "Resultados" },
  { key: "membros", label: "Participantes" },
  { key: "lixeira", label: "Lixeira" },
  { key: "config", label: "Config" },
];

export function AdminPanel({ resultados, onResultadosChange, ultimaAtualizacao }) {
  const { grupoId, membership, edition, config: grupoConfig, grupoSlug } = useGrupo();
  const session = getSession();
  const sessaoToken = session?.sessao_token;
  const isAdmin = membership?.role === "admin";
  const editionId = edition?.edition_id || edition?.id;
  const [aba, setAba] = useState("validar");

  const [predictions, setPredictions] = useState([]);
  const [stages, setStages] = useState([]);
  const [times, setTimes] = useState([]);
  const [membros, setMembros] = useState([]);
  const [config, setConfig] = useState(null);
  const [excluidas, setExcluidas] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!grupoId || !sessaoToken) return;
    setLoading(true);
    try {
      const [preds, memb, cfg] = await Promise.all([
        listarPredictions(grupoId),
        listarMembros(grupoId, sessaoToken).catch(() => []),
        buscarConfigGrupo(grupoId).catch(() => null),
      ]);
      setPredictions(Array.isArray(preds) ? preds : []);
      setMembros(Array.isArray(memb) ? memb : []);
      setConfig(cfg);
    } catch {}
    setLoading(false);
  }, [grupoId, sessaoToken]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!editionId) return;
    setLoading(true);
    Promise.all([
      getFasesComPartidas(editionId),
      listarTimesEdicao(editionId),
    ]).then(([st, tm]) => {
      setStages(Array.isArray(st) ? st : []);
      setTimes(Array.isArray(tm) ? tm : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [editionId]);

  // carregar excluídas quando lixeira tab for aberta
  const carregarExcluidas = useCallback(async () => {
    if (!grupoId || !sessaoToken) return;
    try {
      const data = await listarPredictionsExcluidas(grupoId, sessaoToken);
      setExcluidas(Array.isArray(data) ? data : []);
    } catch { setExcluidas([]); }
  }, [grupoId, sessaoToken]);

  // config UI state
  const [valorAposta, setValorAposta] = useState(20);
  const [apiUrl, setApiUrl] = useState("");
  const [adminSenha, setAdminSenha] = useState("");

  useEffect(() => {
    if (config) {
      setValorAposta(config.valor_aposta ?? 20);
      setApiUrl(config.api_url ?? "");
      setAdminSenha(config.admin_senha ?? "");
    }
  }, [config]);

  // resultados UI state
  const [resultadosEdit, setResultadosEdit] = useState(resultados || {});
  useEffect(() => { setResultadosEdit(resultados || {}); }, [resultados]);
  const [buscaMsg, setBuscaMsg] = useState("");
  const [buscando, setBuscando] = useState(false);

  // reais UI state
  const [campeaoRealId, setCampeaoRealId] = useState("");
  const [viceCampeaoRealId, setViceCampeaoRealId] = useState("");
  const [artilheiroRealNome, setArtilheiroRealNome] = useState("");
  const [artilheiroRealSelecao, setArtilheiroRealSelecao] = useState("");

  useEffect(() => {
    if (config) {
      setCampeaoRealId(config.campeao_real_id || "");
      setViceCampeaoRealId(config.vice_campeao_real_id || "");
      setArtilheiroRealNome(config.artilheiro_real_nome || "");
      setArtilheiroRealSelecao(config.artilheiro_real_selecao || "");
    }
  }, [config]);

  const salvarReais = useCallback(async (campeaoId, viceId, artNome, artSelecao) => {
    if (!grupoId || !sessaoToken) return;
    try {
      await atualizarConfigGrupo({
        grupoId, sessaoToken,
        campeaoRealId: campeaoId || null,
        viceCampeaoRealId: viceId || null,
        artilheiroRealNome: artNome || null,
        artilheiroRealSelecao: artSelecao || null,
      });
    } catch (e) { console.error("Erro ao salvar dados reais:", e); }
  }, [grupoId, sessaoToken]);

  const handleSalvarResultado = useCallback(async (matchId, ga, gb) => {
    const atualizado = { ...resultadosEdit, [matchId]: { placar_a: Number(ga), placar_b: Number(gb) } };
    setResultadosEdit(atualizado);
    onResultadosChange(atualizado, "");
    try { await salvarResultado(matchId, Number(ga), Number(gb)); } catch (e) { alert("Erro ao salvar: " + e.message); }
  }, [resultadosEdit, onResultadosChange]);

  const handleBuscarAPI = useCallback(async () => {
    setBuscando(true);
    setBuscaMsg("Buscando...");
    try {
      const data = await fetchResultadosDeURL(apiUrl);
      const flat = stages.flatMap(s => s.partidas || []);
      const novos = parseResultadosDeAPI(data, flat);
      const count = Object.keys(novos).length;
      if (count > 0) {
        const mergeados = { ...resultadosEdit, ...novos };
        setResultadosEdit(mergeados);
        onResultadosChange(mergeados, "");
        for (const [id, r] of Object.entries(novos)) {
          await salvarResultado(id, r.placar_a, r.placar_b).catch(() => {});
        }
        setBuscaMsg(count + " resultado(s) importado(s)!");
      } else {
        setBuscaMsg("Nenhum resultado novo encontrado.");
      }
    } catch (e) {
      setBuscaMsg("Erro: " + e.message);
    }
    setBuscando(false);
  }, [apiUrl, stages, resultadosEdit, onResultadosChange]);

  const handleSalvarConfig = useCallback(async () => {
    try {
      await atualizarConfigGrupo({
        grupoId, sessaoToken,
        valorAposta: Number(valorAposta),
        apiUrl: apiUrl || null,
        adminSenha: adminSenha || null,
      });
      alert("Configuração salva!");
    } catch (e) {
      alert("Erro: " + (e.message || "desconhecido"));
    }
  }, [grupoId, sessaoToken, valorAposta, apiUrl, adminSenha]);

  const handleValidar = useCallback(async (id, status) => {
    try { await validarPrediction(id, sessaoToken, status); loadAll(); } catch (e) { alert("Erro: " + e.message); }
  }, [sessaoToken, loadAll]);

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [processandoReq, setProcessandoReq] = useState(null);
  const publicLink = useMemo(() => {
    if (!grupoSlug) return "";
    return window.location.origin + import.meta.env.BASE_URL + "#/g/" + grupoSlug + "/entrar";
  }, [grupoSlug]);

  const carregarSolicitacoes = useCallback(async () => {
    if (!grupoId || !sessaoToken) return;
    try {
      const data = await listarSolicitacoes(grupoId, sessaoToken);
      setSolicitacoes(Array.isArray(data) ? data : []);
    } catch { setSolicitacoes([]); }
  }, [grupoId, sessaoToken]);

  const handleAprovarSolicitacao = useCallback(async (reqId) => {
    setProcessandoReq(reqId);
    try { await aprovarSolicitacao(reqId, sessaoToken); carregarSolicitacoes(); loadAll(); } catch (e) { alert("Erro: " + e.message); }
    setProcessandoReq(null);
  }, [sessaoToken, carregarSolicitacoes, loadAll]);

  const handleRecusarSolicitacao = useCallback(async (reqId) => {
    setProcessandoReq(reqId);
    try { await recusarSolicitacao(reqId, sessaoToken); carregarSolicitacoes(); } catch (e) { alert("Erro: " + e.message); }
    setProcessandoReq(null);
  }, [sessaoToken, carregarSolicitacoes]);

  const handleRemoverMembro = useCallback(async (profileId, nome) => {
    if (!window.confirm(`Remover ${nome} do grupo?`)) return;
    try {
      await removerMembro(grupoId, profileId, sessaoToken);
      loadAll();
    } catch (e) { alert("Erro: " + e.message); }
  }, [grupoId, sessaoToken, loadAll]);

  const handleRestaurar = useCallback(async (id) => {
    try { await restaurarPrediction(id, sessaoToken); carregarExcluidas(); } catch (e) { alert("Erro: " + e.message); }
  }, [sessaoToken, carregarExcluidas]);

  const handleExcluirDefinitivo = useCallback(async (id) => {
    if (!window.confirm("Excluir permanentemente? Esta ação não pode ser desfeita.")) return;
    try { await excluirPredictionDefinitivo(id, sessaoToken); carregarExcluidas(); } catch (e) { alert("Erro: " + e.message); }
  }, [sessaoToken, carregarExcluidas]);

  // apenas admin vê o painel (DEPOIS de todos os hooks)
  if (!isAdmin) return null;

  const fasesParaMostrar = stages.filter(s => s.stage_tipo === "knockout" || s.stage_tipo === "groups");

  if (loading && !stages.length) {
    return <div style={{ textAlign: "center", color: "#8B9CC8", padding: 20, fontSize: 13 }}>Carregando...</div>;
  }

  const selectStyle = {
    width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8,
    color: "#F0F4FF", padding: "10px 12px", fontSize: 14, fontWeight: 500,
    boxSizing: "border-box", cursor: "pointer",
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => { setAba(tab.key); if (tab.key === "lixeira") carregarExcluidas(); if (tab.key === "membros") carregarSolicitacoes(); }}
            style={{ flex: 1, minWidth: 60, padding: "10px", background: aba === tab.key ? "#C8102E" : "#111827", color: aba === tab.key ? "#fff" : "#8B9CC8", border: "1px solid " + (aba === tab.key ? "#C8102E" : "#1E2A45"), borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* VALIDAÇÃO */}
      {aba === "validar" && (
        <Card style={{ border: "2px solid #16a34a44" }}>
          <div style={{ color: "#16a34a", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Validar Cartelas</div>
          {predictions.length === 0 ? (
            <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", padding: 12 }}>Nenhuma cartela cadastrada.</div>
          ) : (
            predictions.filter(p => p.status === "aguardando").map(c => (
              <div key={c.id} style={{ background: "#0d1b2a", borderRadius: 8, padding: 12, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 14 }}>{c.participante} — {c.nome || "Cartela"}</div>
                  <div style={{ color: "#8B9CC8", fontSize: 12 }}>
                    {Object.keys(c.palpites || {}).filter(k => k !== "__campeo").length} palpites · Campeão: {c.campeao_nome || "—"} {c.vice_campeao_nome ? `· Vice: ${c.vice_campeao_nome}` : ""} {c.artilheiro_nome ? `· Art: ${c.artilheiro_nome}` : ""} · <StatusBadge status={c.status} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn onClick={() => handleValidar(c.id, "validada")} cor="#16a34a" style={{ padding: "6px 12px", fontSize: 12 }}>{"\u2705"}</Btn>
                  <Btn onClick={() => handleValidar(c.id, "rejeitada")} cor="#C8102E" style={{ padding: "6px 12px", fontSize: 12 }}>{"\u274C"}</Btn>
                </div>
              </div>
            ))
          )}
          {predictions.filter(p => p.status !== "aguardando").length > 0 && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ color: "#8B9CC8", fontSize: 12, cursor: "pointer" }}>Ver cartelas já validadas ({predictions.filter(p => p.status !== "aguardando").length})</summary>
              <div style={{ marginTop: 8 }}>
                {predictions.filter(p => p.status !== "aguardando").map(c => (
                  <div key={c.id} style={{ background: "#0d1b2a", borderRadius: 8, padding: 10, marginBottom: 6, display: "flex", alignItems: "center", gap: 10, opacity: 0.6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#F0F4FF", fontWeight: 600, fontSize: 13 }}>{c.participante} — {c.nome || "Cartela"}</div>
                      <div style={{ color: "#8B9CC8", fontSize: 11 }}><StatusBadge status={c.status} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </Card>
      )}

      {/* RESULTADOS */}
      {aba === "resultados" && (
        <Card style={{ border: "2px solid #C8102E44" }}>
          <div style={{ color: "#C8102E", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Resultados dos Jogos</div>

          {/* Campeão Real */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Campeão Real</div>
            <select value={campeaoRealId} onChange={e => { const v = e.target.value; setCampeaoRealId(v); salvarReais(v, viceCampeaoRealId, artilheiroRealNome, artilheiroRealSelecao); }} style={selectStyle}>
              <option value="">— Selecione —</option>
              {times.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>

          {/* Vice-Campeão Real */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Vice-Campeão Real</div>
            <select value={viceCampeaoRealId} onChange={e => { const v = e.target.value; setViceCampeaoRealId(v); salvarReais(campeaoRealId, v, artilheiroRealNome, artilheiroRealSelecao); }} style={selectStyle}>
              <option value="">— Selecione —</option>
              {times.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>

          {/* Artilheiro Real */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Artilheiro Real</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={artilheiroRealNome} onChange={e => { const v = e.target.value; setArtilheiroRealNome(v); salvarReais(campeaoRealId, viceCampeaoRealId, v, artilheiroRealSelecao); }}
                placeholder="Nome do artilheiro" style={{ flex: 1, background: "#1a2234", border: "1px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 12px", fontSize: 14 }} />
              <select value={artilheiroRealSelecao} onChange={e => { const v = e.target.value; setArtilheiroRealSelecao(v); salvarReais(campeaoRealId, viceCampeaoRealId, artilheiroRealNome, v); }} style={{ ...selectStyle, width: "auto", minWidth: 140 }}>
                <option value="">Seleção</option>
                {times.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
              </select>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(30,42,69,0.5)", paddingTop: 12, marginBottom: 12, display: "flex", gap: 8 }}>
            <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="URL da API externa"
              style={{ flex: 1, background: "#1a2234", border: "1px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "8px 12px", fontSize: 13 }} />
            <Btn onClick={handleBuscarAPI} cor="#0033A0" disabled={buscando} style={{ padding: "8px 14px", fontSize: 12 }}>
              {buscando ? "\u23F3" : "\uD83D\uDD0D Buscar"}
            </Btn>
          </div>
          {buscaMsg && <div style={{ color: "#8B9CC8", fontSize: 12, marginBottom: 10 }}>{buscaMsg}</div>}
          {ultimaAtualizacao && (
            <div style={{ color: "#8B9CC8", fontSize: 11, marginBottom: 8 }}>
              Última atualização: {new Date(ultimaAtualizacao).toLocaleTimeString("pt-BR")}
            </div>
          )}

          {fasesParaMostrar.map(stage => {
            const slug = stage.stage_slug;
            const matches = (stage.partidas || []).filter(m => m.time_a_nome && m.time_b_nome);
            if (!matches.length) return null;
            const label = stage.stage_nome || slug;
            return (
              <details key={slug} open style={{ marginBottom: 10 }}>
                <summary style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 6 }}>{label.toUpperCase()}</summary>
                <div style={{ paddingLeft: 4 }}>
                  {matches.map(m => (
                    <FormResultado key={m.id} partida={m} resultadoSalvo={resultadosEdit[m.id]} onSalvar={handleSalvarResultado} />
                  ))}
                </div>
              </details>
            );
          })}
        </Card>
      )}

      {/* MEMBROS */}
      {aba === "membros" && (
        <Card style={{ border: "2px solid #FFD70044" }}>
          <div style={{ color: "#FFD700", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Participantes</div>

          <div style={{ marginBottom: 14, padding: 12, background: "#0d1b2a", borderRadius: 8 }}>
            <div style={{ color: "#8B9CC8", fontSize: 12, marginBottom: 8 }}>Link público do grupo (compartilhe no WhatsApp):</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input readOnly value={publicLink}
                style={{ flex: 1, background: "#1a2234", border: "1px solid #1E2A45", borderRadius: 6, color: "#FFD700", padding: "8px 10px", fontSize: 12, fontWeight: 600 }} />
              <button onClick={() => { navigator.clipboard.writeText(publicLink); alert("Link copiado!"); }}
                style={{ background: "#0033A0", border: "none", borderRadius: 6, color: "#fff", padding: "8px 14px", fontSize: 12, whiteSpace: "nowrap", cursor: "pointer", fontWeight: 600 }}>
                Copiar
              </button>
            </div>
            <div style={{ color: "#6B7BA8", fontSize: 10, marginTop: 6 }}>
              Quem acessar este link fará um cadastro e solicitará entrada. Você precisa aprovar manualmente.
            </div>
          </div>

          {/* SOLICITAÇÕES PENDENTES */}
          <div style={{ marginBottom: 14, padding: 12, background: "#0d1b2a", borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 12 }}>Solicitações pendentes</div>
              <button onClick={carregarSolicitacoes} style={{ background: "transparent", border: "1px solid #1E2A45", borderRadius: 4, color: "#8B9CC8", padding: "2px 8px", fontSize: 10, cursor: "pointer" }}>
                Atualizar
              </button>
            </div>
            {solicitacoes.filter(s => s.status === "pending").length === 0 ? (
              <div style={{ color: "#4B5563", fontSize: 11, textAlign: "center", padding: 8 }}>Nenhuma solicitação pendente.</div>
            ) : (
              solicitacoes.filter(s => s.status === "pending").map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(30,42,69,0.25)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FFD700", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                    {(s.nome || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#F0F4FF", fontWeight: 600, fontSize: 13 }}>{s.nome}</div>
                    <div style={{ color: "#6B7280", fontSize: 10 }}>{s.requested_at ? new Date(s.requested_at).toLocaleString("pt-BR") : ""}</div>
                  </div>
                  <button onClick={() => handleAprovarSolicitacao(s.id)} disabled={processandoReq === s.id}
                    style={{ background: "#16a34a", border: "none", borderRadius: 6, color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: processandoReq === s.id ? "not-allowed" : "pointer", opacity: processandoReq === s.id ? 0.6 : 1 }}>
                    Aprovar
                  </button>
                  <button onClick={() => handleRecusarSolicitacao(s.id)} disabled={processandoReq === s.id}
                    style={{ background: "#C8102E", border: "none", borderRadius: 6, color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: processandoReq === s.id ? "not-allowed" : "pointer", opacity: processandoReq === s.id ? 0.6 : 1 }}>
                    Recusar
                  </button>
                </div>
              ))
            )}
          </div>

          {membros.length === 0 ? (
            <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", padding: 12 }}>Nenhum membro.</div>
          ) : (
            membros.map((m, i) => (
              <div key={m.profile_id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px", borderBottom: "1px solid rgba(30,42,69,0.25)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: m.role === "admin" ? "#C8102E" : "#0033A0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                  {(m.nome || "?")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#F0F4FF", fontWeight: 600, fontSize: 14 }}>{m.nome || "—"}</div>
                  <div style={{ color: "#8B9CC8", fontSize: 11 }}>{m.role === "admin" ? "Admin" : "Participante"}</div>
                </div>
                {m.role === "admin" && <span style={{ background: "#C8102E22", color: "#C8102E", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>ADMIN</span>}
                {m.role !== "admin" && (
                  <button onClick={() => handleRemoverMembro(m.profile_id, m.nome)}
                    style={{ background: "transparent", border: "1px solid #C8102E44", borderRadius: 6, color: "#C8102E", padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    Remover
                  </button>
                )}
              </div>
            ))
          )}
          <div style={{ color: "#8B9CC8", fontSize: 11, marginTop: 10, textAlign: "center" }}>{membros.length} membro{membros.length !== 1 ? "s" : ""}</div>
        </Card>
      )}

      {/* LIXEIRA */}
      {aba === "lixeira" && (
        <Card style={{ border: "2px solid #6b21a844" }}>
          <div style={{ color: "#a855f7", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Cartelas Excluídas</div>
          {excluidas.length === 0 ? (
            <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", padding: 12 }}>Nenhuma cartela na lixeira.</div>
          ) : (
            excluidas.map(c => (
              <div key={c.id} style={{ background: "#0d1b2a", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 14 }}>{c.participante} — {c.nome || "Cartela"}</div>
                    <div style={{ color: "#8B9CC8", fontSize: 11, marginTop: 2 }}>
                      {Object.keys(c.palpites || {}).filter(k => k !== "__campeo").length} palpites · Campeão: {c.campeao_nome || "—"}
                      {c.vice_campeao_nome ? ` · Vice: ${c.vice_campeao_nome}` : ""}
                      {c.artilheiro_nome ? ` · Art: ${c.artilheiro_nome}` : ""}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 10, marginTop: 2 }}>
                      Excluída em: {c.deleted_at ? new Date(c.deleted_at).toLocaleString("pt-BR") : "—"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => handleRestaurar(c.id)}
                      style={{ background: "#16a34a", border: "none", borderRadius: 6, color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      Restaurar
                    </button>
                    <button onClick={() => handleExcluirDefinitivo(c.id)}
                      style={{ background: "#C8102E", border: "none", borderRadius: 6, color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      {/* CONFIG */}
      {aba === "config" && (
        <Card style={{ border: "2px solid #0033A044" }}>
          <div style={{ color: "#1a4fd6", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Configurações</div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>Valor da Aposta (R$)</div>
            <input type="number" step="0.50" min="0" value={valorAposta} onChange={e => setValorAposta(e.target.value)}
              style={{ width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#FFD700", padding: "10px 12px", fontSize: 18, fontWeight: 700 }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>URL da API de Resultados</div>
            <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="URL opcional para fetch externo"
              style={{ width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 12px", fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>Nova senha do admin (deixe vazio para manter)</div>
            <input type="text" value={adminSenha} onChange={e => setAdminSenha(e.target.value)} placeholder="Nova senha do admin (deixe vazio para manter)"
              style={{ width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 12px", fontSize: 14 }} />
          </div>
          <Btn onClick={handleSalvarConfig} cor="#0033A0" style={{ width: "100%" }}>Salvar Configuração</Btn>
        </Card>
      )}
    </div>
  );
}
