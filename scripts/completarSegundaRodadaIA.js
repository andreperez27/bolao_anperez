/**
 * scripts/completarSegundaRodadaIA.js
 *
 * Adiciona palpites da Segunda Rodada (1/16 de Final) nas cartelas das IAs.
 * As cartelas foram criadas antes de existir a fase 1/16, então estão sem
 * palpites para os jogos dez-1 a dez-16.
 *
 * Uso: SUPABASE_SERVICE_ROLE_KEY="chave" node scripts/completarSegundaRodadaIA.js
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://sjleucelnptbgyjofhnz.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ERRO: Defina SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  process.exit(1);
}

const HEADERS = {
  "apikey": SUPABASE_SERVICE_ROLE_KEY,
  "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
  "Content-Type": "application/json",
  "Prefer": "return=minimal",
};

// ─── Palpites para Segunda Rodada (jogos dez-1 a dez-16) ───
const palpites1_16 = {
  Gemini: {
    "dez-1":  { gols_a: 1, gols_b: 0 },
    "dez-2":  { gols_a: 2, gols_b: 0 },
    "dez-3":  { gols_a: 1, gols_b: 1 },
    "dez-4":  { gols_a: 2, gols_b: 1 },
    "dez-5":  { gols_a: 0, gols_b: 1 },
    "dez-6":  { gols_a: 2, gols_b: 0 },
    "dez-7":  { gols_a: 1, gols_b: 1 },
    "dez-8":  { gols_a: 1, gols_b: 0 },
    "dez-9":  { gols_a: 2, gols_b: 0 },
    "dez-10": { gols_a: 1, gols_b: 1 },
    "dez-11": { gols_a: 0, gols_b: 1 },
    "dez-12": { gols_a: 2, gols_b: 1 },
    "dez-13": { gols_a: 1, gols_b: 0 },
    "dez-14": { gols_a: 1, gols_b: 1 },
    "dez-15": { gols_a: 2, gols_b: 0 },
    "dez-16": { gols_a: 0, gols_b: 1 },
  },
  ChatGPT: {
    "dez-1":  { gols_a: 2, gols_b: 0 },
    "dez-2":  { gols_a: 1, gols_b: 1 },
    "dez-3":  { gols_a: 2, gols_b: 1 },
    "dez-4":  { gols_a: 1, gols_b: 0 },
    "dez-5":  { gols_a: 1, gols_b: 2 },
    "dez-6":  { gols_a: 2, gols_b: 0 },
    "dez-7":  { gols_a: 1, gols_b: 0 },
    "dez-8":  { gols_a: 2, gols_b: 2 },
    "dez-9":  { gols_a: 1, gols_b: 1 },
    "dez-10": { gols_a: 1, gols_b: 0 },
    "dez-11": { gols_a: 2, gols_b: 1 },
    "dez-12": { gols_a: 0, gols_b: 1 },
    "dez-13": { gols_a: 2, gols_b: 0 },
    "dez-14": { gols_a: 1, gols_b: 2 },
    "dez-15": { gols_a: 1, gols_b: 1 },
    "dez-16": { gols_a: 2, gols_b: 0 },
  },
  Claude: {
    "dez-1":  { gols_a: 1, gols_b: 1 },
    "dez-2":  { gols_a: 2, gols_b: 1 },
    "dez-3":  { gols_a: 1, gols_b: 0 },
    "dez-4":  { gols_a: 0, gols_b: 2 },
    "dez-5":  { gols_a: 2, gols_b: 0 },
    "dez-6":  { gols_a: 1, gols_b: 2 },
    "dez-7":  { gols_a: 2, gols_b: 0 },
    "dez-8":  { gols_a: 1, gols_b: 0 },
    "dez-9":  { gols_a: 1, gols_b: 2 },
    "dez-10": { gols_a: 2, gols_b: 1 },
    "dez-11": { gols_a: 0, gols_b: 0 },
    "dez-12": { gols_a: 1, gols_b: 1 },
    "dez-13": { gols_a: 2, gols_b: 0 },
    "dez-14": { gols_a: 1, gols_b: 0 },
    "dez-15": { gols_a: 0, gols_b: 2 },
    "dez-16": { gols_a: 1, gols_b: 1 },
  },
};

const IAS = [
  { participante: "🤖 Gemini (Google)", estilo: "Gemini" },
  { participante: "🤖 ChatGPT (OpenAI)", estilo: "ChatGPT" },
  { participante: "🤖 Claude (Anthropic)", estilo: "Claude" },
];

async function buscarCartela(participante) {
  const nome = encodeURIComponent(participante);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/cartelas?select=id,palpites&participante=eq.${nome}&order=created_at.desc&limit=1`,
    { headers: HEADERS }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${participante}`);
  const data = await res.json();
  return data?.[0] || null;
}

async function atualizarCartela(id, palpites) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/cartelas?id=eq.${id}`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify({ palpites, updated_at: new Date().toISOString() }),
  });
  if (!res.ok && res.status !== 204) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} — ${txt.slice(0, 200)}`);
  }
  return true;
}

async function main() {
  console.log("Completando palpites da Segunda Rodada nas IAs...\n");

  for (const ia of IAS) {
    console.log(`Buscando cartela de ${ia.participante}...`);
    const cartela = await buscarCartela(ia.participante);
    if (!cartela) {
      console.log(`  Nenhuma cartela encontrada. Pulando.`);
      continue;
    }

    const existentes = Object.keys(cartela.palpites || {}).length;
    const novos = palpites1_16[ia.estilo];
    const merge = { ...(cartela.palpites || {}), ...novos };
    const total = Object.keys(merge).length;

    await atualizarCartela(cartela.id, merge);
    console.log(`  OK: ${existentes} → ${total} palpites (+${Object.keys(novos).length} da 1/16)`);
  }

  console.log("\nConcluído!");
}

main().catch(console.error);
