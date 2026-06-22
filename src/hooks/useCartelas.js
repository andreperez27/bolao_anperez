import { useState, useEffect, useCallback } from "react";
import { listarPredictions, salvarPrediction, excluirPrediction, validarPrediction } from "../services/predictions";
import { getSession } from "../services/auth";

export function useCartelas(grupoId) {
  const session = getSession();
  const [cartelas, setCartelas] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!grupoId || !session?.profile_id) {
      setCartelas([]);
      return;
    }
    try {
      const data = await listarPredictions(grupoId, session.profile_id);
      setCartelas(Array.isArray(data) ? data : []);
    } catch { setCartelas([]); }
  }, [grupoId, session?.profile_id]);

  useEffect(() => {
    if (!session?.sessao_token) {
      setCartelas([]);
      setLoading(false);
      return;
    }
    let ativo = true;
    async function carregar() {
      setLoading(true);
      await refresh();
      if (ativo) setLoading(false);
    }
    carregar();
    const id = setInterval(carregar, 30000);
    return () => { ativo = false; clearInterval(id); };
  }, [session?.sessao_token, grupoId, refresh]);

  const salvar = async (cartela) => {
    const nova = {
      ...cartela,
      grupoId,
      sessaoToken: session?.sessao_token,
    };
    if (!nova.id) nova.id = "pred_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    nova.participante = session?.nome || nova.participante;
    if (!nova.status) nova.status = "aguardando";
    try {
      await salvarPrediction(nova);
    } catch (e) {
      alert("Erro ao salvar cartela: " + e.message);
      throw e;
    }
    await refresh();
    return nova;
  };

  const deletar = async (id) => {
    if (!session?.sessao_token) return;
    await excluirPrediction(id, session.sessao_token);
    await refresh();
  };

  const validar = async (id, status) => {
    if (!session?.sessao_token) return;
    await validarPrediction(id, session.sessao_token, status);
    await refresh();
  };

  return { cartelas, loading, refresh, salvar, deletar, validar };
}
