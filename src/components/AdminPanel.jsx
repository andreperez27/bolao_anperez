import React, { useState, useCallback, useEffect } from "react";
import { Card } from "./Card";
import { Btn } from "./Btn";
import { StatusBadge } from "./StatusBadge";
import { JOGOS_TODOS, JOGOS_GRUPOS, TODOS_TIMES } from "../services/jogos";
import { salvarAdminData, salvarConfig, getConfig } from "../services/admin";
import { listJogadores, deletarJogador } from "../services/jogadores";
import { listarCartelasExcluidas, restaurarCartela, excluirCartelaDefinitivo } from "../services/cartelas";
import { supabaseFetch } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useGrupo } from "../contexts/GrupoContext";
import { parseResultadosDeAPI, fetchResultadosDeURL } from "../utils/parseResultadosAPI";

export function AdminPanel({
  cartelas,
  resultados,
  campeoReal,
  onValidarCartela,
  onResultadosChange,
  ultimaAtualizacao,
}) {
  const { isAdmin } = useAuth();
  const { grupoId, grupo } = useGrupo();
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
  const [linkConvite, setLinkConvite] = useState("");
  const [convites, setConvites] = useState([]);
  const [msgConvite, setMsgConvite] = useState("");

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

  useEffect(() => { setResultadosEdit(resultados || {}); }, [resultados]);
  useEffect(() => { setCampeoRealEdit(campeoReal || ""); }, [campeoReal]);

  useEffect(() => {
    getConfig(grupoId).then((cfg) => {
      setValorAposta(cfg.valor_aposta);
      setApiUrl(cfg.api_url || "");
      setBonusGeral(cfg.bonus_geral || 0);
    }).catch(() => {});
  }, [grupoId]);

  useEffect(() => {
    if (!grupoId) return;
    supabaseFetch("/rest/v1/convites?grupo_id=eq." + encodeURIComponent(grupoId) + "&select=token,usos,max_usos,expira_em,criado_em&order=criado_em.desc")
      .then(r => r.json())
      .then(setConvites)
      .catch(() => setConvites([]));
  }, [grupoId]);

  const carregarParticipantes = useCallback(async () => {
    setCarregandoPart(true);
    try {
      const data = await listJogadores(grupoId);
      setParticipantes(data || []);
    } catch { setParticipantes([]); }
    setCarregandoPart(false);
  }, [grupoId]);

  const carregarLixeira = useCallback(async () => {
    setCarregandoLixeira(true);
    try {
      const data = await listarCartelasExcluidas(grupoId);
      setCartelasExcluidas(data || []);
    } catch { setCartelasExcluidas([]); }
    setCarregandoLixeira(false);
  }, [grupoId]);

  const handleSalvarResultado = useCallback(
    (jogoId, ga, gb) => {
      const atualizado = {
        ...resultadosEdit,
        [jogoId]: { placar_a: Number(ga), placar_b: Number(gb) },
      };
      setResultadosEdit(atualizado);
      onResultadosChange(atualizado, campeoRealEdit);
      salvarAdminData(atualizado, campeoRealEdit, grupoId).catch(() => {});
    },
    [resultadosEdit, campeoRealEdit, onResultadosChange, grupoId]
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
        await salvarAdminData(mergeados, campeoRealEdit, grupoId);
        setMsgBusca(`${count} resultado(s) atualizado(s)!`);
      } else {
        setMsgBusca("Nenhum resultado novo encontrado.");
      }
    } catch (e) {
      setMsgBusca("Erro: " + e.message);
    }
    setBuscando(false);
  }, [apiUrl, resultadosEdit, campeoRealEdit, onResultadosChange, grupoId]);

  const handleSalvarConfig = async () => {
    try {
      await salvarConfig({ valor_aposta: Number(valorAposta), api_url: apiUrl, admin_password: adminSenha || undefined, bonus_geral: Number(bonusGeral) }, grupoId);
      setAdminSenha("");
      alert("Configuração salva com sucesso!");
    } catch (e) {
      alert("Erro ao salvar: " + (e.message || "desconhecido"));
    }
  };

  const handleExcluirParticipante = async (nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${nome}" deste grupo?`)) return;
    try {
      await deletarJogador(nome, grupoId);
      carregarParticipantes();
      alert("Participante excluído!");
    } catch (e) {
      alert("Erro ao excluir: " + (e.message || "desconhecido"));
    }
  };

  const handleGerarLinkConvite = async () => {
    setMsgConvite("");
    try {
      const res = await supabaseFetch("/rest/v1/rpc/criar_convite", {
        method: "POST",
        body: JSON.stringify({ p_grupo_id: grupoId, p_max_usos: 999 }),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t); }
      const token = await res.json();
      const baseUrl = window.location.origin + (import.meta.env.BASE_URL || "/");
      setLinkConvite(baseUrl + "convite/" + token);
      setMsgConvite("Link de convite gerado!");
      const list = await supabaseFetch("/rest/v1/convites?grupo_id=eq." + encodeURIComponent(grupoId) + "&select=token,usos,max_usos,expira_em,criado_em&order=criado_em.desc");
      setConvites(await list.json() || []);
    } catch (e) {
      setMsgConvite("Erro ao gerar convite: " + e.message);
    }
  };

  const handleRevogarConvite = async (token) => {
    if (!window.confirm("Revogar este convite?")) return;
    try {
      await supabaseFetch("/rest/v1/convites?token=eq." + encodeURIComponent(token), {
        method: "PATCH",
        body: JSON.stringify({ usado: true }),
      });
      const list = await supabaseFetch("/rest/v1/convites?grupo_id=eq." + encodeURIComponent(grupoId) + "&select=token,usos,max_usos,expira_em,criado_em&order=criado_em.desc");
      setConvites(await list.json() || []);
    } catch (e) {
      alert("Erro: " + e.message);
    }
  };

  if (!isAdmin) return null;

  const tabs = [
    { key: "validar", label: "Validar" },
    { key: "resultados", label: "Resultados" },
    { key: "participantes", label: "Participantes" },
    { key: "convites", label: "Convites" },
    { key: "config", label: "Config" },
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
          <div style={{ color: "#16a34a", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Validar Cartelas</div>
          {cartelas.length === 0 ? (
            <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", padding: 12 }}>Nenhuma cartela cadastrada.</div>
          ) : (
            cartelas.map((c) => (
              <div key={c.id} style={{ background: "#0d1b2a", borderRadius: 8, padding: 12, marginBottom: 8, display: "flex", alignItems: "center", gap: 12, opacity: c.status === "validada" ? 0.5 : 1 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 14 }}>{c.participante} — {c.nome || "Cartela"}</div>
                  <div style={{ color: "#8B9CC8", fontSize: 12 }}>{Object.keys(c.palpites || {}).filter(k => k !== "__campeo").length}/{JOGOS_GRUPOS.length} palpites · Campeão: {c.campeao || "—"} · <StatusBadge status={c.status} /></div>
                </div>
                {c.status !== "validada" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn onClick={() => onValidarCartela(c.id, "validada")} cor="#16a34a" style={{ padding: "6px 12px", fontSize: 12 }}>{"\u2705"}</Btn>
                    <Btn onClick={() => onValidarCartela(c.id, "rejeitada")} cor="#C8102E" style={{ padding: "6px 12px", fontSize: 12 }}>{"\u274C"}</Btn>
                  </div>
                )}
              </div>
            ))
          )}
        </Card>
      )}

      {abaAdmin === "resultados" && (
        <Card style={{ border: "2px solid #C8102E44" }}>
          <div style={{ color: "#C8102E", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Resultados dos Jogos</div>
          <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
            <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://wheniskickoff.com/data/v1/matches.json"
              style={{ flex: 1, background: "#1a2234", border: "1px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "8px 12px", fontSize: 13 }} />
            <Btn onClick={handleBuscarResultados} cor="#0033A0" disabled={buscando} style={{ padding: "8px 14px", fontSize: 12 }}>{buscando ? "\u23F3" : "\uD83D\uDD0D Buscar"}</Btn>
          </div>
          {msgBusca && <div style={{ color: "#8B9CC8", fontSize: 12, marginBottom: 10 }}>{msgBusca}</div>}
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>Campeão real</div>
            <select value={campeoRealEdit} onChange={e => { setCampeoRealEdit(e.target.value); onResultadosChange(resultadosEdit, e.target.value); salvarAdminData(resultadosEdit, e.target.value, grupoId).catch(() => {}); }}
              style={{ width: "100%", background: "#1a2234", border: "2px solid #FFD700", borderRadius: 8, color: "#FFD700", padding: "8px 12px", fontSize: 14, fontWeight: 700 }}>
              <option value="">Ainda não definido</option>
              {TODOS_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>Inserir/Editar resultado manual</div>
          <select value={jogoSelecionado} onChange={e => setJogoSelecionado(e.target.value)}
            style={{ width: "100%", background: "#1a2234", border: "1px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "8px 12px", fontSize: 13, marginBottom: 8 }}>
            <option value="">Selecione o jogo...</option>
            {JOGOS_TODOS.map(j => (
              <option key={j.id} value={j.id}>{j.time_a} × {j.time_b} ({j.grupo}){resultadosEdit[j.id] ? ` ✓ ${resultadosEdit[j.id].placar_a}-${resultadosEdit[j.id].placar_b}` : ""}</option>
            ))}
          </select>
          {jogoSelecionado && <FormResultadoAdmin jogo={JOGOS_GRUPOS.find(j => j.id === jogoSelecionado)} resultadoSalvo={resultadosEdit[jogoSelecionado]} onSalvar={handleSalvarResultado} />}
        </Card>
      )}

      {abaAdmin === "participantes" && (
        <Card style={{ border: "2px solid #FFD70044" }}>
          <div style={{ color: "#FFD700", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Participantes do Grupo</div>
          {carregandoPart ? (
            <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", padding: 12 }}>Carregando...</div>
          ) : participantes.length === 0 ? (
            <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", padding: 12 }}>Nenhum participante.</div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {participantes.map((p, i) => (
                <div key={p.nome || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderBottom: "1px solid #1E2A4510" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#0033A0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                    {p.nome?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1, color: "#F0F4FF", fontWeight: 600, fontSize: 14 }}>{p.nome}</div>
                  <button onClick={() => handleExcluirParticipante(p.nome)} style={{ background: "transparent", border: "none", color: "#C8102E", fontSize: 16, cursor: "pointer", padding: "4px" }} title="Excluir participante">{"\uD83D\uDDD1\uFE0F"}</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ color: "#8B9CC8", fontSize: 11, marginTop: 10, textAlign: "center" }}>Total: {participantes.length} participante{participantes.length !== 1 ? "s" : ""}</div>
        </Card>
      )}

      {abaAdmin === "convites" && (
        <Card style={{ border: "2px solid #10b98144" }}>
          <div style={{ color: "#10b981", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Convites — {grupo?.nome || "Grupo"}</div>
          {msgConvite && <div style={{ color: msgConvite.startsWith("Erro") ? "#C8102E" : "#10b981", fontSize: 12, marginBottom: 8 }}>{msgConvite}</div>}
          <div style={{ marginBottom: 12, padding: "12px", background: "#0d1b2a", borderRadius: 8, border: "1px solid #1E2A45" }}>
            <div style={{ color: "#10b981", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{"\uD83D\uDD17"} Convidar por Link</div>
            <div style={{ color: "#8B9CC8", fontSize: 11, marginBottom: 10 }}>Gere um link exclusivo para este grupo.</div>
            <button onClick={handleGerarLinkConvite} style={{ background: "#10b981", border: "none", borderRadius: 8, color: "#fff", padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%" }}>+ Gerar Link de Convite</button>
            {linkConvite && (
              <div style={{ background: "#1a2234", border: "1px solid #1E2A45", borderRadius: 8, padding: 10, marginTop: 10 }}>
                <div style={{ color: "#8B9CC8", fontSize: 10, marginBottom: 4 }}>Link gerado:</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input readOnly value={linkConvite} onClick={e => e.target.select()}
                    style={{ flex: 1, background: "#0A0E1A", border: "1px solid #1E2A45", borderRadius: 6, color: "#FFD700", padding: "6px 8px", fontSize: 11, fontWeight: 600 }} />
                  <button onClick={() => { navigator.clipboard.writeText(linkConvite); alert("Link copiado!"); }}
                    style={{ background: "#0033A0", border: "none", borderRadius: 6, color: "#fff", padding: "6px 10px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>Copiar</button>
                </div>
              </div>
            )}
          </div>
          {convites.filter(c => !c.usado).length > 0 && (
            <div>
              <div style={{ color: "#8B9CC8", fontSize: 11, marginBottom: 6 }}>Convites ativos:</div>
              {convites.filter(c => !c.usado).map(c => (
                <div key={c.token} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1E2A4520" }}>
                  <div>
                    <span style={{ color: "#8B9CC8", fontSize: 10, fontFamily: "monospace" }}>{c.token.slice(0, 16)}...</span>
                    <span style={{ color: "#4B5563", fontSize: 9, marginLeft: 6 }}>{c.usos}/{c.max_usos} usos{c.expira_em ? ` · Expira ${new Date(c.expira_em).toLocaleDateString("pt-BR")}` : ""}</span>
                  </div>
                  <button onClick={() => handleRevogarConvite(c.token)} style={{ background: "transparent", border: "1px solid #C8102E44", borderRadius: 6, color: "#C8102E", padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>Revogar</button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {abaAdmin === "config" && (
        <Card style={{ border: "2px solid #0033A044" }}>
          <div style={{ color: "#1a4fd6", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Configurações</div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>Valor da Aposta (R$)</div>
            <input type="number" step="0.50" min="0" value={valorAposta} onChange={e => setValorAposta(e.target.value)} style={{ width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#FFD700", padding: "10px 12px", fontSize: 18, fontWeight: 700 }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>Senha do Administrador</div>
            <input type="password" value={adminSenha} onChange={e => setAdminSenha(e.target.value)} placeholder="Nova senha (vazio = manter)"
              style={{ width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 12px", fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>URL da API</div>
            <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://wheniskickoff.com/data/v1/matches.json"
              style={{ width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#F0F4FF", padding: "10px 12px", fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 6 }}>Bônus geral (pts extras)</div>
            <input type="number" min="0" value={bonusGeral} onChange={e => setBonusGeral(e.target.value)} placeholder="0"
              style={{ width: "100%", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 8, color: "#16a34a", padding: "10px 12px", fontSize: 18, fontWeight: 700 }} />
          </div>
          <Btn onClick={handleSalvarConfig} cor="#0033A0" style={{ width: "100%" }}>Salvar Configuração</Btn>
        </Card>
      )}

      {abaAdmin === "lixeira" && (
        <Card style={{ border: "2px solid #C8102E44" }}>
          <div style={{ color: "#C8102E", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>{"\uD83D\uDDD1\uFE0F"} Lixeira</div>
          {carregandoLixeira ? (
            <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", padding: 12 }}>Carregando...</div>
          ) : cartelasExcluidas.length === 0 ? (
            <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", padding: 12 }}>Nenhuma cartela na lixeira.</div>
          ) : (
            cartelasExcluidas.map(c => (
              <div key={c.id} style={{ background: "#0d1b2a", borderRadius: 8, padding: 12, marginBottom: 8, display: "flex", alignItems: "center", gap: 12, opacity: 0.7 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#F0F4FF", fontWeight: 700, fontSize: 14 }}>{c.participante} — {c.nome || "Cartela"}</div>
                  <div style={{ color: "#8B9CC8", fontSize: 11 }}>{Object.keys(c.palpites || {}).length} palpites · Campeão: {c.campeao || "—"}{c.deleted_at && <> · Excluída em {new Date(c.deleted_at).toLocaleString("pt-BR")}</>}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={async () => { try { await restaurarCartela(c.id); carregarLixeira(); alert("Restaurada!"); } catch (e) { alert(e.message); } }} style={{ background: "#16a34a", border: "none", borderRadius: 6, color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Restaurar</button>
                  <button onClick={async () => { if (!window.confirm("Excluir permanentemente?")) return; try { await excluirCartelaDefinitivo(c.id); carregarLixeira(); alert("Excluída!"); } catch (e) { alert(e.message); } }} style={{ background: "#C8102E", border: "none", borderRadius: 6, color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Excluir</button>
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
  React.useEffect(() => { setGa(resultadoSalvo?.placar_a ?? ""); setGb(resultadoSalvo?.placar_b ?? ""); }, [jogo?.id, resultadoSalvo]);
  if (!jogo) return null;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ color: "#F0F4FF", flex: 1, textAlign: "right", fontWeight: 700 }}>{jogo.time_a}</span>
        <input type="number" inputMode="numeric" value={ga} onChange={e => setGa(e.target.value)} style={{ width: 52, textAlign: "center", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 6, color: "#F0F4FF", padding: "6px 0", fontSize: 18, fontWeight: 800 }} />
        <span style={{ color: "#8B9CC8" }}>{"×"}</span>
        <input type="number" inputMode="numeric" value={gb} onChange={e => setGb(e.target.value)} style={{ width: 52, textAlign: "center", background: "#1a2234", border: "2px solid #1E2A45", borderRadius: 6, color: "#F0F4FF", padding: "6px 0", fontSize: 18, fontWeight: 800 }} />
        <span style={{ color: "#F0F4FF", flex: 1, fontWeight: 700 }}>{jogo.time_b}</span>
      </div>
      <Btn onClick={() => { if (ga !== "" && gb !== "") onSalvar(jogo.id, ga, gb); }} cor="#16a34a" style={{ width: "100%" }}>Salvar</Btn>
    </div>
  );
}
