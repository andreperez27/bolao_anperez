import { supabaseFetch } from "./supabase";

const NOMES_IA = ["🤖 Gemini (Google)", "🤖 ChatGPT (OpenAI)", "🤖 Claude (Anthropic)"];

export async function listarIAs() {
  const nomes = NOMES_IA.map((n) => encodeURIComponent(n)).join(",");
  const res = await supabaseFetch("/rest/v1/jogadores?nome=in.(" + nomes + ")&select=nome,is_ia");
  if (!res.ok) return [];
  return (await res.json()) || [];
}

export async function listarCartelasIA() {
  const nomes = NOMES_IA.map((n) => encodeURIComponent(n)).join(",");
  const res = await supabaseFetch("/rest/v1/cartelas?participante=in.(" + nomes + ")&select=participante,palpites&order=created_at.desc");
  if (!res.ok) return [];
  return (await res.json()) || [];
}

export { NOMES_IA };
