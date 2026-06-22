import { normalizarNomePais } from "../utils/bandeiras";

function limparNome(nome) {
  return normalizarNomePais(nome.replace(/\s+/g, " ").trim());
}

function parseISO(dataStr) {
  if (!dataStr) return null;
  const d = new Date(dataStr);
  return isNaN(d.getTime()) ? null : d;
}

function jogoJaComecou(jogo, dataReferencia, partidas) {
  if (!jogo.data_iso || !dataReferencia) return false;
  const m = jogo.horario_brasilia?.match(/(\d+)\/(\d+)\s+(\d+):(\d+)/);
  if (!m) return false;
  const jogoDate = new Date(dataReferencia.getFullYear(), parseInt(m[2]) - 1, parseInt(m[1]), parseInt(m[3]), parseInt(m[4]));
  return jogoDate <= dataReferencia;
}

export function parseCartelaHTML(html, participanteLogado, partidas) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const jogosLista = Array.isArray(partidas) && partidas.length ? partidas : [];

  const dataEmitidoEl = doc.querySelector(".data[data-emitido]");
  const dataEmitidoStr = dataEmitidoEl?.getAttribute("data-emitido") || "";
  const dataEmitido = parseISO(dataEmitidoStr);

  const palpites = {};
  const pulados = [];

  const linhas = doc.querySelectorAll("tr[data-jogo-id]");
  if (linhas.length > 0) {
    linhas.forEach((tr) => {
      const jogoId = tr.getAttribute("data-jogo-id");
      const tds = tr.querySelectorAll("td");
      if (tds.length < 2) return;
      const placarText = tds[1]?.textContent.trim();
      const placarMatch = placarText.match(/(\d+)\s*-\s*(\d+)/);
      if (!jogoId || !placarMatch) return;
      const jogo = jogosLista.find((j) => j.id === jogoId);
      if (!jogo) return;
      if (dataEmitido && jogoJaComecou(jogo, dataEmitido)) {
        pulados.push(`${jogo.time_a_nome || jogo.time_a} × ${jogo.time_b_nome || jogo.time_b}`);
        return;
      }
      palpites[jogo.id] = { gols_a: Number(placarMatch[1]), gols_b: Number(placarMatch[2]) };
    });
  } else {
    const grupos = doc.querySelectorAll(".grupo");
    grupos.forEach((g) => {
      const rows = g.querySelectorAll("table tbody tr");
      rows.forEach((row) => {
        const tds = row.querySelectorAll("td");
        if (tds.length < 2) return;
        const textoJogo = tds[0].childNodes[0]?.textContent || "";
        const [timeA, timeB] = textoJogo.split("×").map(limparNome);
        const placarText = tds[1].textContent.trim();
        const placarMatch = placarText.match(/(\d+)\s*-\s*(\d+)/);
        if (!timeA || !timeB || !placarMatch) return;
        const jogo = jogosLista.find(
          (j) => (limparNome(j.time_a_nome || j.time_a) === timeA && limparNome(j.time_b_nome || j.time_b) === timeB) ||
                 (limparNome(j.time_a_nome || j.time_a) === timeB && limparNome(j.time_b_nome || j.time_b) === timeA)
        );
        if (!jogo) return;
        if (dataEmitido && jogoJaComecou(jogo, dataEmitido)) {
          pulados.push(`${jogo.time_a_nome || jogo.time_a} × ${jogo.time_b_nome || jogo.time_b}`);
          return;
        }
        const swapped = limparNome(jogo.time_a_nome || jogo.time_a) !== timeA;
        palpites[jogo.id] = swapped
          ? { gols_a: Number(placarMatch[2]), gols_b: Number(placarMatch[1]) }
          : { gols_a: Number(placarMatch[1]), gols_b: Number(placarMatch[2]) };
      });
    });
  }

  const footer = doc.querySelector(".footer");
  let campeao = "";
  let campeao_fase = "grupos";
  if (footer) {
    const match = footer.textContent.match(/Campeão:\s*(.+?)(?:\(|$)/);
    if (match) {
      campeao = match[1].trim();
      if (footer.textContent.includes("Segunda Rodada")) campeao_fase = "1_16";
      else if (footer.textContent.includes("Oitavas")) campeao_fase = "oitavas";
      else if (footer.textContent.includes("Quartas")) campeao_fase = "quartas";
      else if (footer.textContent.includes("Semi")) campeao_fase = "semi";
      else if (footer.textContent.includes("Final")) campeao_fase = "final";
    }
  }

  const headerSub = doc.querySelector(".header .sub");
  let participante = "";
  if (headerSub) {
    const m = headerSub.textContent.match(/Cartela\s*[—–-]\s*(.+)/);
    if (m) participante = m[1].trim();
  }

  const erros = [];
  if (participante && participanteLogado && participante !== participanteLogado) {
    erros.push(`Cartela pertence a "${participante}", não a "${participanteLogado}"`);
  }
  if (pulados.length > 0) {
    erros.push(`${pulados.length} jogo(s) ignorado(s) por já ter(em) começado na data de exportação: ${pulados.slice(0, 3).join(", ")}${pulados.length > 3 ? ` e mais ${pulados.length - 3}` : ""}`);
  }

  return { palpites, campeao, campeao_fase, participante, dataEmitido, erros };
}
