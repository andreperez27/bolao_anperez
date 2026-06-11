import { useState, useEffect, useCallback } from "react";

// ── Paleta Copa da Anperez ───────────────────────────────────
const C = {
  bg: "#0A0E1A",
  card: "#111827",
  cardBorder: "#1E2A45",
  azul: "#0033A0",
  azulClaro: "#1a4fd6",
  vermelho: "#C8102E",
  dourado: "#FFD700",
  douradoEscuro: "#B8860B",
  verde: "#16a34a",
  verdeClaro: "#22c55e",
  texto: "#F0F4FF",
  textoSec: "#8B9CC8",
  laranja: "#f97316",
};

const STORAGE_KEY_PALPITES = "bolao_palpites_2026";
const STORAGE_KEY_ADMIN = "bolao_admin_key";


// ── Dados dos jogos (Copa 2026 real) ────────────────────────
const JOGOS_GRUPOS = [{"id":"wc2026-0","time_a":"México","time_b":"África do Sul","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"11/06 16:00","grupo":"Grupo A","estadio":"Mexico City","data_iso":"2026-06-11","round":"Matchday 1"},{"id":"wc2026-1","time_a":"Coreia do Sul","time_b":"República Tcheca","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"11/06 23:00","grupo":"Grupo A","estadio":"Guadalajara (Zapopan)","data_iso":"2026-06-11","round":"Matchday 1"},{"id":"wc2026-2","time_a":"República Tcheca","time_b":"África do Sul","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"18/06 13:00","grupo":"Grupo A","estadio":"Atlanta","data_iso":"2026-06-18","round":"Matchday 8"},{"id":"wc2026-3","time_a":"México","time_b":"Coreia do Sul","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"18/06 22:00","grupo":"Grupo A","estadio":"Dallas","data_iso":"2026-06-18","round":"Matchday 8"},{"id":"wc2026-4","time_a":"República Tcheca","time_b":"México","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"24/06 22:00","grupo":"Grupo A","estadio":"Houston","data_iso":"2026-06-24","round":"Matchday 15"},{"id":"wc2026-5","time_a":"África do Sul","time_b":"Coreia do Sul","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"24/06 22:00","grupo":"Grupo A","estadio":"Kansas City","data_iso":"2026-06-24","round":"Matchday 15"},{"id":"wc2026-6","time_a":"Canadá","time_b":"Bosnia & Herzegovina","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"12/06 19:00","grupo":"Grupo B","estadio":"Toronto","data_iso":"2026-06-12","round":"Matchday 2"},{"id":"wc2026-7","time_a":"Qatar","time_b":"Suíça","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"12/06 22:00","grupo":"Grupo B","estadio":"Los Angeles","data_iso":"2026-06-12","round":"Matchday 2"},{"id":"wc2026-8","time_a":"Bosnia & Herzegovina","time_b":"Qatar","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"19/06 16:00","grupo":"Grupo B","estadio":"New York/New Jersey (East Rutherford)","data_iso":"2026-06-19","round":"Matchday 9"},{"id":"wc2026-9","time_a":"Suíça","time_b":"Canadá","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"19/06 19:00","grupo":"Grupo B","estadio":"Philadelphia","data_iso":"2026-06-19","round":"Matchday 9"},{"id":"wc2026-10","time_a":"Bosnia & Herzegovina","time_b":"Suíça","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"25/06 22:00","grupo":"Grupo B","estadio":"Boston","data_iso":"2026-06-25","round":"Matchday 16"},{"id":"wc2026-11","time_a":"Qatar","time_b":"Canadá","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"25/06 22:00","grupo":"Grupo B","estadio":"Seattle","data_iso":"2026-06-25","round":"Matchday 16"},{"id":"wc2026-12","time_a":"Brasil","time_b":"Marrocos","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"13/06 15:00","grupo":"Grupo C","estadio":"New York/New Jersey (East Rutherford)","data_iso":"2026-06-13","round":"Matchday 3"},{"id":"wc2026-13","time_a":"Escócia","time_b":"Haiti","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"13/06 19:00","grupo":"Grupo C","estadio":"Atlanta","data_iso":"2026-06-13","round":"Matchday 3"},{"id":"wc2026-14","time_a":"Brasil","time_b":"Haiti","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"19/06 19:00","grupo":"Grupo C","estadio":"Philadelphia","data_iso":"2026-06-19","round":"Matchday 10"},{"id":"wc2026-15","time_a":"Marrocos","time_b":"Escócia","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"20/06 13:00","grupo":"Grupo C","estadio":"Dallas","data_iso":"2026-06-20","round":"Matchday 10"},{"id":"wc2026-16","time_a":"Escócia","time_b":"Brasil","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"24/06 20:00","grupo":"Grupo C","estadio":"Miami (Miami Gardens)","data_iso":"2026-06-24","round":"Matchday 17"},{"id":"wc2026-17","time_a":"Haiti","time_b":"Marrocos","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"24/06 20:00","grupo":"Grupo C","estadio":"Houston","data_iso":"2026-06-24","round":"Matchday 17"},{"id":"wc2026-18","time_a":"Estados Unidos","time_b":"Turquia","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"12/06 22:00","grupo":"Grupo D","estadio":"Dallas","data_iso":"2026-06-12","round":"Matchday 4"},{"id":"wc2026-19","time_a":"Austrália","time_b":"Paraguai","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"13/06 13:00","grupo":"Grupo D","estadio":"Los Angeles","data_iso":"2026-06-13","round":"Matchday 4"},{"id":"wc2026-20","time_a":"Turquia","time_b":"Paraguai","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"20/06 19:00","grupo":"Grupo D","estadio":"Seattle","data_iso":"2026-06-20","round":"Matchday 11"},{"id":"wc2026-21","time_a":"Austrália","time_b":"Estados Unidos","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"20/06 22:00","grupo":"Grupo D","estadio":"Kansas City","data_iso":"2026-06-20","round":"Matchday 11"},{"id":"wc2026-22","time_a":"Paraguai","time_b":"Austrália","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"26/06 16:00","grupo":"Grupo D","estadio":"Houston","data_iso":"2026-06-26","round":"Matchday 18"},{"id":"wc2026-23","time_a":"Turquia","time_b":"Estados Unidos","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"26/06 16:00","grupo":"Grupo D","estadio":"Atlanta","data_iso":"2026-06-26","round":"Matchday 18"},{"id":"wc2026-24","time_a":"Alemanha","time_b":"Costa do Marfim","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"13/06 13:00","grupo":"Grupo E","estadio":"Philadelphia","data_iso":"2026-06-13","round":"Matchday 5"},{"id":"wc2026-25","time_a":"Equador","time_b":"Curaçao","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"14/06 22:00","grupo":"Grupo E","estadio":"Boston","data_iso":"2026-06-14","round":"Matchday 5"},{"id":"wc2026-26","time_a":"Alemanha","time_b":"Curaçao","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"21/06 13:00","grupo":"Grupo E","estadio":"New York/New Jersey (East Rutherford)","data_iso":"2026-06-21","round":"Matchday 12"},{"id":"wc2026-27","time_a":"Costa do Marfim","time_b":"Equador","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"21/06 16:00","grupo":"Grupo E","estadio":"Seattle","data_iso":"2026-06-21","round":"Matchday 12"},{"id":"wc2026-28","time_a":"Curaçao","time_b":"Costa do Marfim","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"25/06 22:00","grupo":"Grupo E","estadio":"Dallas","data_iso":"2026-06-25","round":"Matchday 19"},{"id":"wc2026-29","time_a":"Equador","time_b":"Alemanha","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"25/06 22:00","grupo":"Grupo E","estadio":"Kansas City","data_iso":"2026-06-25","round":"Matchday 19"},{"id":"wc2026-30","time_a":"Japão","time_b":"Tunísia","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"14/06 16:00","grupo":"Grupo F","estadio":"Kansas City","data_iso":"2026-06-14","round":"Matchday 6"},{"id":"wc2026-31","time_a":"Holanda","time_b":"Sweden","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"14/06 19:00","grupo":"Grupo F","estadio":"Miami (Miami Gardens)","data_iso":"2026-06-14","round":"Matchday 6"},{"id":"wc2026-32","time_a":"Tunísia","time_b":"Holanda","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"21/06 19:00","grupo":"Grupo F","estadio":"Los Angeles","data_iso":"2026-06-21","round":"Matchday 13"},{"id":"wc2026-33","time_a":"Sweden","time_b":"Japão","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"21/06 22:00","grupo":"Grupo F","estadio":"San Francisco Bay Area (Santa Clara)","data_iso":"2026-06-21","round":"Matchday 13"},{"id":"wc2026-34","time_a":"Tunísia","time_b":"Sweden","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"26/06 22:00","grupo":"Grupo F","estadio":"New York/New Jersey (East Rutherford)","data_iso":"2026-06-26","round":"Matchday 20"},{"id":"wc2026-35","time_a":"Holanda","time_b":"Japão","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"26/06 22:00","grupo":"Grupo F","estadio":"Philadelphia","data_iso":"2026-06-26","round":"Matchday 20"},{"id":"wc2026-36","time_a":"Bélgica","time_b":"Egito","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"15/06 13:00","grupo":"Grupo G","estadio":"Houston","data_iso":"2026-06-15","round":"Matchday 7"},{"id":"wc2026-37","time_a":"Nova Zelândia","time_b":"Irã","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"15/06 16:00","grupo":"Grupo G","estadio":"Toronto","data_iso":"2026-06-15","round":"Matchday 7"},{"id":"wc2026-38","time_a":"Irã","time_b":"Bélgica","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"22/06 13:00","grupo":"Grupo G","estadio":"Miami (Miami Gardens)","data_iso":"2026-06-22","round":"Matchday 14"},{"id":"wc2026-39","time_a":"Egito","time_b":"Nova Zelândia","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"22/06 16:00","grupo":"Grupo G","estadio":"Boston","data_iso":"2026-06-22","round":"Matchday 14"},{"id":"wc2026-40","time_a":"Irã","time_b":"Egito","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"26/06 22:00","grupo":"Grupo G","estadio":"San Francisco Bay Area (Santa Clara)","data_iso":"2026-06-26","round":"Matchday 21"},{"id":"wc2026-41","time_a":"Nova Zelândia","time_b":"Bélgica","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"26/06 22:00","grupo":"Grupo G","estadio":"Seattle","data_iso":"2026-06-26","round":"Matchday 21"},{"id":"wc2026-42","time_a":"Espanha","time_b":"Arábia Saudita","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"15/06 19:00","grupo":"Grupo H","estadio":"Dallas","data_iso":"2026-06-15","round":"Matchday 7"},{"id":"wc2026-43","time_a":"Uruguai","time_b":"Cape Verde","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"15/06 22:00","grupo":"Grupo H","estadio":"Los Angeles","data_iso":"2026-06-15","round":"Matchday 7"},{"id":"wc2026-44","time_a":"Arábia Saudita","time_b":"Uruguay","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"22/06 19:00","grupo":"Grupo H","estadio":"San Francisco Bay Area (Santa Clara)","data_iso":"2026-06-22","round":"Matchday 14"},{"id":"wc2026-45","time_a":"Cape Verde","time_b":"Espanha","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"22/06 22:00","grupo":"Grupo H","estadio":"Atlanta","data_iso":"2026-06-22","round":"Matchday 14"},{"id":"wc2026-46","time_a":"Arábia Saudita","time_b":"Cape Verde","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"27/06 22:00","grupo":"Grupo H","estadio":"Toronto","data_iso":"2026-06-27","round":"Matchday 22"},{"id":"wc2026-47","time_a":"Uruguai","time_b":"Espanha","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"27/06 22:00","grupo":"Grupo H","estadio":"Miami (Miami Gardens)","data_iso":"2026-06-27","round":"Matchday 22"},{"id":"wc2026-48","time_a":"França","time_b":"Iraque","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"16/06 13:00","grupo":"Grupo I","estadio":"Seattle","data_iso":"2026-06-16","round":"Matchday 7"},{"id":"wc2026-49","time_a":"Noruega","time_b":"Senegal","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"16/06 16:00","grupo":"Grupo I","estadio":"Kansas City","data_iso":"2026-06-16","round":"Matchday 7"},{"id":"wc2026-50","time_a":"Iraque","time_b":"Noruega","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"23/06 13:00","grupo":"Grupo I","estadio":"Boston","data_iso":"2026-06-23","round":"Matchday 14"},{"id":"wc2026-51","time_a":"Senegal","time_b":"França","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"23/06 16:00","grupo":"Grupo I","estadio":"New York/New Jersey (East Rutherford)","data_iso":"2026-06-23","round":"Matchday 14"},{"id":"wc2026-52","time_a":"Iraque","time_b":"Senegal","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"27/06 22:00","grupo":"Grupo I","estadio":"Houston","data_iso":"2026-06-27","round":"Matchday 23"},{"id":"wc2026-53","time_a":"Noruega","time_b":"França","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"27/06 22:00","grupo":"Grupo I","estadio":"Los Angeles","data_iso":"2026-06-27","round":"Matchday 23"},{"id":"wc2026-54","time_a":"Argentina","time_b":"Argélia","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"16/06 19:00","grupo":"Grupo J","estadio":"Miami (Miami Gardens)","data_iso":"2026-06-16","round":"Matchday 7"},{"id":"wc2026-55","time_a":"Áustria","time_b":"Jordânia","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"16/06 22:00","grupo":"Grupo J","estadio":"Philadelphia","data_iso":"2026-06-16","round":"Matchday 7"},{"id":"wc2026-56","time_a":"Argélia","time_b":"Áustria","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"23/06 19:00","grupo":"Grupo J","estadio":"Dallas","data_iso":"2026-06-23","round":"Matchday 14"},{"id":"wc2026-57","time_a":"Jordânia","time_b":"Argentina","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"23/06 22:00","grupo":"Grupo J","estadio":"San Francisco Bay Area (Santa Clara)","data_iso":"2026-06-23","round":"Matchday 14"},{"id":"wc2026-58","time_a":"Argélia","time_b":"Jordânia","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"28/06 16:00","grupo":"Grupo J","estadio":"Kansas City","data_iso":"2026-06-28","round":"Matchday 24"},{"id":"wc2026-59","time_a":"Áustria","time_b":"Argentina","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"28/06 16:00","grupo":"Grupo J","estadio":"Atlanta","data_iso":"2026-06-28","round":"Matchday 24"},{"id":"wc2026-60","time_a":"Portugal","time_b":"Colômbia","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"17/06 13:00","grupo":"Grupo K","estadio":"Boston","data_iso":"2026-06-17","round":"Matchday 7"},{"id":"wc2026-61","time_a":"Uzbequistão","time_b":"DR Congo","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"17/06 16:00","grupo":"Grupo K","estadio":"Los Angeles","data_iso":"2026-06-17","round":"Matchday 7"},{"id":"wc2026-62","time_a":"Colômbia","time_b":"Uzbequistão","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"24/06 13:00","grupo":"Grupo K","estadio":"Houston","data_iso":"2026-06-24","round":"Matchday 14"},{"id":"wc2026-63","time_a":"DR Congo","time_b":"Portugal","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"24/06 16:00","grupo":"Grupo K","estadio":"Toronto","data_iso":"2026-06-24","round":"Matchday 14"},{"id":"wc2026-64","time_a":"Colômbia","time_b":"DR Congo","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"28/06 16:00","grupo":"Grupo K","estadio":"New York/New Jersey (East Rutherford)","data_iso":"2026-06-28","round":"Matchday 25"},{"id":"wc2026-65","time_a":"Uzbequistão","time_b":"Portugal","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"28/06 16:00","grupo":"Grupo K","estadio":"Philadelphia","data_iso":"2026-06-28","round":"Matchday 25"},{"id":"wc2026-66","time_a":"Inglaterra","time_b":"Panamá","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"17/06 19:00","grupo":"Grupo L","estadio":"San Francisco Bay Area (Santa Clara)","data_iso":"2026-06-17","round":"Matchday 7"},{"id":"wc2026-67","time_a":"Croácia","time_b":"Gana","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"17/06 22:00","grupo":"Grupo L","estadio":"Miami (Miami Gardens)","data_iso":"2026-06-17","round":"Matchday 7"},{"id":"wc2026-68","time_a":"Gana","time_b":"Inglaterra","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"24/06 19:00","grupo":"Grupo L","estadio":"Seattle","data_iso":"2026-06-24","round":"Matchday 14"},{"id":"wc2026-69","time_a":"Panamá","time_b":"Croácia","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"24/06 22:00","grupo":"Grupo L","estadio":"Boston","data_iso":"2026-06-24","round":"Matchday 14"},{"id":"wc2026-70","time_a":"Gana","time_b":"Panamá","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"28/06 22:00","grupo":"Grupo L","estadio":"Dallas","data_iso":"2026-06-28","round":"Matchday 26"},{"id":"wc2026-71","time_a":"Croácia","time_b":"Inglaterra","placar_a":null,"placar_b":null,"status":"AGENDADO","horario_brasilia":"28/06 22:00","grupo":"Grupo L","estadio":"Kansas City","data_iso":"2026-06-28","round":"Matchday 26"}];

const TODOS_TIMES = ["Alemanha","Argentina","Argélia","Arábia Saudita","Austrália","Bosnia & Herzegovina","Brasil","Bélgica","Canadá","Cape Verde","Colômbia","Coreia do Sul","Costa do Marfim","Croácia","Curaçao","DR Congo","Egito","Equador","Escócia","Espanha","Estados Unidos","França","Gana","Haiti","Holanda","Inglaterra","Iraque","Irã","Japão","Jordânia","Marrocos","México","Noruega","Nova Zelândia","Panamá","Paraguai","Portugal","Qatar","República Tcheca","Senegal","Suíça","Suécia","Tunísia","Turquia","Uruguai","Uzbequistão","África do Sul","Áustria"];

// ── Sistema de pontuação ─────────────────────────────────────
function calcularPontos(palpite, resultado) {
  if (!resultado || resultado.placar_a === null) return { pts: 0, tipo: "pendente" };
  const { gols_a: pa, gols_b: pb } = palpite;
  const { placar_a: ra, placar_b: rb } = resultado;
  if (pa === ra && pb === rb) return { pts: 5, tipo: "placar_exato" };
  const resP = pa > pb ? "A" : pa < pb ? "B" : "E";
  const resR = ra > rb ? "A" : ra < rb ? "B" : "E";
  if (resP !== resR) return { pts: 0, tipo: "errou" };
  if (Math.abs(pa - pb) === Math.abs(ra - rb)) return { pts: 4, tipo: "diferenca_certa" };
  if (resP === resR) return { pts: 3, tipo: "vencedor_certo" };
  return { pts: 0, tipo: "errou" };
}

function calcularPontosTotal(palpites, resultados, campeoEscolhido, campeoReal) {
  let total = 0;
  for (const jogoId in palpites) {
    const resultado = resultados[jogoId];
    const { pts } = calcularPontos(palpites[jogoId], resultado);
    total += pts;
  }
  if (campeoReal && campeoEscolhido === campeoReal) total += 15;
  return total;
}

// ── Helpers visuais ──────────────────────────────────────────
const badge = (txt, bg, color = "#fff") => (
  <span style={{ background: bg, color, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>{txt}</span>
);

const tipoPontos = {
  placar_exato: { label: "PLACAR EXATO", cor: C.dourado, pts: 5 },
  diferenca_certa: { label: "DIFERENÇA CERTA", cor: C.verdeClaro, pts: 4 },
  vencedor_certo: { label: "VENCEDOR CERTO", cor: C.verde, pts: 3 },
  errou: { label: "ERROU", cor: C.vermelho, pts: 0 },
  pendente: { label: "AGUARDANDO", cor: C.textoSec, pts: null },
};

// ── Componentes base ─────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: 16, ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, cor = C.azul, disabled = false, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? "#333" : cor, color: disabled ? "#666" : "#fff",
    border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700,
    fontSize: 14, cursor: disabled ? "not-allowed" : "pointer", transition: "opacity .15s",
    ...style
  }}>{children}</button>
);

// ── Bandeira ─────────────────────────────────────────────────
const ISO = {"México":"mx","África do Sul":"za","Coreia do Sul":"kr","República Tcheca":"cz","Canadá":"ca","Bosnia & Herzegovina":"ba","Qatar":"qa","Suíça":"ch","Brasil":"br","Marrocos":"ma","Escócia":"gb-sct","Haiti":"ht","Estados Unidos":"us","Turquia":"tr","Austrália":"au","Paraguai":"py","Alemanha":"de","Costa do Marfim":"ci","Equador":"ec","Curaçao":"cw","Japão":"jp","Tunísia":"tn","Holanda":"nl","Suécia":"se","Bélgica":"be","Egito":"eg","Nova Zelândia":"nz","Irã":"ir","Espanha":"es","Arábia Saudita":"sa","Uruguai":"uy","Cape Verde":"cv","França":"fr","Iraque":"iq","Noruega":"no","Senegal":"sn","Argentina":"ar","Argélia":"dz","Áustria":"at","Jordânia":"jo","Portugal":"pt","Colômbia":"co","Uzbequistão":"uz","DR Congo":"cd","Inglaterra":"gb-eng","Croácia":"hr","Gana":"gh","Panamá":"pa","Sweden":"se"};
const Flag = ({ pais, size = 24 }) => {
  const iso = ISO[pais] || "un";
  return <img src={`https://flagcdn.com/w40/${iso}.png`} alt={pais} style={{ width: size * 1.4, height: size, objectFit: "cover", borderRadius: 3 }} />;
};

// ── Jogo Card ────────────────────────────────────────────────
const JogoCard = ({ jogo, palpite, onChange, disabled }) => {
  const [ga, setGa] = useState(palpite?.gols_a ?? "");
  const [gb, setGb] = useState(palpite?.gols_b ?? "");

  useEffect(() => {
    setGa(palpite?.gols_a ?? "");
    setGb(palpite?.gols_b ?? "");
  }, [palpite]);

  const handle = (side, val) => {
    const n = val === "" ? "" : Math.max(0, Math.min(99, parseInt(val) || 0));
    const newGa = side === "a" ? n : ga;
    const newGb = side === "b" ? n : gb;
    if (side === "a") setGa(n);
    else setGb(n);
    if (newGa !== "" && newGb !== "") onChange(jogo.id, { gols_a: Number(newGa), gols_b: Number(newGb) });
  };

  const salvo = palpite?.gols_a !== undefined;

  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        {badge(jogo.grupo, C.azul)}
        <span style={{ color: C.textoSec, fontSize: 12 }}>{jogo.horario_brasilia}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <Flag pais={jogo.time_a} size={28} />
          <div style={{ color: C.texto, fontSize: 13, fontWeight: 700, marginTop: 4 }}>{jogo.time_a}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="number" min="0" max="99" value={ga} onChange={e => handle("a", e.target.value)}
            disabled={disabled}
            style={{ width: 48, textAlign: "center", fontSize: 20, fontWeight: 800, background: "#1a2234", border: `2px solid ${salvo ? C.verde : C.cardBorder}`, borderRadius: 8, color: C.texto, padding: "6px 0" }} />
          <span style={{ color: C.textoSec, fontSize: 18, fontWeight: 700 }}>×</span>
          <input type="number" min="0" max="99" value={gb} onChange={e => handle("b", e.target.value)}
            disabled={disabled}
            style={{ width: 48, textAlign: "center", fontSize: 20, fontWeight: 800, background: "#1a2234", border: `2px solid ${salvo ? C.verde : C.cardBorder}`, borderRadius: 8, color: C.texto, padding: "6px 0" }} />
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <Flag pais={jogo.time_b} size={28} />
          <div style={{ color: C.texto, fontSize: 13, fontWeight: 700, marginTop: 4 }}>{jogo.time_b}</div>
        </div>
      </div>
      {salvo && <div style={{ textAlign: "center", color: C.verde, fontSize: 11, marginTop: 6 }}>✓ Palpite salvo</div>}
    </Card>
  );
};

// ── Tela de cadastro ─────────────────────────────────────────
const TelaCadastro = ({ onEntrar }) => {
  const [nome, setNome] = useState("");
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>🏆</div>
      <h1 style={{ color: C.dourado, fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: 1 }}>COPA DA ANPEREZ</h1>
      <p style={{ color: C.textoSec, marginBottom: 32, fontSize: 15 }}>Bolão 2026 — Entre e faça seus palpites!</p>
      <Card style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ color: C.texto, fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Seu nome no bolão</div>
        <input value={nome} onChange={e => setNome(e.target.value)}
          placeholder="Ex: Perez, João, Família Silva..."
          onKeyDown={e => e.key === "Enter" && nome.trim() && onEntrar(nome.trim())}
          style={{ width: "100%", background: "#1a2234", border: `2px solid ${C.cardBorder}`, borderRadius: 8, color: C.texto, padding: "10px 14px", fontSize: 16, boxSizing: "border-box", marginBottom: 14 }} />
        <Btn onClick={() => nome.trim() && onEntrar(nome.trim())} style={{ width: "100%" }} disabled={!nome.trim()}>
          Entrar no Bolão →
        </Btn>
      </Card>
      <p style={{ color: C.textoSec, fontSize: 12, marginTop: 24, textAlign: "center" }}>
        ⚽ Acertou o placar: 5 pts &nbsp;|&nbsp; Diferença certa: 4 pts<br />
        Vencedor certo: 3 pts &nbsp;|&nbsp; Acertou o campeão: +15 pts
      </p>
    </div>
  );
};

// ── Tela principal de palpites ───────────────────────────────
const TelaPalpites = ({ participante, palpites, onSalvar, onVerRanking, modo }) => {
  const [campeo, setCampeo] = useState(palpites.__campeo || "");
  const [grupoAtivo, setGrupoAtivo] = useState("Grupo C");
  const grupos = [...new Set(JOGOS_GRUPOS.map(j => j.grupo))].sort();
  const jogosDoGrupo = JOGOS_GRUPOS.filter(j => j.grupo === grupoAtivo);
  const totalPalpitados = Object.keys(palpites).filter(k => k !== "__campeo").length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.azul}, #001a66)`, padding: "20px 20px 16px", borderBottom: `2px solid ${C.dourado}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: C.dourado, fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 2 }}>COPA DA ANPEREZ 2026</div>
            <div style={{ color: C.texto, fontSize: 20, fontWeight: 900 }}>Olá, {participante}! 👋</div>
          </div>
          <button onClick={onVerRanking} style={{ background: C.dourado, color: "#000", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            🏅 Ranking
          </button>
        </div>
        <div style={{ marginTop: 12, background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: C.textoSec, fontSize: 13 }}>Palpites dados</span>
          <span style={{ color: C.dourado, fontWeight: 800 }}>{totalPalpitados} / {JOGOS_GRUPOS.length}</span>
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {/* Palpite do campeão */}
        <Card style={{ marginBottom: 16, border: `2px solid ${C.dourado}44` }}>
          <div style={{ color: C.dourado, fontWeight: 800, fontSize: 14, marginBottom: 10 }}>🏆 Palpite do Campeão — +15 pts</div>
          <select value={campeo} onChange={e => { setCampeo(e.target.value); onSalvar("__campeo", e.target.value); }}
            style={{ width: "100%", background: "#1a2234", border: `2px solid ${campeo ? C.dourado : C.cardBorder}`, borderRadius: 8, color: campeo ? C.dourado : C.textoSec, padding: "10px 12px", fontSize: 15, fontWeight: campeo ? 700 : 400 }}>
            <option value="">Selecione o campeão...</option>
            {TODOS_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Card>

        {/* Modo: grupos / copa inteira */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ color: C.textoSec, fontSize: 13, alignSelf: "center", marginRight: 4 }}>Fase:</div>
          {["Grupos", modo === "completo" ? "Copa Inteira" : null].filter(Boolean).map(m => (
            <span key={m} style={{ background: C.azul, color: "#fff", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{m}</span>
          ))}
        </div>

        {/* Seletor de grupo */}
        <div style={{ display: "flex", overflowX: "auto", gap: 8, paddingBottom: 8, marginBottom: 12 }}>
          {grupos.map(g => (
            <button key={g} onClick={() => setGrupoAtivo(g)}
              style={{ flexShrink: 0, background: grupoAtivo === g ? C.dourado : C.card, color: grupoAtivo === g ? "#000" : C.textoSec, border: `1px solid ${grupoAtivo === g ? C.dourado : C.cardBorder}`, borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {g.replace("Grupo ", "")}
            </button>
          ))}
        </div>

        {/* Jogos do grupo */}
        <div style={{ color: C.textoSec, fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: 1 }}>{grupoAtivo.toUpperCase()}</div>
        {jogosDoGrupo.map(jogo => (
          <JogoCard key={jogo.id} jogo={jogo}
            palpite={palpites[jogo.id]}
            onChange={(id, val) => onSalvar(id, val)}
            disabled={false} />
        ))}
      </div>
    </div>
  );
};

// ── Tela de Ranking ──────────────────────────────────────────
const TelaRanking = ({ todos, resultados, campeoReal, onVoltar, isAdmin, onSetAdmin }) => {
  const [resultadosEdit, setResultadosEdit] = useState(resultados);
  const [campeoRealEdit, setCampeoRealEdit] = useState(campeoReal || "");
  const [jogoSelecionado, setJogoSelecionado] = useState("");

  const ranking = todos.map(p => {
    const pts = calcularPontosTotal(p.palpites, resultadosEdit, p.palpites.__campeo, campeoRealEdit);
    const total = Object.keys(p.palpites).filter(k => k !== "__campeo").length;
    const acertos = Object.entries(p.palpites).filter(([k, v]) => {
      if (k === "__campeo") return false;
      const r = resultadosEdit[k];
      const { tipo } = calcularPontos(v, r);
      return tipo !== "errou" && tipo !== "pendente";
    }).length;
    return { ...p, pts, total, acertos };
  }).sort((a, b) => b.pts - a.pts);

  const medalhas = ["🥇", "🥈", "🥉"];

  const salvarResultado = (jogoId, ga, gb) => {
    const atualizado = { ...resultadosEdit, [jogoId]: { placar_a: Number(ga), placar_b: Number(gb) } };
    setResultadosEdit(atualizado);
    onSetAdmin(atualizado, campeoRealEdit);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 60 }}>
      <div style={{ background: `linear-gradient(135deg, ${C.douradoEscuro}, ${C.dourado})`, padding: "20px 20px 16px" }}>
        <button onClick={onVoltar} style={{ background: "rgba(0,0,0,0.3)", color: "#000", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>← Voltar</button>
        <div style={{ color: "#000", fontSize: 22, fontWeight: 900 }}>🏅 Ranking do Bolão</div>
        <div style={{ color: "rgba(0,0,0,0.6)", fontSize: 13 }}>{todos.length} participantes</div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Pódio */}
        {ranking.length > 0 && (
          <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, #1a1a2e, #16213e)` }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12, padding: "8px 0" }}>
              {[ranking[1], ranking[0], ranking[2]].map((p, i) => p ? (
                <div key={p.nome} style={{ textAlign: "center", flex: i === 1 ? 1.3 : 1 }}>
                  <div style={{ fontSize: i === 1 ? 36 : 28 }}>{medalhas[i === 1 ? 0 : i === 0 ? 1 : 2]}</div>
                  <div style={{ color: C.texto, fontSize: i === 1 ? 15 : 13, fontWeight: 800, marginTop: 4 }}>{p.nome}</div>
                  <div style={{ color: C.dourado, fontSize: i === 1 ? 22 : 18, fontWeight: 900 }}>{p.pts}</div>
                  <div style={{ color: C.textoSec, fontSize: 11 }}>pts</div>
                </div>
              ) : <div key={i} style={{ flex: 1 }} />)}
            </div>
          </Card>
        )}

        {/* Lista completa */}
        {ranking.map((p, idx) => (
          <Card key={p.nome} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: idx < 3 ? C.dourado : C.textoSec, fontWeight: 900, fontSize: 18, width: 32, textAlign: "center" }}>
              {idx < 3 ? medalhas[idx] : `${idx + 1}º`}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.texto, fontWeight: 700, fontSize: 15 }}>{p.nome}</div>
              <div style={{ color: C.textoSec, fontSize: 12 }}>
                {p.acertos}/{p.total} acertos &nbsp;·&nbsp;
                Campeão: {p.palpites.__campeo || "—"} {p.palpites.__campeo === campeoRealEdit && campeoRealEdit ? "✅ +15" : ""}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: C.dourado, fontWeight: 900, fontSize: 20 }}>{p.pts}</div>
              <div style={{ color: C.textoSec, fontSize: 11 }}>pts</div>
            </div>
          </Card>
        ))}

        {ranking.length === 0 && (
          <div style={{ textAlign: "center", color: C.textoSec, padding: 40 }}>Nenhum palpite ainda</div>
        )}


      </div>
    </div>
  );
};

// ── App principal ────────────────────────────────────────────
export default function App() {
  const [tela, setTela] = useState("cadastro");
  const [participante, setParticipante] = useState("");
  const [todosPalpites, setTodosPalpites] = useState({});
  const [resultados, setResultados] = useState({});
  const [campeoReal, setCampeoReal] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Carregar do storage
  useEffect(() => {
    const load = async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY_PALPITES);
        if (r) setTodosPalpites(JSON.parse(r.value));
      } catch (_) {}
      try {
        const r = await window.storage.get(STORAGE_KEY_ADMIN);
        if (r) {
          const d = JSON.parse(r.value);
          setResultados(d.resultados || {});
          setCampeoReal(d.campeoReal || "");
        }
      } catch (_) {}
    };
    load();
  }, []);

  const entrar = (nome) => {
    setParticipante(nome);
    setTela("palpites");
  };

  const meusPalpites = todosPalpites[participante] || {};

  const salvarPalpite = async (jogoId, valor) => {
    const atualizados = { ...todosPalpites, [participante]: { ...(todosPalpites[participante] || {}), [jogoId]: valor } };
    setTodosPalpites(atualizados);
    try { await window.storage.set(STORAGE_KEY_PALPITES, JSON.stringify(atualizados), true); } catch (_) {}
  };

  const salvarAdmin = async (novosResultados, novoCampeo, setAdmin = false) => {
    setResultados(novosResultados);
    setCampeoReal(novoCampeo);
    if (setAdmin) setIsAdmin(true);
    try { await window.storage.set(STORAGE_KEY_ADMIN, JSON.stringify({ resultados: novosResultados, campeoReal: novoCampeo }), true); } catch (_) {}
  };

  const participantesLista = Object.entries(todosPalpites).map(([nome, palpites]) => ({ nome, palpites }));

  const styles = { fontFamily: "'Segoe UI', system-ui, sans-serif", background: C.bg, minHeight: "100vh", color: C.texto, maxWidth: 480, margin: "0 auto" };

  return (
    <div style={styles}>
      {tela === "cadastro" && <TelaCadastro onEntrar={entrar} />}
      {tela === "palpites" && (
        <TelaPalpites participante={participante} palpites={meusPalpites}
          onSalvar={salvarPalpite} onVerRanking={() => setTela("ranking")} modo="grupos" />
      )}
      {tela === "ranking" && (
        <TelaRanking todos={participantesLista} resultados={resultados}
          campeoReal={campeoReal} onVoltar={() => setTela(participante ? "palpites" : "cadastro")}
          isAdmin={isAdmin} onSetAdmin={salvarAdmin} />
      )}
    </div>
  );
}
