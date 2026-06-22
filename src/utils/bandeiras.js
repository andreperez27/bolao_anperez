const ISO_MAP = {
  México: "mx", "África do Sul": "za", "Coreia do Sul": "kr", "República Tcheca": "cz",
  Canadá: "ca", "Bosnia & Herzegovina": "ba", Qatar: "qa", Suíça: "ch",
  Brasil: "br", Marrocos: "ma", Escócia: "gb-sct", Haiti: "ht",
  "Estados Unidos": "us", Turquia: "tr", Austrália: "au", Paraguai: "py",
  Alemanha: "de", "Costa do Marfim": "ci", Equador: "ec", Curaçao: "cw",
  Japão: "jp", Tunísia: "tn", Holanda: "nl", Suécia: "se",
  Bélgica: "be", Egito: "eg", "Nova Zelândia": "nz", Irã: "ir",
  Espanha: "es", "Arábia Saudita": "sa", Uruguai: "uy", "Cabo Verde": "cv",
  França: "fr", Iraque: "iq", Noruega: "no", Senegal: "sn",
  Argentina: "ar", Argélia: "dz", Áustria: "at", Jordânia: "jo",
  Portugal: "pt", Colômbia: "co", Uzbequistão: "uz", "RD Congo": "cd",
  Inglaterra: "gb-eng", Croácia: "hr", Gana: "gh", Panamá: "pa",
};

const ALIASES = {
  "usa": "Estados Unidos", "united states": "Estados Unidos",
  "south korea": "Coreia do Sul", "korea republic": "Coreia do Sul",
  "czech republic": "República Tcheca", "czechia": "República Tcheca",
  "ivory coast": "Costa do Marfim", "côte d'ivoire": "Costa do Marfim",
  "netherlands": "Holanda", "new zealand": "Nova Zelândia",
  "iran": "Irã", "switzerland": "Suíça", "sweden": "Suécia",
  "japan": "Japão", "germany": "Alemanha", "belgium": "Bélgica",
  "egypt": "Egito", "morocco": "Marrocos", "scotland": "Escócia",
  "haiti": "Haiti", "ecuador": "Equador", "curacao": "Curaçao",
  "turkey": "Turquia", "australia": "Austrália", "paraguay": "Paraguai",
  "canada": "Canadá", "mexico": "México", "south africa": "África do Sul",
  "brazil": "Brasil", "argentina": "Argentina", "france": "França",
  "england": "Inglaterra", "portugal": "Portugal", "spain": "Espanha",
  "colombia": "Colômbia", "uruguay": "Uruguai", "croatia": "Croácia",
  "senegal": "Senegal", "ghana": "Gana", "tunisia": "Tunísia",
  "qatar": "Qatar", "saudi arabia": "Arábia Saudita",
  "bosnia": "Bosnia & Herzegovina",
  "bosnia and herzegovina": "Bosnia & Herzegovina",
  "bosnia & herzegovina": "Bosnia & Herzegovina",
  "cabo verde": "Cabo Verde", "cape verde": "Cabo Verde",
  "rd congo": "RD Congo", "dr congo": "RD Congo", "congo dr": "RD Congo",
};

export function getISO(nomeTime) {
  return ISO_MAP[nomeTime] || "";
}

export function normalizarNomePais(nome) {
  if (!nome) return "";
  const lower = nome.toLowerCase().trim();
  return ALIASES[lower] || nome;
}
