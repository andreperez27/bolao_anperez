import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { getSession, limparSession, signIn as signInSvc, signUp as signUpSvc, signOut as signOutSvc, verificarSessao as verificarSessaoSvc } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session?.sessao_token) {
      verificarSessaoSvc(session.sessao_token)
        .then((data) => setUser({ profile_id: data.id, nome: data.nome, role_global: data.role_global, sessao_token: session.sessao_token }))
        .catch(() => { limparSession(); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (nome, senha) => {
    const session = await signInSvc({ nome, senha });
    setUser(session);
    return session;
  }, []);

  const signUp = useCallback(async (nome, senha) => {
    if (senha.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres");
    const session = await signUpSvc({ nome, senha });
    setUser(session);
    return session;
  }, []);

  const signOut = useCallback(async () => {
    const session = getSession();
    if (session?.sessao_token) {
      await signOutSvc(session.sessao_token);
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
