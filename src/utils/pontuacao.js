import { JOGOS_GRUPOS, JOGOS_OITAVAS, JOGOS_QUARTAS, JOGOS_SEMI, JOGOS_FINAL } from "../services/jogos";

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

export function getFaseAtual(resultados) {
  if (!resultados) return "grupos";
  const todosGrupos = JOGOS_GRUPOS.every(
    (j) => resultados[j.id]?.placar_a !== undefined && resultados[j.id]?.placar_a !== null
  );
  if (!todosGrupos) return "grupos";
  const todosOitavas =
    JOGOS_OITAVAS &&
    JOGOS_OITAVAS.every(
      (j) => resultados[j.id]?.placar_a !== undefined && resultados[j.id]?.placar_a !== null
    );
  if (!todosOitavas) return "oitavas";
  const todosQuartas =
    JOGOS_QUARTAS &&
    JOGOS_QUARTAS.every(
      (j) => resultados[j.id]?.placar_a !== undefined && resultados[j.id]?.placar_a !== null
    );
  if (!todosQuartas) return "quartas";
  const todosSemi =
    JOGOS_SEMI &&
    JOGOS_SEMI.every(
      (j) => resultados[j.id]?.placar_a !== undefined && resultados[j.id]?.placar_a !== null
    );
  if (!todosSemi) return "semi";
  return "final";
}

export function pontosCampeaoPorFase(fase) {
  const mapa = { grupos: 20, oitavas: 15, quartas: 10, semi: 5, final: 2 };
  return mapa[fase] || 20;
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
