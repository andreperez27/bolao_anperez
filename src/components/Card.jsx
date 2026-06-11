import React from "react";

export function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1E2A45",
        borderRadius: 12,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
