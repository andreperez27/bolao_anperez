import { useState, useEffect, useCallback, useRef } from "react";
import { getAdminData, getConfig, salvarAdminData } from "../services/admin";
import { JOGOS_TODOS } from "../services/jogos";

export function useRanking() {
  const [resultados, setResultados] = useState({});
  const [campeoReal, setCampeoReal] = useState("");
  const [config, setConfigLocal] = useState({ valor_aposta: 20, api_url: "" });
  const mounted = useRef(true);

  const loadData = useCallback(async () => {
    const admin = await getAdminData();
    if (!mounted.current) return;
    setResultados(admin.resultados);
    setCampeoReal(admin.campeoReal);
    const cfg = await getConfig();
    if (mounted.current) setConfigLocal(cfg);
  }, []);

  const autoFetchResultados = useCallback(async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const matches = Array.isArray(data) ? data : data.matches || data.data || [];
      const novos = {};
      let count = 0;
      matches.forEach((m) => {
        const home = m.home_team || m.team1 || m.homeTeam || {};
        const away = m.away_team || m.team2 || m.awayTeam || {};
        const homeName = home.name || home.country || "";
        const awayName = away.name || away.country || "";
        const homeGoals = m.home_score ?? m.goals_home ?? m.homeTeam?.goals ?? m.score?.fullTime?.home;
        const awayGoals = m.away_score ?? m.goals_away ?? m.awayTeam?.goals ?? m.score?.fullTime?.away;
        if (homeGoals === null || homeGoals === undefined || awayGoals === null || awayGoals === undefined) return;
        JOGOS_TODOS.forEach((j) => {
          if (
            j.time_a.toLowerCase().includes(homeName.toLowerCase()) &&
            j.time_b.toLowerCase().includes(awayName.toLowerCase())
          ) {
            novos[j.id] = { placar_a: Number(homeGoals), placar_b: Number(awayGoals) };
            count++;
          }
        });
      });
      if (count > 0) {
        const mergeados = { ...resultados, ...novos };
        setResultados(mergeados);
        salvarAdminData(mergeados, campeoReal).catch(() => {});
      }
    } catch {}
  }, [resultados, campeoReal]);

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30000);
    return () => { mounted.current = false; clearInterval(id); };
  }, [loadData]);

  useEffect(() => {
    if (!config.api_url) return;
    autoFetchResultados(config.api_url);
    const id = setInterval(() => autoFetchResultados(config.api_url), 300000);
    return () => clearInterval(id);
  }, [config.api_url, autoFetchResultados]);

  const updateResultados = useCallback((novos, novoCampeo) => {
    setResultados(novos);
    setCampeoReal(novoCampeo);
  }, []);

  return { resultados, campeoReal, config, updateResultados, loadData };
}
