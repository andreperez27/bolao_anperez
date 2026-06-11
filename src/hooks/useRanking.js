import { useState, useEffect, useCallback } from "react";
import { getAdminData, getConfig } from "../services/admin";

export function useRanking() {
  const [resultados, setResultados] = useState({});
  const [campeoReal, setCampeoReal] = useState("");
  const [config, setConfigLocal] = useState({ valor_aposta: 20, api_url: "" });

  const loadData = useCallback(async () => {
    const admin = await getAdminData();
    setResultados(admin.resultados);
    setCampeoReal(admin.campeoReal);
    const cfg = await getConfig();
    setConfigLocal(cfg);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateResultados = useCallback((novos, novoCampeo) => {
    setResultados(novos);
    setCampeoReal(novoCampeo);
  }, []);

  return { resultados, campeoReal, config, updateResultados, loadData };
}
