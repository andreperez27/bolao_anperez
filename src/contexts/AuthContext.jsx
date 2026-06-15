import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { getSession, limparSession } from "../services/auth";
import { getJogador } from "../services/jogadores";
import { listarGrupos } from "../services/grupos";

const AuthContext = createContext(null);
const GRUPO_STORAGE_KEY = "bolao_grupo_ativo";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [jogador, setJogador] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [meusGrupos, setMeusGrupos] = useState([]);
  const [grupoAtivo, setGrupoAtivoState] = useState(() => {
    const saved = localStorage.getItem(GRUPO_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const carregarGrupos = useCallback(async (nome) => {
    try {
      const grupos = await listarGrupos(nome);
      setMeusGrupos(grupos || []);
      const saved = localStorage.getItem(GRUPO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const aindaExiste = (grupos || []).find((g) => g.id === parsed.id);
        if (aindaExiste) return;
      }
      if (grupos?.length > 0) {
        const alvo = grupos[0];
        localStorage.setItem(GRUPO_STORAGE_KEY, JSON.stringify(alvo));
        setGrupoAtivoState(alvo);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      setIsAdmin(session.isAdmin === true);
      if (session.nome && !session.isAdmin) {
        getJogador(session.nome).then((p) => {
          setJogador(p);
          carregarGrupos(session.nome);
        }).catch(() => {});
      }
    }
    setLoading(false);
  }, [carregarGrupos]);

  const setGrupoAtivo = useCallback((grupo) => {
    localStorage.setItem(GRUPO_STORAGE_KEY, JSON.stringify(grupo));
    setGrupoAtivoState(grupo);
  }, []);

  const signOut = useCallback(async () => {
    limparSession();
    setUser(null);
    setJogador(null);
    setIsAdmin(false);
    setMeusGrupos([]);
    localStorage.removeItem(GRUPO_STORAGE_KEY);
    setGrupoAtivoState(null);
  }, []);

  const refreshJogador = useCallback(async () => {
    const session = getSession();
    if (session?.nome && !session.isAdmin) {
      const p = await getJogador(session.nome).catch(() => null);
      setJogador(p);
      carregarGrupos(session.nome);
    }
  }, [carregarGrupos]);

  const refreshUser = useCallback(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      setIsAdmin(session.isAdmin === true);
      if (session.nome && !session.isAdmin) {
        getJogador(session.nome).then((p) => {
          setJogador(p);
          carregarGrupos(session.nome);
        }).catch(() => {});
      }
    }
  }, [carregarGrupos]);

  return (
    <AuthContext.Provider
      value={{
        user,
        jogador,
        isAdmin,
        loading,
        meusGrupos,
        grupoAtivo,
        setGrupoAtivo,
        signOut,
        refreshJogador,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
