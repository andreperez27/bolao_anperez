import { useState, useEffect, useCallback } from "react";
import { buscarResultadosEdicao } from "../services/competitions";
import { useGrupo } from "../contexts/GrupoContext";

export function useRanking(grupoId) {
  const { edition } = useGrupo();
  const [resultados, setResultados] = useState({});
  const [campeoReal, setCampeoReal] = useState("");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  const loadData = useCallback(async () => {
    if (!edition?.edition_id) return;
    try {
      const lista = await buscarResultadosEdicao(edition.edition_id);
      if (!Array.isArray(lista)) return;
      const map = {};
      for (const r of lista) {
        if (r.match_id) {
          map[r.match_id] = { placar_a: r.placar_a, placar_b: r.placar_b };
        }
      }
      setResultados(map);
      setUltimaAtualizacao(new Date());
    } catch {}
  }, [edition?.edition_id]);

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30000);
    return () => clearInterval(id);
  }, [loadData]);

  const updateResultados = useCallback((novos, novoCampeo) => {
    setResultados(novos);
    setCampeoReal(novoCampeo || "");
  }, []);

  return { resultados, campeoReal, updateResultados, loadData, ultimaAtualizacao };
}
