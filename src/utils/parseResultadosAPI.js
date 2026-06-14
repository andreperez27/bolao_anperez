import { JOGOS_TODOS, normalizarNomePais } from "../services/jogos";

export function parseResultadosDeAPI(matches) {
  const novos = {};
  if (!Array.isArray(matches)) return novos;

  matches.forEach((m) => {
    let homeName = m.home_name || "";
    let awayName = m.away_name || "";
    let homeGoals = m.score_home;
    let awayGoals = m.score_away;
    let statusRaw = (m.status || "").toLowerCase();

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
    if (!statusRaw) {
      statusRaw = (m.status || m.matchStatus || "").toLowerCase();
    }

    homeName = normalizarNomePais(homeName);
    awayName = normalizarNomePais(awayName);

    if (homeGoals === null || homeGoals === undefined || awayGoals === null || awayGoals === undefined) return;
    if (statusRaw && !["finished", "ft", "completed", "encerrado", "fim"].includes(statusRaw)) return;

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
  console.log("Buscando:", url);
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`URL:\n${url}\nHTTP ${res.status} ${res.statusText}\n${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const arr = Array.isArray(data) ? data : data.matches || data.data || data.results || [];
  console.log(`API: ${arr.length} partidas recebidas`);
  return arr;
}
