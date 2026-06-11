import { JOGOS_TODOS } from "./jogos";

function limparNome(nome) {
  return nome.replace(/\s+/g, " ").trim();
}

export function parseCartelaHTML(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const palpites = {};
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
      if (jogo) {
        palpites[jogo.id] = { gols_a: Number(placarMatch[1]), gols_b: Number(placarMatch[2]) };
      }
    });
  });

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

  return { palpites, campeao, campeao_fase, participante };
}
