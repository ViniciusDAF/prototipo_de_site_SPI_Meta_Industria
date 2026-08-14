/*
# Seed dados iniciais da fábrica

Popula as tabelas com dados de exemplo para demonstração:
- 5 setores da fábrica
- 8 operários
- 6 máquinas
- 6 tipos de EPI
- Registros de uso de EPI
- Alguns incidentes
*/

-- Inserir setores
INSERT INTO setores (nome, descricao, cor, coordenadas) VALUES
  ('Corte', 'Setor de corte de materiais', '#ef4444', '{"x": 10, "y": 10, "width": 180, "height": 120}'),
  ('Solda', 'Setor de soldagem', '#f59e0b', '{"x": 210, "y": 10, "width": 180, "height": 120}'),
  ('Montagem', 'Setor de montagem final', '#10b981', '{"x": 10, "y": 150, "width": 180, "height": 120}'),
  ('Pintura', 'Setor de pintura e acabamento', '#3b82f6', '{"x": 210, "y": 150, "width": 180, "height": 120}'),
  ('Embalagem', 'Setor de embalagem e expedição', '#8b5cf6', '{"x": 110, "y": 290, "width": 180, "height": 100}')
ON CONFLICT DO NOTHING;

-- Inserir tipos de EPI
INSERT INTO epi_tipos (nome, descricao, icone, obrigatorio) VALUES
  ('Capacete de Segurança', 'Proteção contra impactos na cabeça', 'HardHat', true),
  ('Óculos de Proteção', 'Proteção ocular contra respingos', 'Glasses', true),
  ('Luvas de Proteção', 'Proteção das mãos contra cortes e queimaduras', 'Hand', true),
  ('Protetor Auricular', 'Proteção contra ruído excessivo', 'Ear', true),
  ('Máscara de Proteção', 'Proteção respiratória contra poeira e vapores', 'Shield', true),
  ('Botas de Segurança', 'Proteção dos pés contra impactos', 'Footprints', true)
ON CONFLICT DO NOTHING;

-- Inserir operários
INSERT INTO operarios (nome, matricula, cargo, setor_id, ativo) VALUES
  ('João Silva', 'OP-001', 'Cortador', (SELECT id FROM setores WHERE nome = 'Corte'), true),
  ('Maria Oliveira', 'OP-002', 'Soldador', (SELECT id FROM setores WHERE nome = 'Solda'), true),
  ('Carlos Santos', 'OP-003', 'Montador', (SELECT id FROM setores WHERE nome = 'Montagem'), true),
  ('Ana Pereira', 'OP-004', 'Pintor', (SELECT id FROM setores WHERE nome = 'Pintura'), true),
  ('Pedro Costa', 'OP-005', 'Embalador', (SELECT id FROM setores WHERE nome = 'Embalagem'), true),
  ('Fernanda Lima', 'OP-006', 'Cortador', (SELECT id FROM setores WHERE nome = 'Corte'), true),
  ('Roberto Alves', 'OP-007', 'Soldador', (SELECT id FROM setores WHERE nome = 'Solda'), true),
  ('Juliana Martins', 'OP-008', 'Montador', (SELECT id FROM setores WHERE nome = 'Montagem'), true)
ON CONFLICT DO NOTHING;

-- Inserir máquinas
INSERT INTO maquinas (nome, codigo, tipo, setor_id, status, ultima_manutencao) VALUES
  ('Corte Laser XL', 'MQ-001', 'Corte a Laser', (SELECT id FROM setores WHERE nome = 'Corte'), 'operacional', '2025-05-15'),
  ('Guilhotina Hidráulica', 'MQ-002', 'Guilhotina', (SELECT id FROM setores WHERE nome = 'Corte'), 'operacional', '2025-04-20'),
  ('MIG 500', 'MQ-003', 'Solda MIG', (SELECT id FROM setores WHERE nome = 'Solda'), 'manutencao', '2025-03-10'),
  ('TIG 300', 'MQ-004', 'Solda TIG', (SELECT id FROM setores WHERE nome = 'Solda'), 'operacional', '2025-06-01'),
  ('Esteira Montagem A', 'MQ-005', 'Esteira', (SELECT id FROM setores WHERE nome = 'Montagem'), 'operacional', '2025-05-01'),
  ('Cabine de Pintura', 'MQ-006', 'Pintura', (SELECT id FROM setores WHERE nome = 'Pintura'), 'operacional', '2025-04-15')
ON CONFLICT DO NOTHING;

-- Inserir registros de EPI (alguns usando, alguns não)
INSERT INTO epi_uso (operario_id, epi_tipo_id, usando, data_verificacao, verificado_por)
SELECT 
  o.id, et.id, 
  CASE 
    WHEN o.nome IN ('João Silva', 'Carlos Santos', 'Ana Pereira', 'Juliana Martins') THEN true
    ELSE false
  END,
  now(),
  'Sistema'
FROM operarios o
CROSS JOIN epi_tipos et
ON CONFLICT (operario_id, epi_tipo_id) DO NOTHING;

-- Inserir incidentes
INSERT INTO incidentes (setor_id, operario_id, descricao, gravidade, data, resolvido) VALUES
  ((SELECT id FROM setores WHERE nome = 'Solda'), (SELECT id FROM operarios WHERE nome = 'Maria Oliveira'), 'Queimadura leve no braço durante soldagem', 'leve', '2025-06-10', true),
  ((SELECT id FROM setores WHERE nome = 'Corte'), (SELECT id FROM operarios WHERE nome = 'João Silva'), 'Corte superficial na mão', 'leve', '2025-06-12', false),
  ((SELECT id FROM setores WHERE nome = 'Pintura'), NULL, 'Vazamento de solvente no piso', 'moderada', '2025-06-15', false),
  ((SELECT id FROM setores WHERE nome = 'Solda'), (SELECT id FROM operarios WHERE nome = 'Roberto Alves'), 'Respingo de solda no olho (sem óculos)', 'grave', '2025-06-18', false)
ON CONFLICT DO NOTHING;
