function isPlaceholderTime(nome) {
  return /^\d/.test(nome) || /^V\s+\w+/.test(nome);
}

export function isJogoBloqueado(jogo) {
  try {
    if (isPlaceholderTime(jogo.time_a) || isPlaceholderTime(jogo.time_b)) return true;
    const partes = jogo.horario_brasilia.match(/(\d+)\/(\d+)\s+(\d+):(\d+)/);
    if (!partes) return true;
    const dataJogo = new Date(jogo.data_iso + "T" + partes[3] + ":" + partes[4] + ":00-03:00");
    dataJogo.setHours(dataJogo.getHours() - 1);
    return new Date() >= dataJogo;
  } catch (_) {
    return true;
  }
}

export function formatarMoeda(valor) {
  return "R$ " + Number(valor).toFixed(2).replace(".", ",");
}
