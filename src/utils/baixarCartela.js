import { JOGOS_GRUPOS, JOGOS_OITAVAS, JOGOS_QUARTAS, JOGOS_SEMI, JOGOS_FINAL } from "../services/jogos";

export function baixarCartelaHTML(cartela, participante) {
  if (!cartela) return;
  const palpites = cartela.palpites || {};
  const todosJogos = [...JOGOS_GRUPOS, ...JOGOS_OITAVAS, ...JOGOS_QUARTAS, ...JOGOS_SEMI, ...JOGOS_FINAL];
  const gruposPrint = [...new Set(todosJogos.map(j => j.grupo))];
  const agora = new Date().toLocaleString("pt-BR");
  const nomeArquivo = `cartela_${(cartela.nome || "bolao").replace(/[^a-z0-9]/gi, "_")}_${participante.replace(/[^a-z0-9]/gi, "_")}.html`;

  let html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Cartela - Bolão Copa 2026</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; padding: 30px; color: #000; background: #fff; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
  .header h1 { font-size: 22px; font-weight: 900; }
  .header .sub { font-size: 14px; color: #555; margin-top: 4px; }
  .header .data { font-size: 11px; color: #999; margin-top: 2px; }
  .grupo { margin-bottom: 16px; }
  .grupo-titulo { font-weight: 800; font-size: 13px; margin-bottom: 4px; background: #eee; padding: 4px 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { border: 1px solid #ccc; padding: 4px; text-align: left; background: #f8f8f8; }
  td { border: 1px solid #ccc; padding: 4px 8px; font-size: 12px; }
  .placar { text-align: center; font-weight: 700; font-size: 13px; }
  .horario { color: #999; font-size: 10px; margin-left: 6px; }
  .footer { margin-top: 12px; font-size: 13px; border-top: 1px solid #ccc; padding-top: 8px; }
  @media print { body { padding: 15px; } .no-print { display: none; } }
</style></head><body>
  <div class="header">
    <h1>BOLÃO DA COPA 2026</h1>
    <div class="sub">${(cartela.nome || "Cartela").replace(/</g, "&lt;")} — ${participante.replace(/</g, "&lt;")}</div>
    <div class="data">Emitido em ${agora}</div>
    <div class="no-print" style="margin-top:8px"><button onclick="window.print()" style="padding:6px 20px;font-size:14px;font-weight:700;cursor:pointer;background:#0033A0;color:#fff;border:none;border-radius:4px">\uD83D\uDDA8\uFE0F Imprimir</button></div>
  </div>`;

  gruposPrint.forEach(grupo => {
    const jogos = todosJogos.filter(j => j.grupo === grupo);
    const temPalpite = jogos.some(j => palpites[j.id]?.gols_a !== undefined);
    if (!temPalpite) return;
    html += `<div class="grupo"><div class="grupo-titulo">${grupo.toUpperCase()}</div><table><thead><tr><th>Jogo</th><th style="text-align:center">Placar</th></tr></thead><tbody>`;
    jogos.forEach(j => {
      const p = palpites[j.id];
      html += `<tr><td>${j.time_a.replace(/</g, "&lt;")} × ${j.time_b.replace(/</g, "&lt;")} <span class="horario">${j.horario_brasilia}</span></td><td class="placar">${p ? p.gols_a + "-" + p.gols_b : "—"}</td></tr>`;
    });
    html += `</tbody></table></div>`;
  });

  const faseLabel = cartela.campeao_fase === "grupos" ? "Fase de Grupos" : cartela.campeao_fase === "oitavas" ? "Oitavas" : cartela.campeao_fase === "quartas" ? "Quartas" : cartela.campeao_fase === "semi" ? "Semifinal" : "Final";
  html += `<div class="footer"><strong>Campeão:</strong> ${(cartela.campeao || "—").replace(/</g, "&lt;")}${cartela.campeao_fase ? `<span style="color:#666;font-size:11px;margin-left:8px">(definido na ${faseLabel})</span>` : ""}</div>`;
  html += `</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
