const SUPABASE_URL = "https://sjleucelnptbgyjofhnz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fFDUULEIatz3fzxENC6BRQ_T8rZZEmr";

const headers = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": "Bearer " + SUPABASE_ANON_KEY,
  "Content-Type": "application/json",
};

export async function listCartelas() {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/cartelas?select=*&order=created_at.desc",
    { method: "GET", headers }
  );
  if (!res.ok) throw new Error("Erro ao carregar cartelas");
  return await res.json() || [];
}

export async function listCartelasByUser(participanteNome) {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/cartelas?select=*&participante=eq." + encodeURIComponent(participanteNome) + "&order=created_at.desc",
    { method: "GET", headers }
  );
  if (!res.ok) throw new Error("Erro ao carregar cartelas");
  return await res.json() || [];
}

export async function salvarCartela(cartela) {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/cartelas",
    {
      method: "POST",
      headers: { ...headers, "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({
        id: cartela.id,
        participante: cartela.participante,
        nome: cartela.nome || "Cartela",
        palpites: cartela.palpites || {},
        campeao: cartela.campeao || "",
        campeao_fase: cartela.campeao_fase || "grupos",
        status: cartela.status || "aguardando",
        valor_pago: cartela.valor_pago || 20,
        created_at: cartela.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    }
  );
  if (!res.ok && res.status !== 201) {
    const body = await res.text().catch(() => "");
    throw new Error("HTTP " + res.status + ": " + body.slice(0, 200));
  }
}

export async function deletarCartela(cartelaId) {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/cartelas?id=eq." + encodeURIComponent(cartelaId),
    { method: "DELETE", headers }
  );
  if (!res.ok) throw new Error("Erro ao excluir cartela");
}

export async function validarCartela(cartelaId, status) {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/cartelas?id=eq." + encodeURIComponent(cartelaId),
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
    }
  );
  if (!res.ok) throw new Error("Erro ao validar cartela");
}
