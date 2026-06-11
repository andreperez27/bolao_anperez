import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { getSession, limparSession } from "../services/auth";
import { getJogador } from "../services/jogadores";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [jogador, setJogador] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      setIsAdmin(session.isAdmin === true);
      if (session.nome && !session.isAdmin) {
        getJogador(session.nome).then((p) => setJogador(p)).catch(() => {});
      }
    }
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    limparSession();
    setUser(null);
    setJogador(null);
    setIsAdmin(false);
  }, []);

  const refreshJogador = useCallback(async () => {
    const session = getSession();
    if (session?.nome && !session.isAdmin) {
      const p = await getJogador(session.nome).catch(() => null);
      setJogador(p);
    }
  }, []);

  const refreshUser = useCallback(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      setIsAdmin(session.isAdmin === true);
      if (session.nome && !session.isAdmin) {
        getJogador(session.nome).then((p) => setJogador(p)).catch(() => {});
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        jogador,
        isAdmin,
        loading,
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
