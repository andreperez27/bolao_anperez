import { useState, useEffect, useCallback } from "react";
import { listCartelas, salvarCartela, deletarCartela, validarCartela } from "../services/cartelas";
import { useAuth } from "../contexts/AuthContext";

export function useCartelas() {
  const { user, jogador } = useAuth();
  const [cartelas, setCartelas] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCartelas();
      setCartelas(data || []);
    } catch {
      setCartelas([]);
    }
    setLoading(false);
  }, []);

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
        const data = await listCartelas();
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
  }, [user]);

  const salvar = async (cartela) => {
    const nova = { ...cartela };
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

  const deletar = async (cartelaId) => {
    await deletarCartela(cartelaId);
    await refresh();
  };

  const validar = async (cartelaId, status) => {
    await validarCartela(cartelaId, status);
    await refresh();
  };

  return { cartelas, loading, refresh, salvar, deletar, validar };
}
