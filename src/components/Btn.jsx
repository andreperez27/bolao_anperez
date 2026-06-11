import React from "react";

export function Btn({ children, onClick, cor = "#0033A0", disabled = false, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#333" : cor,
        color: disabled ? "#666" : "#fff",
        border: "none",
        borderRadius: 8,
        padding: "10px 20px",
        fontWeight: 700,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "opacity .15s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
