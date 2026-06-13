-- ============================================================
-- BOLÃO COPA 2026 — Bancada de IAs
-- ============================================================

-- 1. Flag para identificar robôs na tabela jogadores
ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS is_ia BOOLEAN DEFAULT FALSE;

-- 2. Criar os perfis das IAs (UUIDs fixos para referência)
INSERT INTO jogadores (id, nome, email, is_ia) VALUES
  ('ia-gemini-uuid-0001', '🤖 Gemini (Google)',   'gemini@bolao.local', TRUE),
  ('ia-gpt-uuid-0002',   '🤖 ChatGPT (OpenAI)',   'chatgpt@bolao.local', TRUE),
  ('ia-claude-uuid-0003', '🤖 Claude (Anthropic)',  'claude@bolao.local', TRUE)
ON CONFLICT (id) DO NOTHING;
