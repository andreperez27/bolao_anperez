-- ============================================================
-- PARTE 1 — ARQUITETURA MULTITENANCY
-- ============================================================

-- 1. Tabela de Grupos
CREATE TABLE IF NOT EXISTS grupos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW(),
    criador_id UUID REFERENCES auth.users(id),
    valor_aposta NUMERIC(10, 2) DEFAULT 0.00,
    pontos_acerto_cheio INT DEFAULT 5,
    pontos_acerto_vencedor INT DEFAULT 3,
    pontos_acerto_gols INT DEFAULT 1
);

-- 2. Tabela Intermediária de Membros
CREATE TABLE IF NOT EXISTS membros_grupo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR DEFAULT 'participante',
    pago BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE(grupo_id, usuario_id)
);

-- 3. Criar grupo padrão para retrocompatibilidade
INSERT INTO grupos (id, nome, slug, valor_aposta)
VALUES ('00000000-0000-0000-0000-000000000000', 'Grupo Geral', 'geral', 0.00)
ON CONFLICT DO NOTHING;

-- 4. Adicionar coluna grupo_id nas tabelas existentes
ALTER TABLE cartelas ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupos(id) DEFAULT '00000000-0000-0000-0000-000000000000';
