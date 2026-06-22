export function calcularPontos(palpite, resultado) {
  if (!resultado || resultado.placar_a === null) return { pts: 0, tipo: "pendente" };
  const pa = palpite.gols_a;
  const pb = palpite.gols_b;
  const ra = resultado.placar_a;
  const rb = resultado.placar_b;
  if (pa === ra && pb === rb) return { pts: 5, tipo: "placar_exato" };
  const resP = pa > pb ? "A" : pa < pb ? "B" : "E";
  const resR = ra > rb ? "A" : ra < rb ? "B" : "E";
  if (resP !== resR) return { pts: 0, tipo: "errou" };
  if (resP !== "E" && Math.abs(pa - pb) === Math.abs(ra - rb)) return { pts: 4, tipo: "diferenca_certa" };
  return { pts: 3, tipo: "vencedor_certo" };
}

export function getFaseAtual(resultados, partidas) {
  if (!resultados || !partidas) return "grupos";
  const slugsPorOrdem = ["grupos", "1_16", "oitavas", "quartas", "semi", "final"];
  for (const slug of slugsPorOrdem) {
    const daFase = partidas.filter((p) => (p.stage_slug === slug || p.grupo_letra));
    if (!daFase.length) continue;
    const completa = daFase.every(
      (j) => resultados[j.id]?.placar_a !== undefined && resultados[j.id]?.placar_a !== null
    );
    if (!completa) return slug;
  }
  return "final";
}

export function pontosCampeaoPorFase(fase) {
  const mapa = { grupos: 20, "1_16": 18, oitavas: 15, quartas: 10, semi: 5, final: 2 };
  return mapa[fase] || 20;
}

export function pontosVicePorFase(fase) {
  const mapa = { grupos: 15, "1_16": 14, oitavas: 11, quartas: 8, semi: 4, final: 2 };
  return mapa[fase] || 15;
}

export const PONTOS_ARTILHEIRO = 15;
export const PONTOS_COMBO = 25;

export function contarEmpatesPalpitados(palpites) {
  if (!palpites) return 0;
  return Object.entries(palpites).filter(([k, v]) => {
    if (k === "__campeo") return false;
    return v?.gols_a !== undefined && v.gols_a === v.gols_b;
  }).length;
}

export function calcularPontosCartela(palpites, resultados, campeao, campeaoFase, campeoReal) {
  let total = 0;
  if (!palpites) return total;
  for (const jogoId in palpites) {
    if (jogoId === "__campeo") continue;
    const resultado = resultados && resultados[jogoId];
    const { pts } = calcularPontos(palpites[jogoId], resultado);
    total += pts;
  }
  if (campeoReal && campeao === campeoReal) {
    total += pontosCampeaoPorFase(campeaoFase || "grupos");
  }
  return total;
}
