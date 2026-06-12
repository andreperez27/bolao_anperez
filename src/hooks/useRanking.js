import { useState, useEffect, useCallback } from "react";
import { getAdminData, getConfig, salvarAdminData } from "../services/admin";
import { parseResultadosDeAPI, fetchResultadosDeURL } from "../utils/parseResultadosAPI";

export function useRanking() {
  const [resultados, setResultados] = useState({});
  const [campeoReal, setCampeoReal] = useState("");
  const [config, setConfigLocal] = useState({ valor_aposta: 20, api_url: "" });
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  const loadData = useCallback(async () => {
    const admin = await getAdminData();
    setResultados(admin.resultados);
    setCampeoReal(admin.campeoReal);
    const cfg = await getConfig();
    setConfigLocal(cfg);
  }, []);

  const autoFetchResultados = useCallback(async (url) => {
    try {
      const matches = await fetchResultadosDeURL(url).catch(() => null);
      if (!matches) return;
      const novos = parseResultadosDeAPI(matches);
      const count = Object.keys(novos).length;
      if (count > 0) {
        const mergeados = { ...resultados, ...novos };
        setResultados(mergeados);
        salvarAdminData(mergeados, campeoReal).catch(() => {});
        setUltimaAtualizacao(new Date());
      }
    } catch {}
  }, [resultados, campeoReal]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      const admin = await getAdminData();
      if (!ativo) return;
      setResultados(admin.resultados);
      setCampeoReal(admin.campeoReal);
      const cfg = await getConfig();
      if (ativo) setConfigLocal(cfg);
    }

    carregar();
    const id = setInterval(carregar, 30000);
    return () => { ativo = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    if (!config.api_url) return;
    autoFetchResultados(config.api_url);
    const id = setInterval(() => autoFetchResultados(config.api_url), 120000);
    return () => clearInterval(id);
  }, [config.api_url, autoFetchResultados]);

  const updateResultados = useCallback((novos, novoCampeo) => {
    setResultados(novos);
    setCampeoReal(novoCampeo);
  }, []);

  return { resultados, campeoReal, config, updateResultados, loadData, ultimaAtualizacao };
}
