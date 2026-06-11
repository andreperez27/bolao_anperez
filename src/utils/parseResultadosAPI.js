import { JOGOS_TODOS, normalizarNomePais } from "../services/jogos";

export function parseResultadosDeAPI(matches) {
  const novos = {};
  if (!Array.isArray(matches)) return novos;

  matches.forEach((m) => {
    const home = m.home_team || m.team1 || m.homeTeam || {};
    const away = m.away_team || m.team2 || m.awayTeam || {};
    const homeName = normalizarNomePais(home.name || home.country || "");
    const awayName = normalizarNomePais(away.name || away.country || "");

    const homeGoals = m.home_score ?? m.goals_home ?? m.homeTeam?.goals ?? m.score?.fullTime?.home;
    const awayGoals = m.away_score ?? m.goals_away ?? m.awayTeam?.goals ?? m.score?.fullTime?.away;
    if (homeGoals === null || homeGoals === undefined || awayGoals === null || awayGoals === undefined) return;

    const status = (m.status || m.matchStatus || "").toLowerCase();
    if (status && !["finished", "ft", "completed", "encerrado", "fim"].includes(status)) return;

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

export async function fetchResultadosDeURL(url) {
  let res = await fetch(url).catch(() => null);
  if (!res || !res.ok) {
    res = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url));
    if (!res || !res.ok) throw new Error("HTTP " + (res?.status || "sem resposta"));
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data.matches || data.data || data.results || [];
}
