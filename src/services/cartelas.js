import { supabaseFetch, supabaseHeaders, SUPABASE_URL } from "./supabase";

export async function listCartelas(grupoId) {
  let url = "/rest/v1/cartelas?select=*&order=created_at.desc";
  if (grupoId) url += "&grupo_id=eq." + encodeURIComponent(grupoId);
  const res = await supabaseFetch(url);
  if (!res.ok) throw new Error("Erro ao carregar cartelas");
  return await res.json() || [];
}

export async function salvarCartela(cartela) {
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
      grupo_id: cartela.grupo_id || '00000000-0000-0000-0000-000000000000',
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
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Erro ao excluir cartela");
}

export async function validarCartela(cartelaId, status) {
  const res = await supabaseFetch("/rest/v1/cartelas?id=eq." + encodeURIComponent(cartelaId), {
    method: "PATCH",
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error("Erro ao validar cartela");
}
