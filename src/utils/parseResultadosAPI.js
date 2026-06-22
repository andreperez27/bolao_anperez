import { normalizarNomePais } from "../utils/bandeiras";

export const API_URLS = [
  "https://raw.githubusercontent.com/openfootball/world-cup.json/master/2026/worldcup.json",
  "https://worldcupjson.net/matches",
  "https://wheniskickoff.com/data/v1/matches.json",
  "https://api.fifa.com/api/v3/calendar/matches?competitionCode=wc&seasonYear=2026&count=200",
];

export const API_URL_PADRAO = API_URLS[0];

function extrairMatches(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.matches)) return data.matches;
  if (Array.isArray(data.rounds)) {
    return data.rounds.flatMap((r) => r.matches || []);
  }
  if (Array.isArray(data.Results)) return data.Results;
  const arr = data.games || data.data || data.results || [];
  return Array.isArray(arr) ? arr : [];
}

function lerTimes(m) {
  if (typeof m.team1 === "string") return [m.team1, m.team2];
  const homeStr = m.home_name || m.home_team_name_en || "";
  const awayStr = m.away_name || m.away_team_name_en || "";
  if (homeStr) return [homeStr, awayStr];
  const home = m.home_team || m.homeTeam || {};
  const away = m.away_team || m.awayTeam || {};
  const n1 = home.name || home.country || home.team_name || "";
  const n2 = away.name || away.country || away.team_name || "";
  if (n1 && n2) return [n1, n2];
  if (m.team1 && typeof m.team1 === "object") return [m.team1.name || "", m.team2?.name || ""];
  return [n1, n2];
}

function lerPlacar(m) {
  if (m.score?.ft && Array.isArray(m.score.ft) && m.score.ft.length === 2) {
    return [m.score.ft[0], m.score.ft[1]];
  }
  if (m.score_home !== undefined) return [m.score_home, m.score_away];
  const ga = m.home_score ?? m.goals_home ?? m.homeTeam?.goals ?? m.score?.fullTime?.home ?? m.homeScore;
  const gb = m.away_score ?? m.goals_away ?? m.awayTeam?.goals ?? m.score?.fullTime?.away ?? m.awayScore;
  return [ga, gb];
}

function finalizado(m) {
  if (m.score?.ft && Array.isArray(m.score.ft)) return true;
  if (m.finished === true || m.finished === "TRUE") return true;
  const st = (m.status || m.matchStatus || m.match_status || "").toLowerCase();
  return ["finished", "ft", "completed", "fim", "encerrado", "full-time"].includes(st);
}

export function parseResultadosDeAPI(data, partidas = []) {
  const novos = {};
  const matches = extrairMatches(data);
  console.log(`API: ${matches.length} partidas brutas`);
  if (!matches.length) {
    console.log("API: dados recebidos:", JSON.stringify(data).slice(0, 300));
    return novos;
  }

  const lista = Array.isArray(partidas) && partidas.length ? partidas : [];

  matches.forEach((m) => {
    if (!finalizado(m)) return;
    const [rawA, rawB] = lerTimes(m);
    if (!rawA || !rawB) { console.log("API: times nao reconhecidos", JSON.stringify(m).slice(0, 150)); return; }
    const [ga, gb] = lerPlacar(m);
    if (ga === null || ga === undefined || gb === null || gb === undefined) return;

    const nomeA = normalizarNomePais(rawA.trim());
    const nomeB = normalizarNomePais(rawB.trim());

    lista.forEach((j) => {
      const jA = normalizarNomePais(j.time_a_nome || j.time_a).toLowerCase();
      const jB = normalizarNomePais(j.time_b_nome || j.time_b).toLowerCase();
      const aLow = nomeA.toLowerCase();
      const bLow = nomeB.toLowerCase();
      if (
        (jA.includes(aLow) || aLow.includes(jA)) &&
        (jB.includes(bLow) || bLow.includes(jB))
      ) {
        novos[j.id] = { placar_a: Number(ga), placar_b: Number(gb) };
      }
    });
  });

  console.log(`API: ${Object.keys(novos).length} novos resultados`);
  return novos;
}

async function tentarFetch(u) {
  try {
    const res = await fetch(u, { signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" } });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("tentarFetch falhou para", u.slice(0, 60), e.name === "TypeError" ? `(${e.message})` : e.message);
  }
  return null;
}

const CORS_PROXIES = [
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

async function tentarComProxy(u) {
  for (const proxyFn of CORS_PROXIES) {
    const proxyUrl = proxyFn(u);
    console.log("Tentando proxy:", proxyUrl.slice(0, 80) + "...");
    try {
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
      if (res.ok) return await res.json();
    } catch {}
  }
  return null;
}

const URL_BLOCKLIST = ["worldcup26.ir", "fnqnlajohfvcvatvznkd"];

export async function fetchResultadosDeURL(url) {
  const urlsTentar = [];
  [API_URL_PADRAO, url, ...API_URLS].forEach((u) => {
    if (u && !urlsTentar.includes(u) && !URL_BLOCKLIST.some((b) => u.includes(b))) {
      urlsTentar.push(u);
    }
  });
  for (const u of urlsTentar) {
    console.log("Tentando:", u.slice(0, 100) + "...");
    const data = await tentarFetch(u);
    if (data) { console.log("OK direto:", u.slice(0, 60)); return data; }
    const prox = await tentarComProxy(u);
    if (prox) { console.log("OK via proxy:", u.slice(0, 60)); return prox; }
    console.log("Falhou:", u.slice(0, 60));
  }
  throw new Error("Nenhuma API respondeu");
}
