import { supabaseFetch } from "./supabase";

const IA_UUIDs = ["ia-gemini-uuid-0001", "ia-gpt-uuid-0002", "ia-claude-uuid-0003"];

export async function listarIAs() {
  const ids = IA_UUIDs.map((id) => "id=eq." + encodeURIComponent(id)).join("&");
  const res = await supabaseFetch("/rest/v1/jogadores?" + ids + "&select=id,nome");
  if (!res.ok) return [];
  return (await res.json()) || [];
}

export async function listarCartelasIA() {
  const nomes = ["🤖 Gemini (Google)", "🤖 ChatGPT (OpenAI)", "🤖 Claude (Anthropic)"];
  const filter = nomes.map((n) => "participante=eq." + encodeURIComponent(n)).join("&");
  const res = await supabaseFetch("/rest/v1/cartelas?" + filter + "&select=participante,palpites&order=created_at.desc");
  if (!res.ok) return [];
  return (await res.json()) || [];
}

export { IA_UUIDs };
