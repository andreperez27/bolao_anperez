-- ============================================================
-- BOLÃO COPA 2026 — Bancada de IAs
-- Adaptado: jogadores usa nome como PK (sem coluna id)
-- ============================================================

-- 1. Flag para identificar robôs
ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS is_ia BOOLEAN DEFAULT FALSE;

-- 2. Inserir perfis das IAs (nome é a PK, sem id)
INSERT INTO jogadores (nome, email, is_ia) VALUES
  ('🤖 Gemini (Google)',   'gemini@bolao.local', TRUE),
  ('🤖 ChatGPT (OpenAI)',   'chatgpt@bolao.local', TRUE),
  ('🤖 Claude (Anthropic)', 'claude@bolao.local', TRUE)
ON CONFLICT (nome) DO NOTHING;
