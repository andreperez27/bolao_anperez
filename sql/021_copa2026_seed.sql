-- =============================================================
-- SEED: COPA DO MUNDO 2026
-- Execute APÓS 020_schema_v2.sql
-- =============================================================

-- =============================================================
-- 1. COMPETIÇÃO
-- =============================================================
INSERT INTO competitions (id, slug, nome, tipo)
SELECT '00000000-0000-0000-0000-000000000001', 'world-cup', 'Copa do Mundo', 'torneio'
WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE slug = 'world-cup');

-- =============================================================
-- 2. EDIÇÃO
-- =============================================================
INSERT INTO competition_editions (id, competition_id, slug, nome, temporada, data_inicio, data_fim, config)
SELECT
  '00000000-0000-0000-0000-000000000010', id,
  'world-cup-2026', 'Copa do Mundo 2026', '2026',
  '2026-06-11', '2026-07-13',
  '{"qtd_grupos":12,"times_por_grupo":4,"classificados_por_grupo":2,"terceiro_lugar":true,"fases":["grupos","1_16","oitavas","quartas","semi","disputa_3","final"]}'
FROM competitions WHERE slug = 'world-cup'
AND NOT EXISTS (SELECT 1 FROM competition_editions WHERE slug = 'world-cup-2026');

-- =============================================================
-- 3. TIMES (48 seleções)
-- =============================================================
INSERT INTO teams (id, nome, nome_curto, slug, iso_code) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Brasil', 'BRA', 'brasil', 'br'),
  ('00000000-0000-0000-0000-000000000102', 'Argentina', 'ARG', 'argentina', 'ar'),
  ('00000000-0000-0000-0000-000000000103', 'Alemanha', 'ALE', 'alemanha', 'de'),
  ('00000000-0000-0000-0000-000000000104', 'França', 'FRA', 'franca', 'fr'),
  ('00000000-0000-0000-0000-000000000105', 'Inglaterra', 'ING', 'inglaterra', 'gb-eng'),
  ('00000000-0000-0000-0000-000000000106', 'Espanha', 'ESP', 'espanha', 'es'),
  ('00000000-0000-0000-0000-000000000107', 'Portugal', 'POR', 'portugal', 'pt'),
  ('00000000-0000-0000-0000-000000000108', 'Holanda', 'HOL', 'holanda', 'nl'),
  ('00000000-0000-0000-0000-000000000109', 'Bélgica', 'BEL', 'belgica', 'be'),
  ('00000000-0000-0000-0000-000000000110', 'Croácia', 'CRO', 'croacia', 'hr'),
  ('00000000-0000-0000-0000-000000000111', 'Itália', 'ITA', 'italia', 'it'),
  ('00000000-0000-0000-0000-000000000112', 'México', 'MEX', 'mexico', 'mx'),
  ('00000000-0000-0000-0000-000000000113', 'Estados Unidos', 'EUA', 'estados-unidos', 'us'),
  ('00000000-0000-0000-0000-000000000114', 'Uruguai', 'URU', 'uruguai', 'uy'),
  ('00000000-0000-0000-0000-000000000115', 'Colômbia', 'COL', 'colombia', 'co'),
  ('00000000-0000-0000-0000-000000000116', 'Equador', 'EQU', 'equador', 'ec'),
  ('00000000-0000-0000-0000-000000000117', 'Japão', 'JAP', 'japao', 'jp'),
  ('00000000-0000-0000-0000-000000000118', 'Coreia do Sul', 'CDS', 'coreia-do-sul', 'kr'),
  ('00000000-0000-0000-0000-000000000119', 'Marrocos', 'MAR', 'marrocos', 'ma'),
  ('00000000-0000-0000-0000-000000000120', 'Senegal', 'SEN', 'senegal', 'sn'),
  ('00000000-0000-0000-0000-000000000121', 'Gana', 'GAN', 'gana', 'gh'),
  ('00000000-0000-0000-0000-000000000122', 'Egito', 'EGI', 'egito', 'eg'),
  ('00000000-0000-0000-0000-000000000123', 'Tunísia', 'TUN', 'tunisia', 'tn'),
  ('00000000-0000-0000-0000-000000000124', 'Argélia', 'ARG', 'argelia', 'dz'),
  ('00000000-0000-0000-0000-000000000125', 'Nigéria', 'NIG', 'nigeria', 'ng'),
  ('00000000-0000-0000-0000-000000000126', 'Costa do Marfim', 'CDM', 'costa-do-marfim', 'ci'),
  ('00000000-0000-0000-0000-000000000127', 'RD Congo', 'RDC', 'rd-congo', 'cd'),
  ('00000000-0000-0000-0000-000000000128', 'Cabo Verde', 'CBV', 'cabo-verde', 'cv'),
  ('00000000-0000-0000-0000-000000000129', 'África do Sul', 'AFS', 'africa-do-sul', 'za'),
  ('00000000-0000-0000-0000-000000000130', 'Suécia', 'SUE', 'suecia', 'se'),
  ('00000000-0000-0000-0000-000000000131', 'Suíça', 'SUI', 'suica', 'ch'),
  ('00000000-0000-0000-0000-000000000132', 'Noruega', 'NOR', 'noruega', 'no'),
  ('00000000-0000-0000-0000-000000000133', 'Escócia', 'ESC', 'escocia', 'gb-sct'),
  ('00000000-0000-0000-0000-000000000134', 'Áustria', 'AUT', 'austria', 'at'),
  ('00000000-0000-0000-0000-000000000135', 'Turquia', 'TUR', 'turquia', 'tr'),
  ('00000000-0000-0000-0000-000000000136', 'República Tcheca', 'RTC', 'republica-tcheca', 'cz'),
  ('00000000-0000-0000-0000-000000000137', 'Paraguai', 'PAR', 'paraguai', 'py'),
  ('00000000-0000-0000-0000-000000000138', 'Canadá', 'CAN', 'canada', 'ca'),
  ('00000000-0000-0000-0000-000000000139', 'Austrália', 'AUS', 'australia', 'au'),
  ('00000000-0000-0000-0000-000000000140', 'Irã', 'IRA', 'ira', 'ir'),
  ('00000000-0000-0000-0000-000000000141', 'Arábia Saudita', 'ARS', 'arabia-saudita', 'sa'),
  ('00000000-0000-0000-0000-000000000142', 'Qatar', 'QAT', 'qatar', 'qa'),
  ('00000000-0000-0000-0000-000000000143', 'Iraque', 'IRQ', 'iraque', 'iq'),
  ('00000000-0000-0000-0000-000000000144', 'Jordânia', 'JOR', 'jordania', 'jo'),
  ('00000000-0000-0000-0000-000000000145', 'Uzbequistão', 'UZB', 'uzbequistao', 'uz'),
  ('00000000-0000-0000-0000-000000000146', 'Nova Zelândia', 'NZE', 'nova-zelandia', 'nz'),
  ('00000000-0000-0000-0000-000000000147', 'Haiti', 'HAI', 'haiti', 'ht'),
  ('00000000-0000-0000-0000-000000000148', 'Curaçao', 'CUR', 'curacao', 'cw'),
  ('00000000-0000-0000-0000-000000000149', 'Panamá', 'PAN', 'panama', 'pa'),
  ('00000000-0000-0000-0000-000000000150', 'Bosnia & Herzegovina', 'BOS', 'bosnia-herzegovina', 'ba'),
  ('00000000-0000-0000-0000-000000000151', 'China', 'CHN', 'china', 'cn'),
  ('00000000-0000-0000-0000-000000000152', 'Chile', 'CHI', 'chile', 'cl');

-- =============================================================
-- 4. EDITION_TEAMS (48 times em 12 grupos)
-- =============================================================
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026')
INSERT INTO edition_teams (edition_id, team_id, grupo_letra, seed)
SELECT e.id, t.id, v.grupo, v.seed
FROM e
CROSS JOIN (VALUES
  ('A',1,'México'), ('A',2,'África do Sul'), ('A',3,'Coreia do Sul'), ('A',4,'República Tcheca'),
  ('B',1,'Canadá'), ('B',2,'Bosnia & Herzegovina'), ('B',3,'Qatar'), ('B',4,'Suíça'),
  ('C',1,'Brasil'), ('C',2,'Marrocos'), ('C',3,'Haiti'), ('C',4,'Escócia'),
  ('D',1,'Estados Unidos'), ('D',2,'Paraguai'), ('D',3,'Austrália'), ('D',4,'Turquia'),
  ('E',1,'Alemanha'), ('E',2,'Curaçao'), ('E',3,'Costa do Marfim'), ('E',4,'Equador'),
  ('F',1,'Holanda'), ('F',2,'Japão'), ('F',3,'Suécia'), ('F',4,'Tunísia'),
  ('G',1,'Bélgica'), ('G',2,'Egito'), ('G',3,'Irã'), ('G',4,'Nova Zelândia'),
  ('H',1,'Espanha'), ('H',2,'Cabo Verde'), ('H',3,'Arábia Saudita'), ('H',4,'Uruguai'),
  ('I',1,'França'), ('I',2,'Senegal'), ('I',3,'Iraque'), ('I',4,'Noruega'),
  ('J',1,'Argentina'), ('J',2,'Argélia'), ('J',3,'Áustria'), ('J',4,'Jordânia'),
  ('K',1,'Portugal'), ('K',2,'RD Congo'), ('K',3,'Uzbequistão'), ('K',4,'Colômbia'),
  ('L',1,'Inglaterra'), ('L',2,'Croácia'), ('L',3,'Gana'), ('L',4,'Panamá')
) AS v(grupo, seed, nome_time)
JOIN teams t ON t.nome = v.nome_time;

-- =============================================================
-- 5. STAGES
-- =============================================================
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026')
INSERT INTO stages (id, edition_id, slug, nome, ordem, tipo)
SELECT s.id, e.id, s.slug, s.nome, s.ordem, s.tipo
FROM e
CROSS JOIN (VALUES
  ('A0000000-0000-0000-0000-000000000001', 'grupo_a',    'Grupo A',    1,  'groups'),
  ('A0000000-0000-0000-0000-000000000002', 'grupo_b',    'Grupo B',    2,  'groups'),
  ('A0000000-0000-0000-0000-000000000003', 'grupo_c',    'Grupo C',    3,  'groups'),
  ('A0000000-0000-0000-0000-000000000004', 'grupo_d',    'Grupo D',    4,  'groups'),
  ('A0000000-0000-0000-0000-000000000005', 'grupo_e',    'Grupo E',    5,  'groups'),
  ('A0000000-0000-0000-0000-000000000006', 'grupo_f',    'Grupo F',    6,  'groups'),
  ('A0000000-0000-0000-0000-000000000007', 'grupo_g',    'Grupo G',    7,  'groups'),
  ('A0000000-0000-0000-0000-000000000008', 'grupo_h',    'Grupo H',    8,  'groups'),
  ('A0000000-0000-0000-0000-000000000009', 'grupo_i',    'Grupo I',    9,  'groups'),
  ('A0000000-0000-0000-0000-00000000000a', 'grupo_j',    'Grupo J',    10, 'groups'),
  ('A0000000-0000-0000-0000-00000000000b', 'grupo_k',    'Grupo K',    11, 'groups'),
  ('A0000000-0000-0000-0000-00000000000c', 'grupo_l',    'Grupo L',    12, 'groups'),
  ('A0000000-0000-0000-0000-00000000000d', '1_16',       'Segunda Rodada (1/16)', 13, 'knockout'),
  ('A0000000-0000-0000-0000-00000000000e', 'oitavas',    'Oitavas de Final',      14, 'knockout'),
  ('A0000000-0000-0000-0000-00000000000f', 'quartas',    'Quartas de Final',       15, 'knockout'),
  ('A0000000-0000-0000-0000-000000000010', 'semi',       'Semifinal',              16, 'knockout'),
  ('A0000000-0000-0000-0000-000000000011', 'disputa_3',  'Disputa do 3º Lugar',   17, 'knockout'),
  ('A0000000-0000-0000-0000-000000000012', 'final',      'Grande Final',           18, 'knockout')
) AS s(id, slug, nome, ordem, tipo);

-- =============================================================
-- 6. ROUNDS
-- =============================================================
-- 3 matchdays por grupo (36 rounds)
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026')
INSERT INTO rounds (id, stage_id, slug, nome, ordem)
SELECT r.id, s.id, r.slug, r.nome, r.ordem
FROM e, stages s
CROSS JOIN (VALUES
  -- Grupo A (md-1, md-8, md-14)
  ('B0000000-0000-0000-0000-000000000101', 'grupo_a', 'md-1',  'Matchday 1', 1),
  ('B0000000-0000-0000-0000-000000000102', 'grupo_a', 'md-8',  'Matchday 8', 2),
  ('B0000000-0000-0000-0000-000000000103', 'grupo_a', 'md-14', 'Matchday 14', 3),
  -- Grupo B (md-2, md-3, md-8, md-14)
  ('B0000000-0000-0000-0000-000000000201', 'grupo_b', 'md-2',  'Matchday 2', 1),
  ('B0000000-0000-0000-0000-000000000202', 'grupo_b', 'md-3',  'Matchday 3', 2),
  ('B0000000-0000-0000-0000-000000000203', 'grupo_b', 'md-8',  'Matchday 8', 3),
  ('B0000000-0000-0000-0000-000000000204', 'grupo_b', 'md-14', 'Matchday 14', 4),
  -- Grupo C (md-3, md-9, md-14)
  ('B0000000-0000-0000-0000-000000000301', 'grupo_c', 'md-3',  'Matchday 3', 1),
  ('B0000000-0000-0000-0000-000000000302', 'grupo_c', 'md-9',  'Matchday 9', 2),
  ('B0000000-0000-0000-0000-000000000303', 'grupo_c', 'md-14', 'Matchday 14', 3),
  -- Grupo D (md-2, md-4, md-9, md-10, md-15)
  ('B0000000-0000-0000-0000-000000000401', 'grupo_d', 'md-2',  'Matchday 2', 1),
  ('B0000000-0000-0000-0000-000000000402', 'grupo_d', 'md-4',  'Matchday 4', 2),
  ('B0000000-0000-0000-0000-000000000403', 'grupo_d', 'md-9',  'Matchday 9', 3),
  ('B0000000-0000-0000-0000-000000000404', 'grupo_d', 'md-10', 'Matchday 10', 4),
  ('B0000000-0000-0000-0000-000000000405', 'grupo_d', 'md-15', 'Matchday 15', 5),
  -- Grupo E (md-4, md-10, md-15)
  ('B0000000-0000-0000-0000-000000000501', 'grupo_e', 'md-4',  'Matchday 4', 1),
  ('B0000000-0000-0000-0000-000000000502', 'grupo_e', 'md-10', 'Matchday 10', 2),
  ('B0000000-0000-0000-0000-000000000503', 'grupo_e', 'md-15', 'Matchday 15', 3),
  -- Grupo F (md-4, md-10, md-11, md-15)
  ('B0000000-0000-0000-0000-000000000601', 'grupo_f', 'md-4',  'Matchday 4', 1),
  ('B0000000-0000-0000-0000-000000000602', 'grupo_f', 'md-10', 'Matchday 10', 2),
  ('B0000000-0000-0000-0000-000000000603', 'grupo_f', 'md-11', 'Matchday 11', 3),
  ('B0000000-0000-0000-0000-000000000604', 'grupo_f', 'md-15', 'Matchday 15', 4),
  -- Grupo G (md-5, md-11, md-17)
  ('B0000000-0000-0000-0000-000000000701', 'grupo_g', 'md-5',  'Matchday 5', 1),
  ('B0000000-0000-0000-0000-000000000702', 'grupo_g', 'md-11', 'Matchday 11', 2),
  ('B0000000-0000-0000-0000-000000000703', 'grupo_g', 'md-17', 'Matchday 17', 3),
  -- Grupo H (md-5, md-11, md-16)
  ('B0000000-0000-0000-0000-000000000801', 'grupo_h', 'md-5',  'Matchday 5', 1),
  ('B0000000-0000-0000-0000-000000000802', 'grupo_h', 'md-11', 'Matchday 11', 2),
  ('B0000000-0000-0000-0000-000000000803', 'grupo_h', 'md-16', 'Matchday 16', 3),
  -- Grupo I (md-6, md-12, md-16)
  ('B0000000-0000-0000-0000-000000000901', 'grupo_i', 'md-6',  'Matchday 6', 1),
  ('B0000000-0000-0000-0000-000000000902', 'grupo_i', 'md-12', 'Matchday 12', 2),
  ('B0000000-0000-0000-0000-000000000903', 'grupo_i', 'md-16', 'Matchday 16', 3),
  -- Grupo J (md-6, md-7, md-12, md-13, md-17)
  ('B0000000-0000-0000-0000-000000001001', 'grupo_j', 'md-6',  'Matchday 6', 1),
  ('B0000000-0000-0000-0000-000000001002', 'grupo_j', 'md-7',  'Matchday 7', 2),
  ('B0000000-0000-0000-0000-000000001003', 'grupo_j', 'md-12', 'Matchday 12', 3),
  ('B0000000-0000-0000-0000-000000001004', 'grupo_j', 'md-13', 'Matchday 13', 4),
  ('B0000000-0000-0000-0000-000000001005', 'grupo_j', 'md-17', 'Matchday 17', 5),
  -- Grupo K (md-7, md-13, md-17)
  ('B0000000-0000-0000-0000-000000001101', 'grupo_k', 'md-7',  'Matchday 7', 1),
  ('B0000000-0000-0000-0000-000000001102', 'grupo_k', 'md-13', 'Matchday 13', 2),
  ('B0000000-0000-0000-0000-000000001103', 'grupo_k', 'md-17', 'Matchday 17', 3),
  -- Grupo L (md-7, md-13, md-17)
  ('B0000000-0000-0000-0000-000000001201', 'grupo_l', 'md-7',  'Matchday 7', 1),
  ('B0000000-0000-0000-0000-000000001202', 'grupo_l', 'md-13', 'Matchday 13', 2),
  ('B0000000-0000-0000-0000-000000001203', 'grupo_l', 'md-17', 'Matchday 17', 3),
  -- Knockout stages (1 round each)
  ('B0000000-0000-0000-0000-000000001301', '1_16',      'r1', 'Fase 1/16', 1),
  ('B0000000-0000-0000-0000-000000001401', 'oitavas',   'r1', 'Oitavas', 1),
  ('B0000000-0000-0000-0000-000000001501', 'quartas',   'r1', 'Quartas', 1),
  ('B0000000-0000-0000-0000-000000001601', 'semi',      'r1', 'Semi', 1),
  ('B0000000-0000-0000-0000-000000001701', 'disputa_3', 'r1', 'Disputa 3º', 1),
  ('B0000000-0000-0000-0000-000000001801', 'final',     'r1', 'Final', 1)
) AS r(id, stage_slug, slug, nome, ordem)
WHERE s.slug = r.stage_slug AND s.edition_id = e.id;

-- =============================================================
-- 7. MATCHES (103 partidas)
-- =============================================================
-- Helper: get edition teams by nome
-- Helper: get round id by stage_slug + round_slug

-- << GRUPO A >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id, slug FROM rounds WHERE stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'grupo_a')),
     t AS (SELECT id, nome FROM teams)
INSERT INTO matches (id, edition_id, round_id, time_a_id, time_b_id, grupo_letra, data_iso, horario, estadio, slug, ordem)
SELECT m.id, e.id, r.id, ta.id, tb.id, 'A', m.dt, m.hr, m.est, m.mslug, m.ordem
FROM e, r, t ta, t tb
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000001', 'md-1',  'México',        'África do Sul',   '2026-06-11', '16:00', 'Estadio Azteca, Mexico City',      'grupo-a-jogo-1', 1),
  ('D0000000-0000-0000-0000-000000000002', 'md-1',  'Coreia do Sul',  'República Tcheca','2026-06-11', '23:00', 'Estadio Akron, Zapopan',             'grupo-a-jogo-2', 2),
  ('D0000000-0000-0000-0000-000000000003', 'md-8',  'República Tcheca','África do Sul',  '2026-06-18', '13:00', 'Mercedes-Benz Stadium, Atlanta',     'grupo-a-jogo-3', 3),
  ('D0000000-0000-0000-0000-000000000004', 'md-8',  'México',         'Coreia do Sul',   '2026-06-18', '22:00', 'Estadio Akron, Zapopan',              'grupo-a-jogo-4', 4),
  ('D0000000-0000-0000-0000-000000000005', 'md-14', 'República Tcheca','México',         '2026-06-24', '22:00', 'Estadio Azteca, Mexico City',         'grupo-a-jogo-5', 5),
  ('D0000000-0000-0000-0000-000000000006', 'md-14', 'África do Sul',  'Coreia do Sul',   '2026-06-24', '22:00', 'Estadio BBVA, Monterrey',             'grupo-a-jogo-6', 6)
) AS m(rid, rslug, ta_nome, tb_nome, dt, hr, est, mslug, ordem)
WHERE r.slug = m.rslug AND ta.nome = m.ta_nome AND tb.nome = m.tb_nome;

-- << GRUPO B >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id, slug FROM rounds WHERE stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'grupo_b')),
     t AS (SELECT id, nome FROM teams)
INSERT INTO matches (id, edition_id, round_id, time_a_id, time_b_id, grupo_letra, data_iso, horario, estadio, slug, ordem)
SELECT m.id, e.id, r.id, ta.id, tb.id, 'B', m.dt, m.hr, m.est, m.mslug, m.ordem
FROM e, r, t ta, t tb
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000007', 'md-2',  'Canadá',               'Bosnia & Herzegovina', '2026-06-12', '16:00', 'BMO Field, Toronto',                  'grupo-b-jogo-1', 1),
  ('D0000000-0000-0000-0000-000000000008', 'md-3',  'Qatar',                'Suíça',                '2026-06-13', '16:00', 'Levis Stadium, Santa Clara',          'grupo-b-jogo-2', 2),
  ('D0000000-0000-0000-0000-000000000009', 'md-8',  'Suíça',                'Bosnia & Herzegovina', '2026-06-18', '16:00', 'SoFi Stadium, Inglewood',             'grupo-b-jogo-3', 3),
  ('D0000000-0000-0000-0000-000000000010', 'md-8',  'Canadá',               'Qatar',                '2026-06-18', '19:00', 'BC Place, Vancouver',                 'grupo-b-jogo-4', 4),
  ('D0000000-0000-0000-0000-000000000011', 'md-14', 'Suíça',                'Canadá',               '2026-06-24', '16:00', 'BC Place, Vancouver',                 'grupo-b-jogo-5', 5),
  ('D0000000-0000-0000-0000-000000000012', 'md-14', 'Bosnia & Herzegovina', 'Qatar',                '2026-06-24', '16:00', 'Lumen Field, Seattle',                'grupo-b-jogo-6', 6)
) AS m(rid, rslug, ta_nome, tb_nome, dt, hr, est, mslug, ordem)
WHERE r.slug = m.rslug AND ta.nome = m.ta_nome AND tb.nome = m.tb_nome;

-- << GRUPO C >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id, slug FROM rounds WHERE stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'grupo_c')),
     t AS (SELECT id, nome FROM teams)
INSERT INTO matches (id, edition_id, round_id, time_a_id, time_b_id, grupo_letra, data_iso, horario, estadio, slug, ordem)
SELECT m.id, e.id, r.id, ta.id, tb.id, 'C', m.dt, m.hr, m.est, m.mslug, m.ordem
FROM e, r, t ta, t tb
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000013', 'md-3',  'Brasil',   'Marrocos',  '2026-06-13', '19:00', 'MetLife Stadium, East Rutherford',        'grupo-c-jogo-1', 1),
  ('D0000000-0000-0000-0000-000000000014', 'md-3',  'Haiti',    'Escócia',   '2026-06-13', '22:00', 'Gillette Stadium, Foxborough',            'grupo-c-jogo-2', 2),
  ('D0000000-0000-0000-0000-000000000015', 'md-9',  'Escócia',  'Marrocos',  '2026-06-19', '19:00', 'Gillette Stadium, Foxborough',            'grupo-c-jogo-3', 3),
  ('D0000000-0000-0000-0000-000000000016', 'md-9',  'Brasil',   'Haiti',     '2026-06-19', '21:30', 'Lincoln Financial Field, Philadelphia',   'grupo-c-jogo-4', 4),
  ('D0000000-0000-0000-0000-000000000017', 'md-14', 'Escócia',  'Brasil',    '2026-06-24', '19:00', 'Hard Rock Stadium, Miami Gardens',         'grupo-c-jogo-5', 5),
  ('D0000000-0000-0000-0000-000000000018', 'md-14', 'Marrocos', 'Haiti',     '2026-06-24', '19:00', 'Mercedes-Benz Stadium, Atlanta',          'grupo-c-jogo-6', 6)
) AS m(rid, rslug, ta_nome, tb_nome, dt, hr, est, mslug, ordem)
WHERE r.slug = m.rslug AND ta.nome = m.ta_nome AND tb.nome = m.tb_nome;

-- << GRUPO D >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id, slug FROM rounds WHERE stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'grupo_d')),
     t AS (SELECT id, nome FROM teams)
INSERT INTO matches (id, edition_id, round_id, time_a_id, time_b_id, grupo_letra, data_iso, horario, estadio, slug, ordem)
SELECT m.id, e.id, r.id, ta.id, tb.id, 'D', m.dt, m.hr, m.est, m.mslug, m.ordem
FROM e, r, t ta, t tb
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000019', 'md-2',  'Estados Unidos', 'Paraguai',    '2026-06-12', '22:00', 'SoFi Stadium, Inglewood',              'grupo-d-jogo-1', 1),
  ('D0000000-0000-0000-0000-000000000020', 'md-4',  'Austrália',      'Turquia',     '2026-06-14', '01:00', 'BC Place, Vancouver',                  'grupo-d-jogo-2', 2),
  ('D0000000-0000-0000-0000-000000000021', 'md-9',  'Estados Unidos', 'Austrália',   '2026-06-19', '16:00', 'Lumen Field, Seattle',                 'grupo-d-jogo-3', 3),
  ('D0000000-0000-0000-0000-000000000022', 'md-10', 'Turquia',        'Paraguai',    '2026-06-20', '00:00', 'Levis Stadium, Santa Clara',           'grupo-d-jogo-4', 4),
  ('D0000000-0000-0000-0000-000000000023', 'md-15', 'Turquia',        'Estados Unidos', '2026-06-25', '23:00', 'SoFi Stadium, Inglewood',              'grupo-d-jogo-5', 5),
  ('D0000000-0000-0000-0000-000000000024', 'md-15', 'Paraguai',       'Austrália',   '2026-06-25', '23:00', 'Levis Stadium, Santa Clara',           'grupo-d-jogo-6', 6)
) AS m(rid, rslug, ta_nome, tb_nome, dt, hr, est, mslug, ordem)
WHERE r.slug = m.rslug AND ta.nome = m.ta_nome AND tb.nome = m.tb_nome;

-- << GRUPO E >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id, slug FROM rounds WHERE stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'grupo_e')),
     t AS (SELECT id, nome FROM teams)
INSERT INTO matches (id, edition_id, round_id, time_a_id, time_b_id, grupo_letra, data_iso, horario, estadio, slug, ordem)
SELECT m.id, e.id, r.id, ta.id, tb.id, 'E', m.dt, m.hr, m.est, m.mslug, m.ordem
FROM e, r, t ta, t tb
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000025', 'md-4',  'Alemanha',       'Curaçao',          '2026-06-14', '14:00', 'NRG Stadium, Houston',                  'grupo-e-jogo-1', 1),
  ('D0000000-0000-0000-0000-000000000026', 'md-4',  'Costa do Marfim','Equador',          '2026-06-14', '20:00', 'Lincoln Financial Field, Philadelphia', 'grupo-e-jogo-2', 2),
  ('D0000000-0000-0000-0000-000000000027', 'md-10', 'Alemanha',       'Costa do Marfim',  '2026-06-20', '17:00', 'BMO Field, Toronto',                    'grupo-e-jogo-3', 3),
  ('D0000000-0000-0000-0000-000000000028', 'md-10', 'Equador',        'Curaçao',          '2026-06-20', '21:00', 'Arrowhead Stadium, Kansas City',        'grupo-e-jogo-4', 4),
  ('D0000000-0000-0000-0000-000000000029', 'md-15', 'Curaçao',        'Costa do Marfim',  '2026-06-25', '17:00', 'Lincoln Financial Field, Philadelphia', 'grupo-e-jogo-5', 5),
  ('D0000000-0000-0000-0000-000000000030', 'md-15', 'Equador',        'Alemanha',         '2026-06-25', '17:00', 'MetLife Stadium, East Rutherford',      'grupo-e-jogo-6', 6)
) AS m(rid, rslug, ta_nome, tb_nome, dt, hr, est, mslug, ordem)
WHERE r.slug = m.rslug AND ta.nome = m.ta_nome AND tb.nome = m.tb_nome;

-- << GRUPO F >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id, slug FROM rounds WHERE stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'grupo_f')),
     t AS (SELECT id, nome FROM teams)
INSERT INTO matches (id, edition_id, round_id, time_a_id, time_b_id, grupo_letra, data_iso, horario, estadio, slug, ordem)
SELECT m.id, e.id, r.id, ta.id, tb.id, 'F', m.dt, m.hr, m.est, m.mslug, m.ordem
FROM e, r, t ta, t tb
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000031', 'md-4',  'Holanda', 'Japão',   '2026-06-14', '17:00', 'AT&T Stadium, Arlington',           'grupo-f-jogo-1', 1),
  ('D0000000-0000-0000-0000-000000000032', 'md-4',  'Suécia',  'Tunísia', '2026-06-14', '23:00', 'Estadio BBVA, Monterrey',           'grupo-f-jogo-2', 2),
  ('D0000000-0000-0000-0000-000000000033', 'md-10', 'Holanda', 'Suécia',  '2026-06-20', '14:00', 'NRG Stadium, Houston',              'grupo-f-jogo-3', 3),
  ('D0000000-0000-0000-0000-000000000034', 'md-11', 'Tunísia', 'Japão',   '2026-06-21', '01:00', 'Estadio BBVA, Monterrey',           'grupo-f-jogo-4', 4),
  ('D0000000-0000-0000-0000-000000000035', 'md-15', 'Japão',   'Suécia',  '2026-06-25', '20:00', 'AT&T Stadium, Arlington',           'grupo-f-jogo-5', 5),
  ('D0000000-0000-0000-0000-000000000036', 'md-15', 'Tunísia', 'Holanda', '2026-06-25', '20:00', 'Arrowhead Stadium, Kansas City',    'grupo-f-jogo-6', 6)
) AS m(rid, rslug, ta_nome, tb_nome, dt, hr, est, mslug, ordem)
WHERE r.slug = m.rslug AND ta.nome = m.ta_nome AND tb.nome = m.tb_nome;

-- << GRUPO G >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id, slug FROM rounds WHERE stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'grupo_g')),
     t AS (SELECT id, nome FROM teams)
INSERT INTO matches (id, edition_id, round_id, time_a_id, time_b_id, grupo_letra, data_iso, horario, estadio, slug, ordem)
SELECT m.id, e.id, r.id, ta.id, tb.id, 'G', m.dt, m.hr, m.est, m.mslug, m.ordem
FROM e, r, t ta, t tb
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000037', 'md-5',  'Bélgica',       'Egito',          '2026-06-15', '16:00', 'Lumen Field, Seattle',                'grupo-g-jogo-1', 1),
  ('D0000000-0000-0000-0000-000000000038', 'md-5',  'Irã',           'Nova Zelândia',  '2026-06-15', '22:00', 'SoFi Stadium, Inglewood',              'grupo-g-jogo-2', 2),
  ('D0000000-0000-0000-0000-000000000039', 'md-11', 'Bélgica',       'Irã',            '2026-06-21', '16:00', 'SoFi Stadium, Inglewood',              'grupo-g-jogo-3', 3),
  ('D0000000-0000-0000-0000-000000000040', 'md-11', 'Nova Zelândia', 'Egito',          '2026-06-21', '22:00', 'BC Place, Vancouver',                  'grupo-g-jogo-4', 4),
  ('D0000000-0000-0000-0000-000000000041', 'md-17', 'Egito',         'Irã',            '2026-06-27', '00:00', 'Lumen Field, Seattle',                 'grupo-g-jogo-5', 5),
  ('D0000000-0000-0000-0000-000000000042', 'md-17', 'Nova Zelândia', 'Bélgica',        '2026-06-27', '00:00', 'BC Place, Vancouver',                  'grupo-g-jogo-6', 6)
) AS m(rid, rslug, ta_nome, tb_nome, dt, hr, est, mslug, ordem)
WHERE r.slug = m.rslug AND ta.nome = m.ta_nome AND tb.nome = m.tb_nome;

-- << GRUPO H >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id, slug FROM rounds WHERE stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'grupo_h')),
     t AS (SELECT id, nome FROM teams)
INSERT INTO matches (id, edition_id, round_id, time_a_id, time_b_id, grupo_letra, data_iso, horario, estadio, slug, ordem)
SELECT m.id, e.id, r.id, ta.id, tb.id, 'H', m.dt, m.hr, m.est, m.mslug, m.ordem
FROM e, r, t ta, t tb
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000043', 'md-5',  'Espanha',        'Cabo Verde',       '2026-06-15', '13:00', 'Mercedes-Benz Stadium, Atlanta',        'grupo-h-jogo-1', 1),
  ('D0000000-0000-0000-0000-000000000044', 'md-5',  'Arábia Saudita', 'Uruguai',          '2026-06-15', '19:00', 'Hard Rock Stadium, Miami Gardens',      'grupo-h-jogo-2', 2),
  ('D0000000-0000-0000-0000-000000000045', 'md-11', 'Espanha',        'Arábia Saudita',   '2026-06-21', '13:00', 'Mercedes-Benz Stadium, Atlanta',        'grupo-h-jogo-3', 3),
  ('D0000000-0000-0000-0000-000000000046', 'md-11', 'Uruguai',        'Cabo Verde',       '2026-06-21', '19:00', 'Hard Rock Stadium, Miami Gardens',      'grupo-h-jogo-4', 4),
  ('D0000000-0000-0000-0000-000000000047', 'md-16', 'Cabo Verde',     'Arábia Saudita',   '2026-06-26', '21:00', 'NRG Stadium, Houston',                   'grupo-h-jogo-5', 5),
  ('D0000000-0000-0000-0000-000000000048', 'md-16', 'Uruguai',        'Espanha',          '2026-06-26', '21:00', 'Estadio Akron, Zapopan',                'grupo-h-jogo-6', 6)
) AS m(rid, rslug, ta_nome, tb_nome, dt, hr, est, mslug, ordem)
WHERE r.slug = m.rslug AND ta.nome = m.ta_nome AND tb.nome = m.tb_nome;

-- << GRUPO I >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id, slug FROM rounds WHERE stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'grupo_i')),
     t AS (SELECT id, nome FROM teams)
INSERT INTO matches (id, edition_id, round_id, time_a_id, time_b_id, grupo_letra, data_iso, horario, estadio, slug, ordem)
SELECT m.id, e.id, r.id, ta.id, tb.id, 'I', m.dt, m.hr, m.est, m.mslug, m.ordem
FROM e, r, t ta, t tb
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000049', 'md-6',  'França',  'Senegal', '2026-06-16', '16:00', 'MetLife Stadium, East Rutherford',      'grupo-i-jogo-1', 1),
  ('D0000000-0000-0000-0000-000000000050', 'md-6',  'Iraque',  'Noruega', '2026-06-16', '19:00', 'Gillette Stadium, Foxborough',          'grupo-i-jogo-2', 2),
  ('D0000000-0000-0000-0000-000000000051', 'md-12', 'França',  'Iraque',  '2026-06-22', '18:00', 'Lincoln Financial Field, Philadelphia', 'grupo-i-jogo-3', 3),
  ('D0000000-0000-0000-0000-000000000052', 'md-12', 'Noruega', 'Senegal', '2026-06-22', '21:00', 'MetLife Stadium, East Rutherford',      'grupo-i-jogo-4', 4),
  ('D0000000-0000-0000-0000-000000000053', 'md-16', 'Noruega', 'França',  '2026-06-26', '16:00', 'Gillette Stadium, Foxborough',          'grupo-i-jogo-5', 5),
  ('D0000000-0000-0000-0000-000000000054', 'md-16', 'Senegal', 'Iraque',  '2026-06-26', '16:00', 'BMO Field, Toronto',                    'grupo-i-jogo-6', 6)
) AS m(rid, rslug, ta_nome, tb_nome, dt, hr, est, mslug, ordem)
WHERE r.slug = m.rslug AND ta.nome = m.ta_nome AND tb.nome = m.tb_nome;

-- << GRUPO J >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id, slug FROM rounds WHERE stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'grupo_j')),
     t AS (SELECT id, nome FROM teams)
INSERT INTO matches (id, edition_id, round_id, time_a_id, time_b_id, grupo_letra, data_iso, horario, estadio, slug, ordem)
SELECT m.id, e.id, r.id, ta.id, tb.id, 'J', m.dt, m.hr, m.est, m.mslug, m.ordem
FROM e, r, t ta, t tb
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000055', 'md-6',  'Argentina', 'Argélia',  '2026-06-16', '22:00', 'Arrowhead Stadium, Kansas City',        'grupo-j-jogo-1', 1),
  ('D0000000-0000-0000-0000-000000000056', 'md-7',  'Áustria',   'Jordânia', '2026-06-17', '01:00', 'Levis Stadium, Santa Clara',            'grupo-j-jogo-2', 2),
  ('D0000000-0000-0000-0000-000000000057', 'md-12', 'Argentina', 'Áustria',  '2026-06-22', '14:00', 'AT&T Stadium, Arlington',               'grupo-j-jogo-3', 3),
  ('D0000000-0000-0000-0000-000000000058', 'md-13', 'Jordânia',  'Argélia',  '2026-06-23', '00:00', 'Levis Stadium, Santa Clara',            'grupo-j-jogo-4', 4),
  ('D0000000-0000-0000-0000-000000000059', 'md-17', 'Argélia',   'Áustria',  '2026-06-27', '23:00', 'Arrowhead Stadium, Kansas City',        'grupo-j-jogo-5', 5),
  ('D0000000-0000-0000-0000-000000000060', 'md-17', 'Jordânia',  'Argentina','2026-06-27', '23:00', 'AT&T Stadium, Arlington',               'grupo-j-jogo-6', 6)
) AS m(rid, rslug, ta_nome, tb_nome, dt, hr, est, mslug, ordem)
WHERE r.slug = m.rslug AND ta.nome = m.ta_nome AND tb.nome = m.tb_nome;

-- << GRUPO K >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id, slug FROM rounds WHERE stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'grupo_k')),
     t AS (SELECT id, nome FROM teams)
INSERT INTO matches (id, edition_id, round_id, time_a_id, time_b_id, grupo_letra, data_iso, horario, estadio, slug, ordem)
SELECT m.id, e.id, r.id, ta.id, tb.id, 'K', m.dt, m.hr, m.est, m.mslug, m.ordem
FROM e, r, t ta, t tb
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000061', 'md-7',  'Portugal',    'RD Congo',     '2026-06-17', '14:00', 'NRG Stadium, Houston',                  'grupo-k-jogo-1', 1),
  ('D0000000-0000-0000-0000-000000000062', 'md-7',  'Uzbequistão', 'Colômbia',     '2026-06-17', '23:00', 'Estadio Azteca, Mexico City',           'grupo-k-jogo-2', 2),
  ('D0000000-0000-0000-0000-000000000063', 'md-13', 'Portugal',    'Uzbequistão',  '2026-06-23', '14:00', 'NRG Stadium, Houston',                  'grupo-k-jogo-3', 3),
  ('D0000000-0000-0000-0000-000000000064', 'md-13', 'Colômbia',    'RD Congo',     '2026-06-23', '23:00', 'Estadio Akron, Zapopan',                'grupo-k-jogo-4', 4),
  ('D0000000-0000-0000-0000-000000000065', 'md-17', 'Colômbia',    'Portugal',     '2026-06-27', '20:30', 'Hard Rock Stadium, Miami Gardens',      'grupo-k-jogo-5', 5),
  ('D0000000-0000-0000-0000-000000000066', 'md-17', 'RD Congo',    'Uzbequistão',  '2026-06-27', '20:30', 'Mercedes-Benz Stadium, Atlanta',        'grupo-k-jogo-6', 6)
) AS m(rid, rslug, ta_nome, tb_nome, dt, hr, est, mslug, ordem)
WHERE r.slug = m.rslug AND ta.nome = m.ta_nome AND tb.nome = m.tb_nome;

-- << GRUPO L >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id, slug FROM rounds WHERE stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'grupo_l')),
     t AS (SELECT id, nome FROM teams)
INSERT INTO matches (id, edition_id, round_id, time_a_id, time_b_id, grupo_letra, data_iso, horario, estadio, slug, ordem)
SELECT m.id, e.id, r.id, ta.id, tb.id, 'L', m.dt, m.hr, m.est, m.mslug, m.ordem
FROM e, r, t ta, t tb
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000067', 'md-7',  'Inglaterra', 'Croácia', '2026-06-17', '17:00', 'AT&T Stadium, Arlington',               'grupo-l-jogo-1', 1),
  ('D0000000-0000-0000-0000-000000000068', 'md-7',  'Gana',       'Panamá',  '2026-06-17', '20:00', 'BMO Field, Toronto',                    'grupo-l-jogo-2', 2),
  ('D0000000-0000-0000-0000-000000000069', 'md-13', 'Inglaterra', 'Gana',    '2026-06-23', '17:00', 'Gillette Stadium, Foxborough',          'grupo-l-jogo-3', 3),
  ('D0000000-0000-0000-0000-000000000070', 'md-13', 'Panamá',     'Croácia', '2026-06-23', '20:00', 'BMO Field, Toronto',                    'grupo-l-jogo-4', 4),
  ('D0000000-0000-0000-0000-000000000071', 'md-17', 'Panamá',     'Inglaterra', '2026-06-27', '18:00', 'MetLife Stadium, East Rutherford',      'grupo-l-jogo-5', 5),
  ('D0000000-0000-0000-0000-000000000072', 'md-17', 'Croácia',    'Gana',    '2026-06-27', '18:00', 'Lincoln Financial Field, Philadelphia', 'grupo-l-jogo-6', 6)
) AS m(rid, rslug, ta_nome, tb_nome, dt, hr, est, mslug, ordem)
WHERE r.slug = m.rslug AND ta.nome = m.ta_nome AND tb.nome = m.tb_nome;

-- << FASE 1/16 (16 partidas com placeholders) >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id FROM rounds WHERE slug = 'r1' AND stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = '1_16'))
INSERT INTO matches (id, edition_id, round_id, time_a_nome, time_b_nome, data_iso, horario, estadio, slug, status, ordem)
SELECT m.id, e.id, r.id, m.ta, m.tb, m.dt, m.hr, m.est, m.mslug, 'agendado', m.ordem
FROM e, r
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000073', '1/16 #1',  '1/16 #16', '2026-06-28', '16:00', 'Levis Stadium, Santa Clara',          'dez-1', 1),
  ('D0000000-0000-0000-0000-000000000074', '1/16 #2',  '1/16 #15', '2026-06-29', '14:00', 'Arrowhead Stadium, Kansas City',      'dez-2', 2),
  ('D0000000-0000-0000-0000-000000000075', '1/16 #3',  '1/16 #14', '2026-06-29', '17:30', 'Gillette Stadium, Foxborough',        'dez-3', 3),
  ('D0000000-0000-0000-0000-000000000076', '1/16 #4',  '1/16 #13', '2026-06-29', '22:00', 'Estadio Azteca, Mexico City',         'dez-4', 4),
  ('D0000000-0000-0000-0000-000000000077', '1/16 #5',  '1/16 #12', '2026-06-30', '14:00', 'Estadio Akron, Zapopan',              'dez-5', 5),
  ('D0000000-0000-0000-0000-000000000078', '1/16 #6',  '1/16 #11', '2026-06-30', '18:00', 'Estadio BBVA, Monterrey',             'dez-6', 6),
  ('D0000000-0000-0000-0000-000000000079', '1/16 #7',  '1/16 #10', '2026-06-30', '22:00', 'BMO Field, Toronto',                  'dez-7', 7),
  ('D0000000-0000-0000-0000-000000000080', '1/16 #8',  '1/16 #9',  '2026-07-01', '13:00', 'BC Place, Vancouver',                 'dez-8', 8),
  ('D0000000-0000-0000-0000-000000000081', '1/16 #17', '1/16 #32', '2026-07-01', '17:00', 'MetLife Stadium, East Rutherford',    'dez-9', 9),
  ('D0000000-0000-0000-0000-000000000082', '1/16 #18', '1/16 #31', '2026-07-01', '21:00', 'SoFi Stadium, Inglewood',             'dez-10', 10),
  ('D0000000-0000-0000-0000-000000000083', '1/16 #19', '1/16 #30', '2026-07-02', '16:00', 'AT&T Stadium, Arlington',             'dez-11', 11),
  ('D0000000-0000-0000-0000-000000000084', '1/16 #20', '1/16 #29', '2026-07-02', '20:00', 'Hard Rock Stadium, Miami Gardens',    'dez-12', 12),
  ('D0000000-0000-0000-0000-000000000085', '1/16 #21', '1/16 #28', '2026-07-03', '00:00', 'Mercedes-Benz Stadium, Atlanta',      'dez-13', 13),
  ('D0000000-0000-0000-0000-000000000086', '1/16 #22', '1/16 #27', '2026-07-03', '15:00', 'NRG Stadium, Houston',                'dez-14', 14),
  ('D0000000-0000-0000-0000-000000000087', '1/16 #23', '1/16 #26', '2026-07-03', '19:00', 'Lincoln Financial Field, Philadelphia', 'dez-15', 15),
  ('D0000000-0000-0000-0000-000000000088', '1/16 #24', '1/16 #25', '2026-07-03', '22:30', 'Lumen Field, Seattle',                'dez-16', 16)
) AS m(id, ta, tb, dt, hr, est, mslug, ordem);

-- << OITAVAS (8 partidas) >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id FROM rounds WHERE slug = 'r1' AND stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'oitavas'))
INSERT INTO matches (id, edition_id, round_id, time_a_nome, time_b_nome, data_iso, horario, estadio, slug, status, ordem)
SELECT m.id, e.id, r.id, m.ta, m.tb, m.dt, m.hr, m.est, m.mslug, 'agendado', m.ordem
FROM e, r
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000089', '1A', '2B', '2026-06-29', '13:00', '', 'oit-1', 1),
  ('D0000000-0000-0000-0000-000000000090', '1C', '2D', '2026-06-29', '16:00', '', 'oit-2', 2),
  ('D0000000-0000-0000-0000-000000000091', '1B', '2A', '2026-06-30', '13:00', '', 'oit-3', 3),
  ('D0000000-0000-0000-0000-000000000092', '1D', '2C', '2026-06-30', '16:00', '', 'oit-4', 4),
  ('D0000000-0000-0000-0000-000000000093', '1E', '2F', '2026-07-01', '13:00', '', 'oit-5', 5),
  ('D0000000-0000-0000-0000-000000000094', '1G', '2H', '2026-07-01', '16:00', '', 'oit-6', 6),
  ('D0000000-0000-0000-0000-000000000095', '1F', '2E', '2026-07-02', '13:00', '', 'oit-7', 7),
  ('D0000000-0000-0000-0000-000000000096', '1H', '2G', '2026-07-02', '16:00', '', 'oit-8', 8)
) AS m(id, ta, tb, dt, hr, est, mslug, ordem);

-- << QUARTAS (4 partidas) >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id FROM rounds WHERE slug = 'r1' AND stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'quartas'))
INSERT INTO matches (id, edition_id, round_id, time_a_nome, time_b_nome, data_iso, horario, estadio, slug, status, ordem)
SELECT m.id, e.id, r.id, m.ta, m.tb, m.dt, m.hr, m.est, m.mslug, 'agendado', m.ordem
FROM e, r
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000097', 'V Oit1', 'V Oit3', '2026-07-05', '13:00', '', 'qua-1', 1),
  ('D0000000-0000-0000-0000-000000000098', 'V Oit2', 'V Oit4', '2026-07-05', '16:00', '', 'qua-2', 2),
  ('D0000000-0000-0000-0000-000000000099', 'V Oit5', 'V Oit7', '2026-07-06', '13:00', '', 'qua-3', 3),
  ('D0000000-0000-0000-0000-000000000100', 'V Oit6', 'V Oit8', '2026-07-06', '16:00', '', 'qua-4', 4)
) AS m(id, ta, tb, dt, hr, est, mslug, ordem);

-- << SEMI (2 partidas) >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id FROM rounds WHERE slug = 'r1' AND stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'semi'))
INSERT INTO matches (id, edition_id, round_id, time_a_nome, time_b_nome, data_iso, horario, estadio, slug, status, ordem)
SELECT m.id, e.id, r.id, m.ta, m.tb, m.dt, m.hr, m.est, m.mslug, 'agendado', m.ordem
FROM e, r
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000101', 'V Qua1', 'V Qua2', '2026-07-09', '16:00', '', 'sem-1', 1),
  ('D0000000-0000-0000-0000-000000000102', 'V Qua3', 'V Qua4', '2026-07-10', '16:00', '', 'sem-2', 2)
) AS m(id, ta, tb, dt, hr, est, mslug, ordem);

-- << DISPUTA 3º LUGAR >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id FROM rounds WHERE slug = 'r1' AND stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'disputa_3'))
INSERT INTO matches (id, edition_id, round_id, time_a_nome, time_b_nome, data_iso, horario, estadio, slug, status, ordem)
SELECT m.id, e.id, r.id, m.ta, m.tb, m.dt, m.hr, m.est, m.mslug, 'agendado', m.ordem
FROM e, r
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000103', 'V Sem1', 'V Sem2', '2026-07-13', '13:00', '', '3o-lugar', 1)
) AS m(id, ta, tb, dt, hr, est, mslug, ordem);

-- << FINAL >>
WITH e AS (SELECT id FROM competition_editions WHERE slug = 'world-cup-2026'),
     r AS (SELECT id FROM rounds WHERE slug = 'r1' AND stage_id IN (SELECT id FROM stages WHERE edition_id = (SELECT id FROM e) AND slug = 'final'))
INSERT INTO matches (id, edition_id, round_id, time_a_nome, time_b_nome, data_iso, horario, estadio, slug, status, ordem)
SELECT m.id, e.id, r.id, m.ta, m.tb, m.dt, m.hr, m.est, m.mslug, 'agendado', m.ordem
FROM e, r
CROSS JOIN (VALUES
  ('D0000000-0000-0000-0000-000000000104', 'V Sem1', 'V Sem2', '2026-07-13', '16:00', '', 'final', 1)
) AS m(id, ta, tb, dt, hr, est, mslug, ordem);

-- =============================================================
-- 8. GRUPO PADRÃO "GERAL" + CONFIG
-- =============================================================
INSERT INTO groups (id, edition_id, nome, slug)
SELECT 'E0000000-0000-0000-0000-000000000001', e.id, 'Geral', 'geral'
FROM competition_editions e WHERE e.slug = 'world-cup-2026'
AND NOT EXISTS (SELECT 1 FROM groups WHERE slug = 'geral');

INSERT INTO group_config (grupo_id, valor_aposta, api_url, bonus_geral, regras)
SELECT id, 20, '', 0, '{"pontos_placar_exato":5,"pontos_diferenca_certa":4,"pontos_vencedor_certo":3}'
FROM groups WHERE slug = 'geral'
AND NOT EXISTS (SELECT 1 FROM group_config WHERE grupo_id = (SELECT id FROM groups WHERE slug = 'geral'));

-- =============================================================
-- 9. VERIFICAÇÕES
-- =============================================================
-- Descomente para testar:
-- SELECT COUNT(*) AS total_times FROM teams WHERE is_placeholder = FALSE;
-- SELECT COUNT(*) AS total_partidas FROM matches;
-- SELECT g.nome AS grupo, s.nome AS fase, COUNT(m.id) AS jogos
--   FROM matches m JOIN stages s ON s.id IN (SELECT id FROM stages WHERE edition_id = m.edition_id)
--   JOIN groups g ON g.edition_id = m.edition_id
--   WHERE g.slug = 'geral' GROUP BY g.nome, s.nome ORDER BY s.ordem;
