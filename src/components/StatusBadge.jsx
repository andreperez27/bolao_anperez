import React from "react";

export function StatusBadge({ status }) {
  const config = {
    validada: { cor: "#16a34a", label: "Válida" },
    aguardando: { cor: "#f59e0b", label: "Aguardando" },
    rejeitada: { cor: "#dc2626", label: "Rejeitada" },
  };
  const c = config[status] || config.aguardando;
  return (
    <span
      style={{
        background: c.cor + "22",
        color: c.cor,
        border: `1px solid ${c.cor}44`,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {c.label}
    </span>
  );
}
