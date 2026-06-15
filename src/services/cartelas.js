import { supabaseFetch, supabaseHeaders } from "./supabase";
import { getSession } from "./auth";

function caller() {
  return getSession()?.nome || "";
}

export async function listCartelas(grupoId) {
  const nome = caller();
  if (!nome) return [];

  if (grupoId) {
    const res = await supabaseFetch("/rest/v1/rpc/listar_cartelas_do_grupo", {
      method: "POST",
      body: JSON.stringify({ p_usuario: nome, p_grupo_id: grupoId }),
    });
    if (!res.ok) return [];
    return await res.json() || [];
  }

  return [];
}

export async function salvarCartela(cartela) {
  if (!cartela.grupo_id) throw new Error("Grupo obrigatório para salvar cartela");
  const res = await supabaseFetch("/rest/v1/cartelas", {
    method: "POST",
    headers: { ...supabaseHeaders, "Prefer": "resolution=merge-duplicates" },
    body: JSON.stringify({
      id: cartela.id,
      participante: cartela.participante,
      nome: cartela.nome || "Cartela",
      palpites: cartela.palpites || {},
      campeao: cartela.campeao || "",
      campeao_fase: cartela.campeao_fase || "grupos",
      status: cartela.status || "aguardando",
      valor_pago: cartela.valor_pago || 20,
      grupo_id: cartela.grupo_id,
      created_at: cartela.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok && res.status !== 201) {
    const body = await res.text().catch(() => "");
    throw new Error("HTTP " + res.status + ": " + body.slice(0, 200));
  }
}

export async function deletarCartela(cartelaId) {
  const res = await supabaseFetch("/rest/v1/cartelas?id=eq." + encodeURIComponent(cartelaId), {
    method: "PATCH",
    body: JSON.stringify({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error("Erro ao excluir cartela");
}

export async function restaurarCartela(cartelaId) {
  const res = await supabaseFetch("/rest/v1/cartelas?id=eq." + encodeURIComponent(cartelaId), {
    method: "PATCH",
    body: JSON.stringify({ deleted_at: null, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error("Erro ao restaurar cartela");
}

export async function listarCartelasExcluidas(grupoId) {
  if (!grupoId) return [];
  let url = "/rest/v1/cartelas?select=*&deleted_at=not.is.null&order=deleted_at.desc";
  url += "&grupo_id=eq." + encodeURIComponent(grupoId);
  const res = await supabaseFetch(url);
  if (!res.ok) throw new Error("Erro ao carregar lixeira");
  return await res.json() || [];
}

export async function excluirCartelaDefinitivo(cartelaId) {
  const res = await supabaseFetch("/rest/v1/rpc/excluir_cartela_definitivo", {
    method: "POST",
    body: JSON.stringify({ cartela_id: cartelaId }),
  });
  if (!res.ok) throw new Error("Erro ao excluir permanentemente");
}

export async function validarCartela(cartelaId, status) {
  const nome = caller();
  if (!nome) throw new Error("Usuário não autenticado");
  const res = await supabaseFetch("/rest/v1/rpc/validar_cartela_grupo", {
    method: "POST",
    body: JSON.stringify({ p_usuario: nome, p_cartela_id: cartelaId, p_status: status }),
  });
  if (!res.ok) throw new Error("Erro ao validar cartela");
}
