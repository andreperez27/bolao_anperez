/**
 * scripts/alimentarPalpitesIA.js
 *
 * Insere em lote os palpites das IAs na tabela cartelas.
 * Uso: node scripts/alimentarPalpitesIA.js
 *
 * Pré-requisitos:
 *   1. Rodar sql/007_bancada_ia.sql no Supabase
 *   2. Configurar SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente
 *      (ou editar diretamente abaixo)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://sjleucelnptbgyjofhnz.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ERRO: Defina SUPABASE_SERVICE_ROLE_KEY no ambiente ou edite o script.");
  process.exit(1);
}

const HEADERS = {
  "apikey": SUPABASE_SERVICE_ROLE_KEY,
  "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
  "Content-Type": "application/json",
  "Prefer": "resolution=merge-duplicates",
};

const GRUPO_ID = "00000000-0000-0000-0000-000000000000";

/**
 * ================================================================
 * PASSO 1 — Cole aqui os palpites de cada IA
 * Formato:  { "id_do_jogo": { placar_a: N, placar_b: N } }
 * ================================================================
 * IDs dos jogos seguem o padrão wc2026-0 até wc2026-71 (grupos)
 * e oit-1 até oit-8, qua-1 até qua-4, sem-1, sem-2, fin-1.
 * ================================================================
 */
const palpitesIAs = {
  "ia-gemini-uuid-0001": {
    participante: "🤖 Gemini (Google)",
    nome: "Palpites Gemini",
    campeao: "Brasil",
    palpites: {},
  },
  "ia-gpt-uuid-0002": {
    participante: "🤖 ChatGPT (OpenAI)",
    nome: "Palpites ChatGPT",
    campeao: "Argentina",
    palpites: {},
  },
  "ia-claude-uuid-0003": {
    participante: "🤖 Claude (Anthropic)",
    nome: "Palpites Claude",
    campeao: "França",
    palpites: {},
  },
};

async function upsertCartela(iaId, dados) {
  const cartela = {
    id: "cart_ia_" + iaId,
    user_id: iaId,
    participante: dados.participante,
    nome: dados.nome,
    palpites: dados.palpites,
    campeao: dados.campeao || "",
    campeao_fase: "grupos",
    status: "validada",
    valor_pago: 0,
    grupo_id: GRUPO_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const res = await fetch(SUPABASE_URL + "/rest/v1/cartelas", {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(cartela),
  });

  if (!res.ok && res.status !== 201) {
    const txt = await res.text().catch(() => "");
    console.error(`  ERRO [${iaId}]: HTTP ${res.status} — ${txt.slice(0, 200)}`);
    return false;
  }

  console.log(`  OK [${iaId}]: ${dados.participante} — ${Object.keys(dados.palpites).length} palpites`);
  return true;
}

async function main() {
  console.log("Alimentando palpites das IAs...\n");

  for (const [iaId, dados] of Object.entries(palpitesIAs)) {
    console.log(`Processando ${dados.participante}...`);
    await upsertCartela(iaId, dados);
  }

  console.log("\nConcluído!");
}

main().catch(console.error);
