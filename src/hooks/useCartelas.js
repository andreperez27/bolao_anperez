import { useState, useEffect, useCallback, useRef } from "react";
import { listCartelasByUser, listCartelas, salvarCartela, deletarCartela, validarCartela } from "../services/cartelas";
import { useAuth } from "../contexts/AuthContext";

export function useCartelas() {
  const { user, jogador, isAdmin } = useAuth();
  const [cartelas, setCartelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = isAdmin
        ? await listCartelas()
        : user
          ? await listCartelasByUser(user.nome)
          : [];
      if (mounted.current) setCartelas(data || []);
    } catch {
      if (mounted.current) setCartelas([]);
    }
    if (mounted.current) setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (user) {
      refresh();
      const id = setInterval(refresh, 30000);
      return () => { mounted.current = false; clearInterval(id); };
    } else {
      setCartelas([]);
      setLoading(false);
    }
  }, [user, refresh]);

  const salvar = async (cartela) => {
    const nova = { ...cartela };
    if (!nova.id) {
      nova.id = "cart_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    }
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
