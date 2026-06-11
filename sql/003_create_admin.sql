-- =============================================================
-- BOLÃO COPA 2026 — Criar Administrador
-- Execute APÓS 001_create_tables.sql e 002_rls_policies.sql
-- =============================================================

-- 1. Primeiro, cadastre o admin via Supabase Auth:
--    - Acesse Authentication > Users > Invite user
--    - Email: admin@seudominio.com (ou o email desejado)
--    - Após aceitar o convite, o usuário aparecerá em auth.users

-- 2. Descubra o UUID do admin:
--    SELECT id, email FROM auth.users WHERE email = 'admin@seudominio.com';

-- 3. Insira o admin na tabela admins (substitua pelo UUID real):
--    INSERT INTO admins (id, email) VALUES ('UUID-AQUI', 'admin@seudominio.com');

-- 4. (Opcional) Se quiser tornar admin também na tabela jogadores:
--    INSERT INTO jogadores (id, nome, email) VALUES ('UUID-AQUI', 'Admin', 'admin@seudominio.com');
