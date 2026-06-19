import { useState, useEffect, useCallback, useRef } from "react";
import { getAdminData, getConfig, salvarAdminData } from "../services/admin";
import { parseResultadosDeAPI, fetchResultadosDeURL, API_URLS, API_URL_PADRAO } from "../utils/parseResultadosAPI";

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

  const resultadosRef = useRef({});
  const campeoRef = useRef("");
  useEffect(() => { resultadosRef.current = resultados; }, [resultados]);
  useEffect(() => { campeoRef.current = campeoReal; }, [campeoReal]);

  const autoFetchResultados = useCallback(async (url) => {
    try {
      const data = await fetchResultadosDeURL(url);
      const novos = parseResultadosDeAPI(data);
      const count = Object.keys(novos).length;
      if (count > 0) {
        const mergeados = { ...resultadosRef.current, ...novos };
        setResultados(mergeados);
        salvarAdminData(mergeados, campeoRef.current).catch(() => {});
        setUltimaAtualizacao(new Date());
      }
    } catch {}
  }, []);

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
    const url = config.api_url || API_URL_PADRAO;
    autoFetchResultados(url);
    const id = setInterval(() => autoFetchResultados(url), 120000);
    return () => clearInterval(id);
  }, [config.api_url, autoFetchResultados]);

  const updateResultados = useCallback((novos, novoCampeo) => {
    setResultados(novos);
    setCampeoReal(novoCampeo);
  }, []);

  return { resultados, campeoReal, config, updateResultados, loadData, ultimaAtualizacao };
}
