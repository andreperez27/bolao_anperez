import { JOGOS_TODOS, normalizarNomePais } from "../services/jogos";

export function parseResultadosDeAPI(matches) {
  const novos = {};
  if (!Array.isArray(matches)) return novos;

  matches.forEach((m) => {
    let homeName = m.home_name || "";
    let awayName = m.away_name || "";
    let homeGoals = m.score_home;
    let awayGoals = m.score_away;
    let finalizado = false;

    if (!homeName) {
      homeName = m.home_team_name_en || "";
    }
    if (!awayName) {
      awayName = m.away_team_name_en || "";
    }
    if (!homeName) {
      const home = m.home_team || m.team1 || m.homeTeam || {};
      homeName = home.name || home.country || "";
    }
    if (!awayName) {
      const away = m.away_team || m.team2 || m.awayTeam || {};
      awayName = away.name || away.country || "";
    }

    if (homeGoals === undefined) {
      homeGoals = m.home_score ?? m.goals_home ?? m.homeTeam?.goals ?? m.score?.fullTime?.home;
    }
    if (awayGoals === undefined) {
      awayGoals = m.away_score ?? m.goals_away ?? m.awayTeam?.goals ?? m.score?.fullTime?.away;
    }

    const statusRaw = (m.status || m.matchStatus || "").toLowerCase();
    if (["finished", "ft", "completed", "encerrado", "fim"].includes(statusRaw)) {
      finalizado = true;
    } else if (m.finished === "TRUE" || m.finished === true) {
      finalizado = true;
    }

    homeName = normalizarNomePais(homeName);
    awayName = normalizarNomePais(awayName);

    if (homeGoals === null || homeGoals === undefined || awayGoals === null || awayGoals === undefined) return;
    if (!finalizado) return;

    JOGOS_TODOS.forEach((j) => {
      const nomeA = normalizarNomePais(j.time_a);
      const nomeB = normalizarNomePais(j.time_b);
      if (
        (nomeA.toLowerCase().includes(homeName.toLowerCase()) || homeName.toLowerCase().includes(nomeA.toLowerCase())) &&
        (nomeB.toLowerCase().includes(awayName.toLowerCase()) || awayName.toLowerCase().includes(nomeB.toLowerCase()))
      ) {
        novos[j.id] = { placar_a: Number(homeGoals), placar_b: Number(awayGoals) };
      }
    });
  });

  return novos;
}

const CORS_PROXIES = [
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

export async function fetchResultadosDeURL(url) {
  let lastErr;
  for (const proxyFn of CORS_PROXIES) {
    const proxyUrl = proxyFn(url);
    console.log("Tentando:", proxyUrl.slice(0, 80) + "...");
    try {
      const res = await fetch(proxyUrl, { mode: "cors" });
      if (!res.ok) { lastErr = new Error(`HTTP ${res.status}`); continue; }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.matches || data.games || data.data || data.results || [];
      if (arr.length > 0) { console.log(`API: ${arr.length} partidas`); return arr; }
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("Nenhum proxy CORS disponível");
}
