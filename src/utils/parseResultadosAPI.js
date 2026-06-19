import { JOGOS_TODOS, normalizarNomePais } from "../services/jogos";

export const API_URLS = [
  "https://raw.githubusercontent.com/openfootball/world-cup.json/master/2026/worldcup.json",
  "https://worldcup26.ir/get/games",
  "https://worldcupjson.net/matches",
];

export const API_URL_PADRAO = API_URLS[0];

function extrairMatches(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.matches)) return data.matches;
  return data.games || data.data || data.results || [];
}

function lerTimes(m) {
  if (typeof m.team1 === "string") return [m.team1, m.team2];
  const homeStr = m.home_name || m.home_team_name_en || "";
  const awayStr = m.away_name || m.away_team_name_en || "";
  if (homeStr) return [homeStr, awayStr];
  const home = m.home_team || m.homeTeam || {};
  const away = m.away_team || m.awayTeam || {};
  return [
    home.name || home.country || home.team_name || "",
    away.name || away.country || away.team_name || "",
  ];
}

function lerPlacar(m) {
  if (m.score && m.score.ft && Array.isArray(m.score.ft) && m.score.ft.length === 2) {
    return [m.score.ft[0], m.score.ft[1]];
  }
  if (m.score_home !== undefined) return [m.score_home, m.score_away];
  var ga = m.home_score !== undefined ? m.home_score :
           m.goals_home !== undefined ? m.goals_home :
           m.homeScore;
  var gb = m.away_score !== undefined ? m.away_score :
           m.goals_away !== undefined ? m.goals_away :
           m.awayScore;
  return [ga, gb];
}

function finalizado(m) {
  if (m.score && m.score.ft && Array.isArray(m.score.ft)) return true;
  if (m.finished === true || m.finished === "TRUE") return true;
  var st = (m.status || m.matchStatus || m.match_status || "").toLowerCase();
  return ["finished", "ft", "completed", "fim", "encerrado", "full-time"].includes(st);
}

export function parseResultadosDeAPI(data) {
  var novos = {};
  var matches = extrairMatches(data);
  if (!matches.length) return novos;

  matches.forEach(function(m) {
    if (!finalizado(m)) return;
    var times = lerTimes(m);
    var rawA = times[0];
    var rawB = times[1];
    if (!rawA || !rawB) return;
    var placar = lerPlacar(m);
    var ga = placar[0];
    var gb = placar[1];
    if (ga === null || ga === undefined || gb === null || gb === undefined) return;

    var nomeA = normalizarNomePais(rawA.trim());
    var nomeB = normalizarNomePais(rawB.trim());

    JOGOS_TODOS.forEach(function(j) {
      var jA = normalizarNomePais(j.time_a).toLowerCase();
      var jB = normalizarNomePais(j.time_b).toLowerCase();
      var aLow = nomeA.toLowerCase();
      var bLow = nomeB.toLowerCase();
      if (
        (jA.includes(aLow) || aLow.includes(jA)) &&
        (jB.includes(bLow) || bLow.includes(jB))
      ) {
        novos[j.id] = { placar_a: Number(ga), placar_b: Number(gb) };
      }
    });
  });

  return novos;
}

export async function fetchResultadosDeURL(url) {
  try {
    var res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (res.ok) return await res.json();
  } catch(e) {}

  var proxies = [
    "https://corsproxy.io/?" + encodeURIComponent(url),
    "https://api.allorigins.win/raw?url=" + encodeURIComponent(url),
  ];
  for (var i = 0; i < proxies.length; i++) {
    try {
      var r = await fetch(proxies[i], { signal: AbortSignal.timeout(8000) });
      if (r.ok) return await r.json();
    } catch(e) {}
  }

  throw new Error("Nao foi possivel acessar: " + url);
}
