import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { getSession, limparSession, signIn as signInSvc, signUp as signUpSvc, signInAdmin as signInAdminSvc } from "../services/auth";
import { getJogador } from "../services/jogadores";
import { useGrupo } from "./GrupoContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { grupoId } = useGrupo();
  const [user, setUser] = useState(null);
  const [jogador, setJogador] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const session = getSession();
    if (session) {
      setUser(session);
      setIsAdmin(session.isAdmin === true);
      if (session.nome && !session.isAdmin) {
        getJogador(session.nome, grupoId).then(setJogador).catch(() => {});
      }
    }
    setLoading(false);
  }, [grupoId]);

  const signIn = useCallback(async (nome, senha) => {
    const data = await signInSvc({ nome, senha, grupoId });
    setUser(data);
    setIsAdmin(false);
    if (data.nome) {
      const p = await getJogador(data.nome, grupoId).catch(() => null);
      setJogador(p);
    }
    return data;
  }, [grupoId]);

  const signUp = useCallback(async (nome, senha) => {
    const data = await signUpSvc({ nome, senha, grupoId });
    setUser(data);
    setIsAdmin(false);
    return data;
  }, [grupoId]);

  const signInAdmin = useCallback(async (senha) => {
    const data = await signInAdminSvc({ senha, grupoId });
    setUser(data);
    setIsAdmin(true);
    return data;
  }, [grupoId]);

  const signOut = useCallback(() => {
    limparSession();
    setUser(null);
    setJogador(null);
    setIsAdmin(false);
  }, []);

  const refreshJogador = useCallback(async () => {
    const session = getSession();
    if (session?.nome && !session.isAdmin) {
      const p = await getJogador(session.nome, grupoId).catch(() => null);
      setJogador(p);
    }
  }, [grupoId]);

  const refreshUser = useCallback(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      setIsAdmin(session.isAdmin === true);
      if (session.nome && !session.isAdmin) {
        getJogador(session.nome, grupoId).then(setJogador).catch(() => {});
      }
    }
  }, [grupoId]);

  return (
    <AuthContext.Provider
      value={{
        user, jogador, isAdmin, loading,
        signIn, signUp, signInAdmin, signOut,
        refreshJogador, refreshUser,
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
