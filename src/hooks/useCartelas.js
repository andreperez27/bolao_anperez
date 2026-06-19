import { useState, useEffect, useCallback } from "react";
import { listCartelas, salvarCartela, deletarCartela, validarCartela } from "../services/cartelas";
import { useAuth } from "../contexts/AuthContext";

export function useCartelas(grupoId) {
  const { user, jogador, grupoId: userGrupoId } = useAuth();
  const resolvedGrupoId = grupoId || userGrupoId || '00000000-0000-0000-0000-000000000000';
  const [cartelas, setCartelas] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await listCartelas(resolvedGrupoId);
      setCartelas(data || []);
    } catch {
      setCartelas([]);
    }
  }, [resolvedGrupoId]);

  useEffect(() => {
    if (!user) {
      setCartelas([]);
      setLoading(false);
      return;
    }
    let ativo = true;
    async function carregar() {
      setLoading(true);
      try {
        const data = await listCartelas(resolvedGrupoId);
        if (ativo) setCartelas(data || []);
      } catch {
        if (ativo) setCartelas([]);
      }
      if (ativo) setLoading(false);
    }
    carregar();
    const id = setInterval(carregar, 30000);
    return () => {
      ativo = false;
      clearInterval(id);
    };
  }, [user, resolvedGrupoId]);

  const salvar = async (cartela) => {
    const nova = { ...cartela, grupo_id: resolvedGrupoId };
    if (!nova.id) nova.id = "cart_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    nova.participante = jogador?.nome || user?.nome || nova.participante;
    if (!nova.status) nova.status = "aguardando";
    if (!nova.created_at) nova.created_at = new Date().toISOString();
    nova.updated_at = new Date().toISOString();
    try {
      await salvarCartela(nova);
    } catch (e) {
      alert("Erro ao salvar cartela: " + e.message);
      throw e;
    }
    await refresh();
    return nova;
  };

  const deletar = async (id) => { await deletarCartela(id); await refresh(); };
  const validar = async (id, status) => { await validarCartela(id, status); await refresh(); };

  return { cartelas, loading, refresh, salvar, deletar, validar };
}
