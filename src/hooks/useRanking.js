import { useState, useEffect, useCallback } from "react";
import { getAdminData, getConfig, salvarAdminData } from "../services/admin";
import { parseResultadosDeAPI, fetchResultadosDeURL } from "../utils/parseResultadosAPI";

const DEFAULT_API_URL = "https://worldcup26.ir/get/games";

export function useRanking(grupoId = "geral") {
  const [resultados, setResultados] = useState({});
  const [campeoReal, setCampeoReal] = useState("");
  const [config, setConfigLocal] = useState({ valor_aposta: 20, api_url: "" });
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  const loadData = useCallback(async () => {
    const admin = await getAdminData(grupoId);
    setResultados(admin.resultados);
    setCampeoReal(admin.campeoReal);
    const cfg = await getConfig(grupoId);
    setConfigLocal(cfg);
  }, [grupoId]);

  const autoFetchResultados = useCallback(async (url) => {
    try {
      const matches = await fetchResultadosDeURL(url).catch(() => null);
      if (!matches) return;
      const novos = parseResultadosDeAPI(matches);
      const count = Object.keys(novos).length;
      if (count > 0) {
        setResultados((prev) => {
          const mergeados = { ...prev, ...novos };
          salvarAdminData(mergeados, campeoReal, grupoId).catch(() => {});
          return mergeados;
        });
        setUltimaAtualizacao(new Date());
      }
    } catch {}
  }, [campeoReal, grupoId]);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      const admin = await getAdminData(grupoId);
      if (!ativo) return;
      setResultados(admin.resultados);
      setCampeoReal(admin.campeoReal);
      const cfg = await getConfig(grupoId);
      if (ativo) setConfigLocal(cfg);
    }
    carregar();
    const id = setInterval(carregar, 30000);
    return () => { ativo = false; clearInterval(id); };
  }, [grupoId]);

  useEffect(() => {
    const url = config.api_url || DEFAULT_API_URL;
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
