import React, { useState, useEffect, useMemo } from "react";
import { getISO } from "../utils/bandeiras";

function Flag({ time, size = 18 }) {
  const code = getISO(time);
  if (!code) return null;
  return (
    <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt={time}
      width={Math.round(size * 1.5)} height={size}
      style={{ objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
      onError={(e) => { e.target.style.display = "none"; }} />
  );
}

function parseHorario(jogo) {
  try {
    const dt = new Date(jogo.data_iso + "T" + (jogo.horario || "20:00") + ":00-03:00");
    return dt;
  } catch { return null; }
}

function formatarContagem(ms) {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}min`;
  if (m > 0) return `${m}min ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export function JogosDoDia({ partidas, resultados, palpites }) {
  const [agora, setAgora] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { jogosHoje, proximoJogo } = useMemo(() => {
    if (!partidas || !partidas.length) return { jogosHoje: [], proximoJogo: null };
    const hoje = agora.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });
    const [diaHoje, mesHoje] = hoje.split("/");

    const jogosH = partidas
      .filter(j => {
        if (!j.data_iso) return false;
        const [ano, mes, dia] = j.data_iso.split("-");
        return dia === diaHoje && mes === mesHoje;
      })
      .sort((a, b) => (a.horario || "00:00").localeCompare(b.horario || "00:00"));

    const prox = jogosH.find(j => {
      const dt = parseHorario(j);
      return dt && agora < dt;
    }) || null;

    return { jogosHoje: jogosH, proximoJogo: prox };
  }, [agora, partidas]);

  if (jogosHoje.length === 0) return null;

  const proximoMs = proximoJogo ? parseHorario(proximoJogo) - agora : 0;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 16 }}>📅</span>
          <span style={{ color: "#FFD700", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>JOGOS DE HOJE</span>
        </div>
        {proximoJogo && proximoMs > 0 && (
          <div style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "#FFD700" }}>
            ⏱ {formatarContagem(proximoMs)}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {jogosHoje.map(j => {
          const res = resultados?.[j.id];
          const ok = res?.placar_a !== null && res?.placar_a !== undefined;
          const dt = parseHorario(j);
          const emAndamento = dt && agora >= dt && !ok;
          const ehProximo = proximoJogo?.id === j.id;
          const timeA = j.time_a_nome || "";
          const timeB = j.time_b_nome || "";
          const grupoNome = j.stage_nome || j.grupo_letra || "";
          const horarioStr = j.horario || "";

          return (
            <div key={j.id} style={{
              background: ehProximo ? "linear-gradient(135deg, #0d2a5e, #0a1628)" : "#111827",
              border: `1px solid ${emAndamento ? "#C8102E44" : ehProximo ? "#FFD70044" : "#1E2A45"}`,
              borderRadius: 12, padding: "10px 12px", position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 8, right: 10, fontSize: 9, fontWeight: 700,
                letterSpacing: 0.5, padding: "2px 8px", borderRadius: 999,
                background: ok ? "rgba(22,163,74,0.2)" : emAndamento ? "rgba(200,16,46,0.2)" : ehProximo ? "rgba(255,215,0,0.15)" : "transparent",
                color: ok ? "#4ade80" : emAndamento ? "#f87171" : ehProximo ? "#FFD700" : "transparent",
                border: ok ? "1px solid rgba(22,163,74,0.3)" : emAndamento ? "1px solid rgba(200,16,46,0.3)" : ehProximo ? "1px solid rgba(255,215,0,0.3)" : "none",
              }}>
                {ok ? "✓ Encerrado" : emAndamento ? "● Ao vivo" : ehProximo ? "Próximo" : ""}
              </div>
              <div style={{ fontSize: 9, color: "#8B9CC8", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
                <span>{grupoNome}</span>
                <span>·</span>
                <span style={{ color: emAndamento ? "#f87171" : "#8B9CC8" }}>{horarioStr} BRT</span>
                {j.estadio && <><span>·</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{j.estadio}</span></>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: ok && Number(res.placar_a) > Number(res.placar_b) ? "#FFD700" : "#F0F4FF", textAlign: "right" }}>{timeA}</span>
                  <Flag time={timeA} size={20} />
                </div>
                <div style={{ textAlign: "center", minWidth: 72 }}>
                  {ok ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <span style={{ background: "#0A0E1A", border: "1px solid #FFD70044", borderRadius: 6, width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#FFD700" }}>{res.placar_a}</span>
                      <span style={{ color: "#4B5563", fontSize: 10 }}>×</span>
                      <span style={{ background: "#0A0E1A", border: "1px solid #FFD70044", borderRadius: 6, width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#FFD700" }}>{res.placar_b}</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                      <span style={{ background: "#0A0E1A", border: "1px solid #1E2A45", borderRadius: 6, width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#1E2A45" }}>·</span>
                      <span style={{ color: "#1E2A45", fontSize: 10 }}>×</span>
                      <span style={{ background: "#0A0E1A", border: "1px solid #1E2A45", borderRadius: 6, width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#1E2A45" }}>·</span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Flag time={timeB} size={20} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: ok && Number(res.placar_b) > Number(res.placar_a) ? "#FFD700" : "#F0F4FF" }}>{timeB}</span>
                </div>
              </div>
              {palpites?.[j.id] && (
                <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center", fontSize: 11, color: "#8B9CC8" }}>
                  Seu palpite: {palpites[j.id].gols_a} × {palpites[j.id].gols_b}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
