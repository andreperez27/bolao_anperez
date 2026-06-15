import React from "react";
import { useAuth } from "../contexts/AuthContext";

export function GroupSelector() {
  const { meusGrupos, grupoAtivo, setGrupoAtivo } = useAuth();

  if (!meusGrupos || meusGrupos.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: "#8B9CC8", fontSize: 11, whiteSpace: "nowrap" }}>Grupo:</span>
      <select
        value={grupoAtivo?.id || ""}
        onChange={(e) => {
          const g = meusGrupos.find((g) => g.id === e.target.value);
          if (g) setGrupoAtivo(g);
        }}
        style={{
          background: "#1a2234",
          border: "1px solid #1E2A45",
          borderRadius: 6,
          color: "#F0F4FF",
          padding: "4px 8px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          maxWidth: 160,
        }}
      >
        {meusGrupos.map((g) => (
          <option key={g.id} value={g.id}>
            {g.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
