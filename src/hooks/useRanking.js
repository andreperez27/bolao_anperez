import { useState, useEffect, useCallback, useRef } from "react";
import { getAdminData, getConfig } from "../services/admin";

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

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30000);
    return () => { mounted.current = false; clearInterval(id); };
  }, [loadData]);

  const updateResultados = useCallback((novos, novoCampeo) => {
    setResultados(novos);
    setCampeoReal(novoCampeo);
  }, []);

  return { resultados, campeoReal, config, updateResultados, loadData };
}
