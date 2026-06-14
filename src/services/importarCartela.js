import { JOGOS_TODOS } from "./jogos";

function limparNome(nome) {
  return nome.replace(/\s+/g, " ").trim();
}

function parseISO(dataStr) {
  if (!dataStr) return null;
  const d = new Date(dataStr);
  return isNaN(d.getTime()) ? null : d;
}

function jogoJaComecou(jogo, dataReferencia) {
  if (!jogo.data_iso || !dataReferencia) return false;
  const [dia, mes] = jogo.horario_brasilia.split(" ")[0].split("/");
  if (!dia || !mes) return false;
  const ano = dataReferencia.getFullYear();
  const jogoDate = new Date(ano, parseInt(mes) - 1, parseInt(dia));
  const partes = jogo.horario_brasilia.split(" ")[1];
  if (partes) {
    const [h, m] = partes.split(":");
    if (h && m) jogoDate.setHours(parseInt(h), parseInt(m), 0, 0);
  }
  return jogoDate <= dataReferencia;
}

export function parseCartelaHTML(html, participanteLogado) {
  const doc = new DOMParser().parseFromString(html, "text/html");

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
      const jogo = JOGOS_TODOS.find((j) => j.id === jogoId);
      if (!jogo) return;
      if (dataEmitido && jogoJaComecou(jogo, dataEmitido)) {
        pulados.push(`${jogo.time_a} × ${jogo.time_b}`);
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
        const jogo = JOGOS_TODOS.find(
          (j) => limparNome(j.time_a) === timeA && limparNome(j.time_b) === timeB
        );
        if (!jogo) return;
        if (dataEmitido && jogoJaComecou(jogo, dataEmitido)) {
          pulados.push(`${jogo.time_a} × ${jogo.time_b}`);
          return;
        }
        palpites[jogo.id] = { gols_a: Number(placarMatch[1]), gols_b: Number(placarMatch[2]) };
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
      if (footer.textContent.includes("Oitavas")) campeao_fase = "oitavas";
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
