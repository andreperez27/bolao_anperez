import { rpc, supabaseFetch } from "./supabase";

export async function listarPredictions(grupoId, profileId) {
  const params = { p_grupo_id: grupoId };
  if (profileId) params.p_profile_id = profileId;
  return await rpc("listar_predictions", params);
}

export async function salvarPrediction({ id, grupoId, sessaoToken, participante, nome, palpites, campeaoId, campeaoFase }) {
  return await rpc("salvar_prediction", {
    p_id: id, p_grupo_id: grupoId, p_sessao_token: sessaoToken,
    p_participante: participante, p_nome: nome || "Cartela",
    p_palpites: palpites || {}, p_campeao_id: campeaoId || null,
    p_campeao_fase: campeaoFase || null,
  });
}

export async function validarPrediction(id, sessaoToken, status) {
  return await rpc("validar_prediction", { p_id: id, p_sessao_token: sessaoToken, p_status: status });
}

export async function excluirPrediction(id, sessaoToken) {
  return await rpc("excluir_prediction", { p_id: id, p_sessao_token: sessaoToken });
}

export async function getRanking(grupoId) {
  return await rpc("calcular_ranking", { p_grupo_id: grupoId });
}
