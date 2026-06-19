import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGrupo } from "../contexts/GrupoContext";

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function RequireSuperAdmin({ children }) {
  const { isSuperAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return children;
}

export function RequireGroupAdmin({ children }) {
  const { user, isGroupAdmin, grupoId: userGrupoId, loading } = useAuth();
  const { grupo } = useGrupo();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const grupoMatch = userGrupoId && grupo && userGrupoId === grupo.id;
  if (!isGroupAdmin || !grupoMatch) return <Navigate to="/" replace />;
  return children;
}

export function RequireParticipant({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
