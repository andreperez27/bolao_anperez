import React, { useState, useCallback, useEffect } from "react";
import { Card } from "./Card";
import { Btn } from "./Btn";
import { StatusBadge } from "./StatusBadge";
import { JOGOS_TODOS, JOGOS_GRUPOS, TODOS_TIMES } from "../services/jogos";
import { salvarAdminData, salvarConfig } from "../services/admin";
import { listJogadores, deletarJogador } from "../services/jogadores";
import { useAuth } from "../contexts/AuthContext";

export function AdminPanel({
  cartelas,
  resultados,
  campeoReal,
  onValidarCartela,
  onResultadosChange,
}) {
  const { isAdmin } = useAuth();
  const [abaAdmin, setAbaAdmin] = useState("validar");
  const [resultadosEdit, setResultadosEdit] = useState(resultados || {});
  const [campeoRealEdit, setCampeoRealEdit] = useState(campeoReal || "");
  const [jogoSelecionado, setJogoSelecionado] = useState("");
  const [participantes, setParticipantes] = useState([]);
  const [carregandoPart, setCarregandoPart] = useState(false);
  const [valorAposta, setValorAposta] = useState(20);
  const [apiUrl, setApiUrl] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [msgBusca, setMsgBusca] = useState("");
  const [adminSenha, setAdminSenha] = useState("");
  const [bonusGeral, setBonusGeral] = useState(0);

  useEffect(() => { setResultadosEdit(resultados || {}); }, [resultados]);
  useEffect(() => { setCampeoRealEdit(campeoReal || ""); }, [campeoReal]);
  useEffect(() => {
    import("../services/admin").then((mod) =>
      mod.getConfig().then((cfg) => {
        setValorAposta(cfg.valor_aposta);
        setApiUrl(cfg.api_url);
        setBonusGeral(cfg.bonus_geral || 0);
      })
    );
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
    const url = apiUrl || "https://worldcupjson.net/matches";
    setBuscando(true);
    setMsgBusca("Buscando resultados...");
    try {
      let res = await fetch(url).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url));
        if (!res.ok) throw new Error("HTTP " + res.status);
      }
      const data = await res.json();
      const matches = Array.isArray(data) ? data : data.matches || data.data || [];
      const novos = { ...resultadosEdit };
      let count = 0;
      matches.forEach((m) => {
        const home = m.home_team || m.team1 || m.homeTeam || {};
        const away = m.away_team || m.team2 || m.awayTeam || {};
        const homeName = home.name || home.country || "";
        const awayName = away.name || away.country || "";
        const homeGoals =
          m.home_score ?? m.goals_home ?? m.homeTeam?.goals ?? m.score?.fullTime?.home;
        const awayGoals =
          m.away_score ?? m.goals_away ?? m.awayTeam?.goals ?? m.score?.fullTime?.away;
        if (homeGoals === null || homeGoals === undefined || awayGoals === null || awayGoals === undefined)
          return;
        JOGOS_TODOS.forEach((j) => {
          if (
            j.time_a.toLowerCase().includes(homeName.toLowerCase()) &&
            j.time_b.toLowerCase().includes(awayName.toLowerCase())
          ) {
            if (novos[j.id]?.placar_a !== homeGoals || novos[j.id]?.placar_b !== awayGoals) {
              novos[j.id] = { placar_a: Number(homeGoals), placar_b: Number(awayGoals) };
              count++;
            }
          }
        });
      });
      if (count > 0) {
        setResultadosEdit(novos);
        onResultadosChange(novos, campeoRealEdit);
        setMsgBusca(count + " resultado(s) atualizado(s)!");
      } else {
        setMsgBusca("Nenhum resultado novo encontrado");
      }
    } catch (e) {
      setMsgBusca("Erro: " + e.message + ". Tente manualmente.");
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

  if (!isAdmin) return null;

  const tabs = [
    { key: "validar", label: "Validar" },
    { key: "resultados", label: "Resultados" },
    { key: "participantes", label: "Participantes" },
    { key: "config", label: "Config" },
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
              placeholder="URL da API (ex: https://worldcupjson.net/matches)"
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

      {abaAdmin === "participantes" && (
        <Card style={{ border: "2px solid #FFD70044" }}>
          <div style={{ color: "#FFD700", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
            Participantes Cadastrados
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
              placeholder="https://worldcupjson.net/matches"
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
