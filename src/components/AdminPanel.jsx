import React, { useState, useCallback, useEffect } from "react";
import { Card } from "./Card";
import { Btn } from "./Btn";
import { StatusBadge } from "./StatusBadge";
import { JOGOS_TODOS, JOGOS_GRUPOS, TODOS_TIMES } from "../services/jogos";
import { salvarAdminData, salvarConfig, getConfig } from "../services/admin";
import { listJogadores, deletarJogador } from "../services/jogadores";
import { listarCartelasExcluidas, restaurarCartela, excluirCartelaDefinitivo } from "../services/cartelas";
import { listarTodosGrupos, criarGrupo, listarMembros, removerMembro, atualizarGrupo, gerarConvite, listarConvites, revogarConvite, excluirGrupo } from "../services/grupos";
import { supabaseFetch, supabaseHeaders } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import { parseResultadosDeAPI, fetchResultadosDeURL } from "../utils/parseResultadosAPI";

export function AdminPanel({
  cartelas,
  resultados,
  campeoReal,
  onValidarCartela,
  onResultadosChange,
  ultimaAtualizacao,
}) {
  const { isAdmin, isGroupAdmin, grupoAtivo, user } = useAuth();
  const [abaAdmin, setAbaAdmin] = useState("validar");
  const [resultadosEdit, setResultadosEdit] = useState(resultados || {});
  const [campeoRealEdit, setCampeoRealEdit] = useState(campeoReal || "");
  const [jogoSelecionado, setJogoSelecionado] = useState("");
  const [carregandoPart, setCarregandoPart] = useState(false);
  const [participantes, setParticipantes] = useState([]);
  const [valorAposta, setValorAposta] = useState(20);
  const [apiUrl, setApiUrl] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [msgBusca, setMsgBusca] = useState("");
  const [adminSenha, setAdminSenha] = useState("");
  const [bonusGeral, setBonusGeral] = useState(0);
  const [cartelasExcluidas, setCartelasExcluidas] = useState([]);
  const [carregandoLixeira, setCarregandoLixeira] = useState(false);
  const [gruposLista, setGruposLista] = useState([]);
  const [carregandoGrupos, setCarregandoGrupos] = useState(false);
  const [novoGrupoNome, setNovoGrupoNome] = useState("");
  const [novoGrupoSlug, setNovoGrupoSlug] = useState("");
  const [novoGrupoAdmin, setNovoGrupoAdmin] = useState("");
  const [novoGrupoValor, setNovoGrupoValor] = useState(20);
  const [msgGrupo, setMsgGrupo] = useState("");
  const [grupoMembrosAberto, setGrupoMembrosAberto] = useState(null);
  const [membrosGrupo, setMembrosGrupo] = useState([]);
  const [grupoEditando, setGrupoEditando] = useState(null);
  const [grupoExcluindo, setGrupoExcluindo] = useState(null);
  const [msgConvite, setMsgConvite] = useState("");
  const [membros, setMembros] = useState([]);
  const [linkConvite, setLinkConvite] = React.useState("");
  const [convites, setConvites] = React.useState([]);

  useEffect(() => {
    if (!isGroupAdmin || !grupoAtivo?.id) return;
    let ativo = true;
    listarMembros(grupoAtivo.id).then((data) => {
      if (ativo) setMembros(data || []);
    }).catch(() => { if (ativo) setMembros([]); });
    return () => { ativo = false; };
  }, [isGroupAdmin, grupoAtivo?.id]);

  useEffect(() => { setResultadosEdit(resultados || {}); }, [resultados]);
  useEffect(() => { setCampeoRealEdit(campeoReal || ""); }, [campeoReal]);
  useEffect(() => {
    getConfig().then((cfg) => {
      setValorAposta(cfg.valor_aposta);
      setApiUrl(cfg.api_url || "");
      setBonusGeral(cfg.bonus_geral || 0);
    }).catch(() => {});
  }, []);

  const carregarParticipantes = useCallback(async () => {
    setCarregandoPart(true);
    try {
      const data = await listJogadores();
      setParticipantes(data || []);
    } catch {
      setParticipantes([]);
    }
    setCarregandoPart(false);
  }, []);

  const carregarLixeira = useCallback(async () => {
    setCarregandoLixeira(true);
    try {
      const data = await listarCartelasExcluidas(grupoAtivo?.id || "");
      setCartelasExcluidas(data || []);
    } catch {
      setCartelasExcluidas([]);
    }
    setCarregandoLixeira(false);
  }, [grupoAtivo?.id]);

  const handleSalvarResultado = useCallback(
    (jogoId, ga, gb) => {
      const atualizado = {
        ...resultadosEdit,
        [jogoId]: { placar_a: Number(ga), placar_b: Number(gb) },
      };
      setResultadosEdit(atualizado);
      onResultadosChange(atualizado, campeoRealEdit);
      salvarAdminData(atualizado, campeoRealEdit).catch(() => {});
    },
    [resultadosEdit, campeoRealEdit, onResultadosChange]
  );

  const handleBuscarResultados = useCallback(async () => {
    const url = apiUrl || "https://wheniskickoff.com/data/v1/matches.json";
    setBuscando(true);
    setMsgBusca("Buscando resultados...");
    try {
      const matches = await fetchResultadosDeURL(url);
      const novos = parseResultadosDeAPI(matches);
      const count = Object.keys(novos).length;
      if (count > 0) {
        const mergeados = { ...resultadosEdit, ...novos };
        setResultadosEdit(mergeados);
        onResultadosChange(mergeados, campeoRealEdit);
        await salvarAdminData(mergeados, campeoRealEdit);
        setMsgBusca(`${count} resultado(s) atualizado(s)!`);
      } else {
        setMsgBusca("Nenhum resultado novo encontrado. Verifique se a API retorna jogos finalizados.");
      }
    } catch (e) {
      setMsgBusca("Erro: " + e.message + ". Tente inserir manualmente.");
    }
    setBuscando(false);
  }, [apiUrl, resultadosEdit, campeoRealEdit, onResultadosChange]);

  const handleSalvarConfig = async () => {
    try {
      await salvarConfig({ valor_aposta: Number(valorAposta), api_url: apiUrl, admin_password: adminSenha || undefined, bonus_geral: Number(bonusGeral) });
      setAdminSenha("");
      alert("Configuração salva com sucesso!");
    } catch (e) {
      alert("Erro ao salvar: " + (e.message || "desconhecido"));
    }
  };

  const handleExcluirParticipante = async (nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${nome}" e todas as suas cartelas?`)) return;
    try {
      await deletarJogador(nome);
      carregarParticipantes();
      alert("Participante excluído!");
    } catch (e) {
      alert("Erro ao excluir: " + (e.message || "desconhecido"));
    }
  };

  const carregarGrupos = useCallback(async (adminPass) => {
    setCarregandoGrupos(true);
    try {
      const senha = adminPass || prompt("Digite a senha de super admin para listar grupos:");
      if (!senha) { setCarregandoGrupos(false); return; }
      const data = await listarTodosGrupos(senha);
      setGruposLista(data || []);
    } catch {
      setGruposLista([]);
    }
    setCarregandoGrupos(false);
  }, []);

  const handleCriarGrupo = async () => {
    if (!novoGrupoNome || !novoGrupoSlug || !novoGrupoAdmin) {
      setMsgGrupo("Preencha nome, slug e admin.");
      return;
    }
    const adminPass = prompt("Digite a senha de super admin para criar grupo:");
    if (!adminPass) return;
    try {
      await criarGrupo(novoGrupoNome, novoGrupoSlug, novoGrupoAdmin, novoGrupoValor, adminPass);
      setMsgGrupo("Grupo criado com sucesso!");
      setNovoGrupoNome("");
      setNovoGrupoSlug("");
      setNovoGrupoAdmin("");
      setNovoGrupoValor(20);
      carregarGrupos();
    } catch (e) {
      setMsgGrupo("Erro: " + e.message);
    }
  };

  const toggleMembros = async (g) => {
    if (grupoMembrosAberto === g.id) {
      setGrupoMembrosAberto(null);
      setMembrosGrupo([]);
    } else {
      try {
        const data = await listarMembros(g.id);
        setMembrosGrupo(data || []);
        setGrupoMembrosAberto(g.id);
      } catch {
        setMembrosGrupo([]);
      }
    }
  };

  const abrirEditarGrupo = (g) => {
    setGrupoEditando(grupoEditando?.id === g.id ? null : {
      id: g.id,
      valor_aposta: g.valor_aposta || 20,
      pontos_cheio: g.pontos_cheio || 5,
      pontos_vencedor: g.pontos_vencedor || 3,
      admin_nome: g.admin_nome || g.admin || "",
    });
  };

  const handleSalvarEdicaoGrupo = async (g) => {
    const adminPass = prompt("Digite a senha de super admin para salvar:");
    if (!adminPass) return;
    try {
      await atualizarGrupo(g.id, grupoEditando.admin_nome, grupoEditando, adminPass);
      alert("Grupo atualizado!");
      setGrupoEditando(null);
      carregarGrupos();
    } catch (e) {
      alert("Erro: " + e.message);
    }
  };

  const handleExcluirGrupo = async (g) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o grupo "${g.nome}"?\n\nIsso removerá todas as cartelas, membros e convites deste grupo. Esta ação NÃO pode ser desfeita.`)) return;
    const adminPass = prompt("Digite a senha de super admin para confirmar exclusão:");
    if (!adminPass) return;
    setGrupoExcluindo(g.id);
    try {
      await excluirGrupo(g.id, adminPass);
      alert(`Grupo "${g.nome}" excluído permanentemente!`);
      carregarGrupos();
    } catch (e) {
      alert("Erro ao excluir: " + e.message);
    }
    setGrupoExcluindo(null);
  };

  const handleRemoverMembro = async (g, membro) => {
    const nome = typeof membro === "string" ? membro : membro.usuario_id || membro.nome;
    if (!window.confirm(`Remover "${nome}" do grupo?`)) return;
    try {
      await removerMembro(g.id, g.admin_nome || g.admin, nome);
      const data = await listarMembros(g.id);
      setMembrosGrupo(data || []);
    } catch (e) {
      alert("Erro ao remover: " + e.message);
    }
  };

  const handleRemoverMembroGrupo = async (m) => {
    const nome = m.usuario_id || m.nome;
    if (!window.confirm(`Remover "${nome}" do grupo?`)) return;
    try {
      await removerMembro(grupoAtivo.id, user?.nome || "", nome);
      const data = await listarMembros(grupoAtivo.id);
      setMembros(data || []);
    } catch (e) {
      alert("Erro ao remover: " + e.message);
    }
  };

  const carregarConvites = React.useCallback(async () => {
    if (!grupoAtivo?.id) return;
    try {
      const data = await listarConvites(grupoAtivo.id);
      setConvites(data || []);
    } catch {}
  }, [grupoAtivo?.id]);

  React.useEffect(() => {
    if (isGroupAdmin) {
      carregarConvites();
    }
  }, [isGroupAdmin, grupoAtivo?.id, carregarConvites]);

  const handleGerarLinkConvite = async () => {
    if (!grupoAtivo?.id) return;
    setMsgConvite("");
    try {
      const res = await gerarConvite(grupoAtivo.id);
      const baseUrl = window.location.origin + (import.meta.env.BASE_URL || "/");
      setLinkConvite(baseUrl + "convite/" + res.token);
      setMsgConvite("Link de convite gerado!");
      carregarConvites();
    } catch (e) {
      setMsgConvite("Erro ao gerar convite: " + e.message);
    }
  };

  const handleRevogarConvite = async (conviteId) => {
    if (!window.confirm("Revogar este convite? Os participantes ainda não cadastrados não poderão usá-lo.")) return;
    try {
      await revogarConvite(conviteId);
      carregarConvites();
    } catch (e) {
      alert("Erro: " + e.message);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "#1a2234",
    border: "2px solid #1E2A45",
    borderRadius: 8,
    color: "#F0F4FF",
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 500,
    boxSizing: "border-box",
  };

  if (!isAdmin && !isGroupAdmin) return null;

  const tabs = [
    { key: "validar", label: "Validar" },
    { key: "resultados", label: "Resultados" },
    ...(isAdmin ? [{ key: "participantes", label: "Participantes" }] : []),
    ...(isAdmin ? [{ key: "grupos", label: "Grupos" }] : []),
    ...(isAdmin ? [{ key: "config", label: "Config" }] : []),
    { key: "lixeira", label: "\uD83D\uDDD1\uFE0F Lixeira" },
  ];

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setAbaAdmin(tab.key);
              if (tab.key === "participantes") carregarParticipantes();
              if (tab.key === "lixeira") carregarLixeira();
            }}
            style={{
              flex: 1,
              minWidth: 60,
              padding: "10px",
              background: abaAdmin === tab.key ? "#C8102E" : "#111827",
              color: abaAdmin === tab.key ? "#fff" : "#8B9CC8",
              border: `1px solid ${abaAdmin === tab.key ? "#C8102E" : "#1E2A45"}`,
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {abaAdmin === "validar" && (
        <Card style={{ border: "2px solid #16a34a44" }}>
          <div style={{ color: "#16a34a", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
            Validar Cartelas
          </div>
          {cartelas.length === 0 ? (
            <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", padding: 12 }}>
              Nenhuma cartela cadastrada.
            </div>
          ) : (
            cartelas.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "#0d1b2a",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  opacity: c.status === "validada" ? 0.5 : 1,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 14 }}>
                    {c.participante} {"—"} {c.nome || "Cartela"}
                  </div>
                  <div style={{ color: "#8B9CC8", fontSize: 12 }}>
                    {Object.keys(c.palpites || {}).filter((k) => k !== "__campeo").length}/
                    {JOGOS_GRUPOS.length} palpites {"·"} Campeão: {c.campeao || "—"}{" "}
                    {"·"} <StatusBadge status={c.status} />
                  </div>
                </div>
                {c.status !== "validada" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn
                      onClick={() => onValidarCartela(c.id, "validada")}
                      cor="#16a34a"
                      style={{ padding: "6px 12px", fontSize: 12 }}
                    >
                      {"\u2705"}
                    </Btn>
                    <Btn
                      onClick={() => onValidarCartela(c.id, "rejeitada")}
                      cor="#C8102E"
                      style={{ padding: "6px 12px", fontSize: 12 }}
                    >
                      {"\u274C"}
                    </Btn>
                  </div>
                )}
              </div>
            ))
          )}
        </Card>
      )}

      {abaAdmin === "resultados" && (
        <Card style={{ border: "2px solid #C8102E44" }}>
          <div style={{ color: "#C8102E", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
            Resultados dos Jogos
          </div>
          <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://wheniskickoff.com/data/v1/matches.json"
              style={{
                flex: 1,
                background: "#1a2234",
                border: "1px solid #1E2A45",
                borderRadius: 8,
                color: "#F0F4FF",
                padding: "8px 12px",
                fontSize: 13,
              }}
            />
            <Btn
              onClick={handleBuscarResultados}
              cor="#0033A0"
              disabled={buscando}
              style={{ padding: "8px 14px", fontSize: 12 }}
            >
              {buscando ? "\u23F3" : "\uD83D\uDD0D Buscar"}
            </Btn>
          </div>
          {msgBusca && (
            <div style={{ color: "#8B9CC8", fontSize: 12, marginBottom: 10 }}>{msgBusca}</div>
          )}
          {ultimaAtualizacao && (
            <div style={{ color: "#8B9CC8", fontSize: 11, marginBottom: 8 }}>
              Última atualização automática: {new Date(ultimaAtualizacao).toLocaleTimeString("pt-BR")}
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>Campeão real</div>
            <select
              value={campeoRealEdit}
              onChange={(e) => {
                setCampeoRealEdit(e.target.value);
                onResultadosChange(resultadosEdit, e.target.value);
                salvarAdminData(resultadosEdit, e.target.value).catch(() => {});
              }}
              style={{
                width: "100%",
                background: "#1a2234",
                border: "2px solid #FFD700",
                borderRadius: 8,
                color: "#FFD700",
                padding: "8px 12px",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <option value="">Ainda não definido</option>
              {TODOS_TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>
            Inserir/Editar resultado manual
          </div>
          <select
            value={jogoSelecionado}
            onChange={(e) => setJogoSelecionado(e.target.value)}
            style={{
              width: "100%",
              background: "#1a2234",
              border: "1px solid #1E2A45",
              borderRadius: 8,
              color: "#F0F4FF",
              padding: "8px 12px",
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            <option value="">Selecione o jogo...</option>
            {JOGOS_TODOS.map((j) => (
              <option key={j.id} value={j.id}>
                {j.time_a} {"×"} {j.time_b} ({j.grupo})
                {resultadosEdit[j.id]
                  ? ` \u2713 ${resultadosEdit[j.id].placar_a}-${resultadosEdit[j.id].placar_b}`
                  : ""}
              </option>
            ))}
          </select>
          {jogoSelecionado && (
            <FormResultadoAdmin
              jogo={JOGOS_GRUPOS.find((j) => j.id === jogoSelecionado)}
              resultadoSalvo={resultadosEdit[jogoSelecionado]}
              onSalvar={handleSalvarResultado}
            />
          )}
        </Card>
      )}

      {isAdmin && abaAdmin === "participantes" && (
        <Card style={{ border: "2px solid #FFD70044" }}>
          <div style={{ color: "#FFD700", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
            Participantes do Sistema
          </div>
          {carregandoPart ? (
            <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", padding: 12 }}>
              Carregando...
            </div>
          ) : participantes.length === 0 ? (
            <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", padding: 12 }}>
              Nenhum participante cadastrado.
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {participantes.map((p, i) => (
                <div
                  key={p.nome || i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 8px",
                    borderBottom: "1px solid #1E2A4510",
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#0033A0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {p.nome?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#F0F4FF", fontWeight: 600, fontSize: 14 }}>{p.nome}</div>
                  </div>
                  <button
                    onClick={() => handleExcluirParticipante(p.nome)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#C8102E",
                      fontSize: 16,
                      cursor: "pointer",
                      padding: "4px",
                    }}
                    title="Excluir participante"
                  >
                    {"\uD83D\uDDD1\uFE0F"}
                  </button>
                  </div>
              ))}
            </div>
          )}
          <div
            style={{
              color: "#8B9CC8",
              fontSize: 11,
              marginTop: 10,
              textAlign: "center",
            }}
          >
            Total: {participantes.length} participante{participantes.length !== 1 ? "s" : ""}
          </div>
        </Card>
      )}

      {isGroupAdmin && (
        <Card style={{ border: "2px solid #10b98144" }}>
          <div style={{ color: "#10b981", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
            Gerenciar Grupo: {grupoAtivo?.nome || "—"}
          </div>

          {msgConvite && (
            <div style={{ color: msgConvite.startsWith("Erro") ? "#C8102E" : "#10b981", fontSize: 12, marginBottom: 8 }}>{msgConvite}</div>
          )}

          {/* Seção de convite por link (único fluxo de entrada) */}
          <div style={{ marginBottom: 12, padding: "12px", background: "#0d1b2a", borderRadius: 8, border: "1px solid #1E2A45" }}>
            <div style={{ color: "#10b981", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
              \uD83D\uDD17 Convidar por Link
            </div>
            <div style={{ color: "#8B9CC8", fontSize: 11, marginBottom: 10 }}>
            Gere um link exclusivo e compartilhe com os participantes. Cada link é único e vinculado a este grupo.
            </div>
            <button
              onClick={handleGerarLinkConvite}
              style={{
                background: "#10b981",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                padding: "10px 16px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                width: "100%",
              }}
            >
              + Gerar Link de Convite
            </button>
            {linkConvite && (
              <div style={{ background: "#1a2234", border: "1px solid #1E2A45", borderRadius: 8, padding: 10, marginTop: 10 }}>
                <div style={{ color: "#8B9CC8", fontSize: 10, marginBottom: 4 }}>Link gerado (compartilhe com os participantes):</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    readOnly
                    value={linkConvite}
                    onClick={(e) => e.target.select()}
                    style={{
                      flex: 1,
                      background: "#0A0E1A",
                      border: "1px solid #1E2A45",
                      borderRadius: 6,
                      color: "#FFD700",
                      padding: "6px 8px",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(linkConvite); alert("Link copiado!"); }}
                    style={{
                      background: "#0033A0",
                      border: "none",
                      borderRadius: 6,
                      color: "#fff",
                      padding: "6px 10px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Convites ativos */}
          {convites.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "#8B9CC8", fontSize: 11, marginBottom: 6 }}>Convites ativos:</div>
              {convites.filter(c => c.ativo).map(c => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1E2A4520" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ color: "#8B9CC8", fontSize: 10, fontFamily: "monospace" }}>{c.token.slice(0, 16)}...</span>
                    <span style={{ color: "#4B5563", fontSize: 9 }}>
                      {c.max_usos > 0 ? `${c.usos}/${c.max_usos} usos` : "uso ilimitado"}
                      {c.expira_em ? ` · Expira ${new Date(c.expira_em).toLocaleDateString("pt-BR")}` : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRevogarConvite(c.id)}
                    style={{
                      background: "transparent",
                      border: "1px solid #C8102E44",
                      borderRadius: 6,
                      color: "#C8102E",
                      padding: "4px 10px",
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    Revogar
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Membros atuais do grupo */}
          <div style={{ borderTop: "1px solid #1E2A45", paddingTop: 12 }}>
            <div style={{ color: "#8B9CC8", fontSize: 11, marginBottom: 6 }}>
              Membros do grupo ({membros.length}):
            </div>
            {membros.length === 0 ? (
              <div style={{ color: "#4B5563", fontSize: 11, padding: "8px 0" }}>Nenhum membro ainda. Compartilhe o link de convite!</div>
            ) : (
              membros.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #1E2A4520",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: m.role === "admin" ? "#FFD700" : "#0033A0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 11,
                    }}>
                      {(m.usuario_id || m.nome || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span style={{ color: "#F0F4FF", fontSize: 13 }}>{m.usuario_id || m.nome}</span>
                      <span style={{
                        color: m.role === "admin" ? "#FFD700" : "#8B9CC8",
                        fontSize: 10,
                        marginLeft: 6,
                        background: m.role === "admin" ? "#FFD70022" : "transparent",
                        padding: m.role === "admin" ? "1px 6px" : 0,
                        borderRadius: 4,
                      }}>
                        {m.role === "admin" ? "admin" : "participante"}
                      </span>
                    </div>
                  </div>
                  {m.role !== "admin" && (
                    <button
                      onClick={() => handleRemoverMembroGrupo(m)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#C8102E",
                        cursor: "pointer",
                        fontSize: 12,
                        opacity: 0.7,
                      }}
                      title="Remover do grupo"
                    >
                      {"\uD83D\uDDD1\uFE0F"}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {isAdmin && abaAdmin === "grupos" && (
        <Card style={{ border: "2px solid #FFD70044" }}>
          <div style={{ color: "#FFD700", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
            Gestão de Grupos
          </div>

          {msgGrupo && (
            <div style={{ color: "#10b981", fontSize: 12, marginBottom: 8 }}>{msgGrupo}</div>
          )}

          <div style={{ marginBottom: 16, padding: 12, background: "#0d1b2a", borderRadius: 8 }}>
            <div style={{ color: "#8B9CC8", fontSize: 12, marginBottom: 8 }}>Criar Novo Grupo</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input placeholder="Nome do grupo" value={novoGrupoNome} onChange={(e) => setNovoGrupoNome(e.target.value)} style={inputStyle} />
              <input placeholder="Slug (ex: familia)" value={novoGrupoSlug} onChange={(e) => setNovoGrupoSlug(e.target.value)} style={inputStyle} />
              <input placeholder="Admin (nome do jogador)" value={novoGrupoAdmin} onChange={(e) => setNovoGrupoAdmin(e.target.value)} style={inputStyle} />
              <input type="number" placeholder="Valor aposta (R$)" value={novoGrupoValor} onChange={(e) => setNovoGrupoValor(Number(e.target.value))} style={inputStyle} />
              <Btn onClick={handleCriarGrupo}>Criar Grupo</Btn>
            </div>
          </div>

          <div>
            <Btn onClick={() => carregarGrupos()} style={{ marginBottom: 8 }}>
              {carregandoGrupos ? "Carregando..." : "Atualizar Lista"}
            </Btn>

            {gruposLista.length === 0 && !carregandoGrupos && (
              <div style={{ color: "#8B9CC8", fontSize: 12, padding: 8 }}>Nenhum grupo encontrado. Clique em "Atualizar Lista" e digite a senha de admin.</div>
            )}

            {gruposLista.map((g) => (
              <div key={g.id} style={{ background: "#1a2234", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 14 }}>{g.nome}</span>
                    <span style={{ color: "#8B9CC8", fontSize: 11, marginLeft: 8 }}>/{g.slug}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => abrirEditarGrupo(g)} style={{ background: "transparent", border: "none", color: "#1a4fd6", cursor: "pointer", fontSize: 13 }}>
                      Editar
                    </button>
                    <button onClick={() => handleExcluirGrupo(g)} style={{ background: "transparent", border: "none", color: "#C8102E", cursor: "pointer", fontSize: 13 }}>
                      {grupoExcluindo === g.id ? "..." : "Excluir"}
                    </button>
                    <button onClick={() => toggleMembros(g)} style={{ background: "transparent", border: "none", color: "#10b981", cursor: "pointer", fontSize: 13 }}>
                      Membros
                    </button>
                  </div>
                </div>
                <div style={{ color: "#8B9CC8", fontSize: 11, marginTop: 4 }}>
                  Admin: {g.admin_nome || g.admin || "—"} | Valor: R$ {g.valor_aposta} | {g.qtde_membros || "?"} membros
                </div>

                {grupoEditando && grupoEditando.id === g.id && (
                  <div style={{ marginTop: 10, padding: 10, background: "#0d1b2a", borderRadius: 8 }}>
                    <div style={{ color: "#FFD700", fontSize: 11, marginBottom: 6 }}>Editar Grupo</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <input type="number" placeholder="Valor aposta" value={grupoEditando.valor_aposta} onChange={(e) => setGrupoEditando({ ...grupoEditando, valor_aposta: Number(e.target.value) })} style={inputStyle} />
                      <input type="number" placeholder="Pts acerto cheio" value={grupoEditando.pontos_cheio} onChange={(e) => setGrupoEditando({ ...grupoEditando, pontos_cheio: Number(e.target.value) })} style={inputStyle} />
                      <input type="number" placeholder="Pts vencedor certo" value={grupoEditando.pontos_vencedor} onChange={(e) => setGrupoEditando({ ...grupoEditando, pontos_vencedor: Number(e.target.value) })} style={inputStyle} />
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn onClick={() => handleSalvarEdicaoGrupo(g)} style={{ flex: 1 }}>Salvar</Btn>
                        <Btn onClick={() => setGrupoEditando(null)} cor="#555" style={{ flex: 1 }}>Cancelar</Btn>
                      </div>
                    </div>
                  </div>
                )}

                {grupoMembrosAberto === g.id && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ color: "#8B9CC8", fontSize: 11, marginBottom: 4 }}>Membros ({membrosGrupo.length}):</div>
                    {membrosGrupo.length === 0 ? (
                      <div style={{ color: "#8B9CC8", fontSize: 11 }}>Nenhum membro.</div>
                    ) : (
                      membrosGrupo.map((m, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #1E2A4520" }}>
                          <span style={{ color: "#F0F4FF", fontSize: 13 }}>{typeof m === "string" ? m : m.usuario_id || m.nome}</span>
                          <button onClick={() => handleRemoverMembro(g, m)} style={{ background: "transparent", border: "none", color: "#C8102E", cursor: "pointer", fontSize: 12 }}>
                            Remover
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {abaAdmin === "config" && (
        <Card style={{ border: "2px solid #0033A044" }}>
          <div style={{ color: "#1a4fd6", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
            Configurações
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>
              Valor da Aposta (R$)
            </div>
            <input
              type="number"
              step="0.50"
              min="0"
              value={valorAposta}
              onChange={(e) => setValorAposta(e.target.value)}
              style={{
                width: "100%",
                background: "#1a2234",
                border: "2px solid #1E2A45",
                borderRadius: 8,
                color: "#FFD700",
                padding: "10px 12px",
                fontSize: 18,
                fontWeight: 700,
              }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>
              Senha do Administrador
            </div>
            <input
              type="password"
              value={adminSenha}
              onChange={(e) => setAdminSenha(e.target.value)}
              placeholder="Nova senha do admin (deixe vazio para manter)"
              style={{
                width: "100%",
                background: "#1a2234",
                border: "2px solid #1E2A45",
                borderRadius: 8,
                color: "#F0F4FF",
                padding: "10px 12px",
                fontSize: 14,
              }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>
              URL da API de Resultados
            </div>
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://wheniskickoff.com/data/v1/matches.json"
              style={{
                width: "100%",
                background: "#1a2234",
                border: "2px solid #1E2A45",
                borderRadius: 8,
                color: "#F0F4FF",
                padding: "10px 12px",
                fontSize: 14,
              }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>
              Pontos extras para todos (bônus)
            </div>
            <input
              type="number"
              min="0"
              value={bonusGeral}
              onChange={(e) => setBonusGeral(e.target.value)}
              placeholder="0"
              style={{
                width: "100%",
                background: "#1a2234",
                border: "2px solid #1E2A45",
                borderRadius: 8,
                color: "#16a34a",
                padding: "10px 12px",
                fontSize: 18,
                fontWeight: 700,
              }}
            />
          </div>
          <Btn onClick={handleSalvarConfig} cor="#0033A0" style={{ width: "100%" }}>
            Salvar Configuração
          </Btn>
        </Card>
      )}

      {abaAdmin === "lixeira" && (
        <Card style={{ border: "2px solid #C8102E44" }}>
          <div style={{ color: "#C8102E", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
            {"\uD83D\uDDD1\uFE0F"} Lixeira — Cartelas Excluídas
          </div>
          {carregandoLixeira ? (
            <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", padding: 12 }}>
              Carregando...
            </div>
          ) : cartelasExcluidas.length === 0 ? (
            <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", padding: 12 }}>
              Nenhuma cartela na lixeira.
            </div>
          ) : (
            cartelasExcluidas.map((c) => (
              <div key={c.id} style={{
                background: "#0d1b2a", borderRadius: 8, padding: 12, marginBottom: 8,
                display: "flex", alignItems: "center", gap: 12, opacity: 0.7,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 14 }}>
                    {c.participante} — {c.nome || "Cartela"}
                  </div>
                  <div style={{ color: "#8B9CC8", fontSize: 11 }}>
                    {Object.keys(c.palpites || {}).length} palpites · Campeão: {c.campeao || "—"}
                    {c.deleted_at && <> · Excluída em {new Date(c.deleted_at).toLocaleString("pt-BR")}</>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={async () => {
                      try { await restaurarCartela(c.id); carregarLixeira(); alert("Cartela restaurada!"); }
                      catch (e) { alert("Erro: " + e.message); }
                    }}
                    style={{
                      background: "#16a34a", border: "none", borderRadius: 6, color: "#fff",
                      padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    Restaurar
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Excluir permanentemente a cartela de "${c.participante}"?`)) return;
                      try { await excluirCartelaDefinitivo(c.id); carregarLixeira(); alert("Cartela excluída permanentemente!"); }
                      catch (e) { alert("Erro: " + e.message); }
                    }}
                    style={{
                      background: "#C8102E", border: "none", borderRadius: 6, color: "#fff",
                      padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  );
}

function FormResultadoAdmin({ jogo, resultadoSalvo, onSalvar }) {
  const [ga, setGa] = React.useState(resultadoSalvo?.placar_a ?? "");
  const [gb, setGb] = React.useState(resultadoSalvo?.placar_b ?? "");
  React.useEffect(() => {
    setGa(resultadoSalvo?.placar_a ?? "");
    setGb(resultadoSalvo?.placar_b ?? "");
  }, [jogo?.id, resultadoSalvo]);

  if (!jogo) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ color: "#F0F4FF", flex: 1, textAlign: "right", fontWeight: 700 }}>
          {jogo.time_a}
        </span>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={ga}
          onChange={(e) => setGa(e.target.value)}
          style={{
            width: 52,
            textAlign: "center",
            background: "#1a2234",
            border: "2px solid #1E2A45",
            borderRadius: 6,
            color: "#F0F4FF",
            padding: "6px 0",
            fontSize: 18,
            fontWeight: 800,
          }}
        />
        <span style={{ color: "#8B9CC8" }}>{"×"}</span>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={gb}
          onChange={(e) => setGb(e.target.value)}
          style={{
            width: 52,
            textAlign: "center",
            background: "#1a2234",
            border: "2px solid #1E2A45",
            borderRadius: 6,
            color: "#F0F4FF",
            padding: "6px 0",
            fontSize: 18,
            fontWeight: 800,
          }}
        />
        <span style={{ color: "#F0F4FF", flex: 1, fontWeight: 700 }}>{jogo.time_b}</span>
      </div>
      <Btn
        onClick={() => {
          if (ga !== "" && gb !== "") onSalvar(jogo.id, ga, gb);
        }}
        cor="#16a34a"
        style={{ width: "100%" }}
      >
        Salvar
      </Btn>
    </div>
  );
}
