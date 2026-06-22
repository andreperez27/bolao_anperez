import React from "react";
import { getISO, normalizarNomePais } from "../utils/bandeiras";

export function Flag({ pais, size = 24 }) {
  const nome = normalizarNomePais(pais);
  const iso = getISO(nome) || "un";
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt={nome}
      style={{ width: size * 1.4, height: size, objectFit: "cover", borderRadius: 3 }}
    />
  );
}
