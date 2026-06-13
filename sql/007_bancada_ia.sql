-- ============================================================
-- BOLÃO COPA 2026 — Bancada de IAs
-- Adaptado: jogadores tem apenas nome, senha, created_at
-- ============================================================

-- 1. Flag para identificar robôs
ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS is_ia BOOLEAN DEFAULT FALSE;

-- 2. Inserir perfis das IAs (nome é a única PK)
INSERT INTO jogadores (nome, senha, is_ia) VALUES
  ('🤖 Gemini (Google)',   'ia_password', TRUE),
  ('🤖 ChatGPT (OpenAI)',   'ia_password', TRUE),
  ('🤖 Claude (Anthropic)', 'ia_password', TRUE)
ON CONFLICT (nome) DO NOTHING;

-- 3. RLS: qualquer um pode LER cartelas das IAs
CREATE POLICY "cartelas_select_public_ia" ON cartelas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jogadores
      WHERE nome = cartelas.participante AND is_ia = TRUE
    )
  );
