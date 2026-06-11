import React from "react";
import { ISO } from "../services/jogos";

export function Flag({ pais, size = 24 }) {
  const iso = ISO[pais] || "un";
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt={pais}
      style={{ width: size * 1.4, height: size, objectFit: "cover", borderRadius: 3 }}
    />
  );
}
