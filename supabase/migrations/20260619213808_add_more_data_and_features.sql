/*
# Melhorar dados e schema - mais operários, incidentes e funcionalidades

1. New Data
- Adiciona mais operários (total de 20)
- Adiciona mais incidentes (total de 12)
- Adiciona mais máquinas (total de 10)

2. Schema Changes
- Adiciona coluna `localizacao` em maquinas (texto para posição no mapa)
- Adiciona coluna `observacoes` em operarios
- Adiciona coluna `data_aquisicao` em maquinas
*/

-- Adicionar colunas extras
ALTER TABLE maquinas 
  ADD COLUMN IF NOT EXISTS localizacao text,
  ADD COLUMN IF NOT EXISTS data_aquisicao date;

ALTER TABLE operarios 
  ADD COLUMN IF NOT EXISTS observacoes text;

-- Inserir mais operários
INSERT INTO operarios (nome, matricula, cargo, setor_id, ativo, observacoes) VALUES
  ('Marcos Souza', 'OP-009', 'Cortador', (SELECT id FROM setores WHERE nome = 'Corte'), true, 'Especialista em corte a laser'),
  ('Patrícia Nunes', 'OP-010', 'Soldador', (SELECT id FROM setores WHERE nome = 'Solda'), true, 'Certificação em solda TIG'),
  ('Ricardo Lima', 'OP-011', 'Montador', (SELECT id FROM setores WHERE nome = 'Montagem'), true, NULL),
  ('Camila Rocha', 'OP-012', 'Pintor', (SELECT id FROM setores WHERE nome = 'Pintura'), true, 'Especialista em pintura eletrostática'),
  ('Diego Fernandes', 'OP-013', 'Embalador', (SELECT id FROM setores WHERE nome = 'Embalagem'), true, NULL),
  ('Larissa Costa', 'OP-014', 'Cortador', (SELECT id FROM setores WHERE nome = 'Corte'), true, NULL),
  ('Bruno Mendes', 'OP-015', 'Soldador', (SELECT id FROM setores WHERE nome = 'Solda'), true, NULL),
  ('Amanda Vieira', 'OP-016', 'Montador', (SELECT id FROM setores WHERE nome = 'Montagem'), true, NULL),
  ('Thiago Ribeiro', 'OP-017', 'Pintor', (SELECT id FROM setores WHERE nome = 'Pintura'), true, NULL),
  ('Isabela Duarte', 'OP-018', 'Embalador', (SELECT id FROM setores WHERE nome = 'Embalagem'), true, NULL),
  ('Gabriel Torres', 'OP-019', 'Cortador', (SELECT id FROM setores WHERE nome = 'Corte'), false, 'Afastado por licença médica'),
  ('Renata Almeida', 'OP-020', 'Soldador', (SELECT id FROM setores WHERE nome = 'Solda'), true, NULL)
ON CONFLICT DO NOTHING;

-- Inserir mais máquinas
INSERT INTO maquinas (nome, codigo, tipo, setor_id, status, ultima_manutencao, localizacao, data_aquisicao) VALUES
  ('Prensa Hidráulica 200T', 'MQ-007', 'Prensa', (SELECT id FROM setores WHERE nome = 'Corte'), 'operacional', '2025-05-20', 'Corte - Área A', '2022-03-15'),
  ('Robô Soldador KUKA', 'MQ-008', 'Solda Automática', (SELECT id FROM setores WHERE nome = 'Solda'), 'operacional', '2025-06-10', 'Solda - Linha 2', '2023-01-20'),
  ('Esteira Montagem B', 'MQ-009', 'Esteira', (SELECT id FROM setores WHERE nome = 'Montagem'), 'manutencao', '2025-04-01', 'Montagem - Linha B', '2021-08-10'),
  ('Forno de Secagem', 'MQ-010', 'Secagem', (SELECT id FROM setores WHERE nome = 'Pintura'), 'operacional', '2025-05-25', 'Pintura - Área C', '2022-11-05')
ON CONFLICT DO NOTHING;

-- Inserir mais incidentes
INSERT INTO incidentes (setor_id, operario_id, descricao, gravidade, data, resolvido) VALUES
  ((SELECT id FROM setores WHERE nome = 'Corte'), (SELECT id FROM operarios WHERE nome = 'Marcos Souza'), 'Corte profundo no dedo indicador', 'grave', '2025-06-05', true),
  ((SELECT id FROM setores WHERE nome = 'Solda'), (SELECT id FROM operarios WHERE nome = 'Patrícia Nunes'), 'Queimadura térmica no antebraço', 'moderada', '2025-06-08', false),
  ((SELECT id FROM setores WHERE nome = 'Montagem'), (SELECT id FROM operarios WHERE nome = 'Carlos Santos'), 'Queda de altura de 1,5m', 'grave', '2025-06-14', false),
  ((SELECT id FROM setores WHERE nome = 'Pintura'), NULL, 'Exposição excessiva a solventes', 'moderada', '2025-06-16', false),
  ((SELECT id FROM setores WHERE nome = 'Embalagem'), (SELECT id FROM operarios WHERE nome = 'Pedro Costa'), 'Entorse no tornozelo', 'leve', '2025-06-17', true),
  ((SELECT id FROM setores WHERE nome = 'Corte'), (SELECT id FROM operarios WHERE nome = 'Fernanda Lima'), 'Corte leve na mão esquerda', 'leve', '2025-06-19', false),
  ((SELECT id FROM setores WHERE nome = 'Solda'), (SELECT id FROM operarios WHERE nome = 'Roberto Alves'), 'Falta de protetor auricular causou zumbido', 'leve', '2025-06-20', false),
  ((SELECT id FROM setores WHERE nome = 'Montagem'), (SELECT id FROM operarios WHERE nome = 'Juliana Martins'), 'Pancada na cabeça (capacete evitou lesão grave)', 'moderada', '2025-06-20', false)
ON CONFLICT DO NOTHING;

-- Atualizar localizacao das máquinas existentes
UPDATE maquinas SET localizacao = 'Corte - Área Principal' WHERE codigo = 'MQ-001';
UPDATE maquinas SET localizacao = 'Corte - Área B' WHERE codigo = 'MQ-002';
UPDATE maquinas SET localizacao = 'Solda - Linha 1' WHERE codigo = 'MQ-003';
UPDATE maquinas SET localizacao = 'Solda - Linha 3' WHERE codigo = 'MQ-004';
UPDATE maquinas SET localizacao = 'Montagem - Linha A' WHERE codigo = 'MQ-005';
UPDATE maquinas SET localizacao = 'Pintura - Área A' WHERE codigo = 'MQ-006';

-- Atualizar data_aquisicao das máquinas existentes
UPDATE maquinas SET data_aquisicao = '2020-05-10' WHERE codigo = 'MQ-001';
UPDATE maquinas SET data_aquisicao = '2019-08-15' WHERE codigo = 'MQ-002';
UPDATE maquinas SET data_aquisicao = '2021-02-20' WHERE codigo = 'MQ-003';
UPDATE maquinas SET data_aquisicao = '2021-06-01' WHERE codigo = 'MQ-004';
UPDATE maquinas SET data_aquisicao = '2020-11-10' WHERE codigo = 'MQ-005';
UPDATE maquinas SET data_aquisicao = '2022-01-15' WHERE codigo = 'MQ-006';
