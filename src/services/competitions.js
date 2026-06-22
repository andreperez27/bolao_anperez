import { rpc } from "./supabase";

export async function listarEdicoesAtivas() {
  return await rpc("listar_edicoes_ativas");
}

export async function buscarEdicaoDoGrupo(grupoSlug) {
  return await rpc("buscar_edicao_do_grupo", { p_grupo_slug: grupoSlug });
}

export async function listarPartidasEdicao(editionId) {
  return await rpc("listar_partidas_edicao", { p_edition_id: editionId });
}

export async function listarPartidasPorFase(editionId) {
  return await rpc("listar_partidas_por_fase", { p_edition_id: editionId });
}

export async function listarTimesEdicao(editionId) {
  return await rpc("listar_times_edicao", { p_edition_id: editionId });
}

export async function buscarResultadosEdicao(editionId) {
  return await rpc("buscar_resultados_edicao", { p_edition_id: editionId });
}

export async function calcularClassificacao(editionId, stageId) {
  return await rpc("calcular_classificacao", { p_edition_id: editionId, p_stage_id: stageId });
}

export async function getFasesComPartidas(editionId) {
  const fases = await rpc("listar_partidas_por_fase", { p_edition_id: editionId });
  if (!Array.isArray(fases)) return [];
  return fases.map((f) => ({
    stage_id: f.stage_id, stage_slug: f.stage_slug, stage_nome: f.stage_nome,
    stage_ordem: f.stage_ordem, stage_tipo: f.stage_tipo, partidas: f.partidas || [],
  }));
}

export async function salvarResultado(matchId, placarA, placarB) {
  return await rpc("salvar_resultado", {
    p_match_id: matchId, p_placar_a: placarA, p_placar_b: placarB, p_encerrado: true,
  });
}
