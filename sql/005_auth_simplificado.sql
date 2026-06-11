-- =============================================================
-- BOLÃO COPA 2026 — Migração para Auth Simplificado
-- (nome + senha, sem Supabase Auth)
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor)
-- =============================================================

-- 1. Adicionar coluna senha na tabela jogadores
ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS senha TEXT NOT NULL DEFAULT '';

-- 2. Remover FK que referencia auth.users (se existir)
ALTER TABLE jogadores DROP CONSTRAINT IF EXISTS jogadores_id_fkey;

-- 3. Remover FK das cartelas que referencia auth.users
ALTER TABLE cartelas DROP CONSTRAINT IF EXISTS cartelas_user_id_fkey;

-- 4. Adicionar admin_password na tabela config
ALTER TABLE config ADD COLUMN IF NOT EXISTS admin_password TEXT DEFAULT '';

-- 5. Desabilitar RLS (já que não usamos mais auth.uid())
ALTER TABLE jogadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE cartelas DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE config DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- 6. Configurar senha do admin (SUBSTITUA pela senha desejada)
UPDATE config SET admin_password = 'admin123' WHERE id = 1;

-- Caso a linha id=1 não exista:
INSERT INTO config (id, valor_aposta, admin_password)
SELECT 1, 20, 'admin123'
WHERE NOT EXISTS (SELECT 1 FROM config WHERE id = 1);
