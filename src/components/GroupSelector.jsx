import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarGruposPublicos } from "../services/groups";
import { useGrupo } from "../contexts/GrupoContext";

export function GroupSelector() {
  const { grupo } = useGrupo();
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState([]);

  useEffect(() => {
    listarGruposPublicos()
      .then(setGrupos)
      .catch(() => setGrupos([]));
  }, []);

  if (!grupos || grupos.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: "#8B9CC8", fontSize: 11, whiteSpace: "nowrap" }}>Grupo:</span>
      <select
        value={grupo?.slug || ""}
        onChange={(e) => navigate("/" + e.target.value + "/ranking")}
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
        {grupos.map((g) => (
          <option key={g.slug} value={g.slug}>
            {g.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
