/*
# Criar schema de fábrica - operários, máquinas, setores, EPI e monitoramento

1. New Tables
- `setores` (sectores da fábrica)
  - `id` (uuid, primary key)
  - `nome` (text, not null) - nome do setor
  - `descricao` (text) - descrição do setor
  - `cor` (text) - cor para o mapa da fábrica
  - `coordenadas` (jsonb) - coordenadas para o mapa SVG
  - `created_at` (timestamptz)

- `operarios` (trabalhadores da fábrica)
  - `id` (uuid, primary key)
  - `nome` (text, not null)
  - `matricula` (text, unique) - número de matrícula
  - `cargo` (text) - função/cargo
  - `setor_id` (uuid, FK para setores)
  - `ativo` (boolean, default true)
  - `foto_url` (text) - URL da foto
  - `created_at` (timestamptz)

- `maquinas` (máquinas/equipamentos)
  - `id` (uuid, primary key)
  - `nome` (text, not null)
  - `codigo` (text, unique) - código da máquina
  - `tipo` (text) - tipo de máquina
  - `setor_id` (uuid, FK para setores)
  - `status` (text, default 'operacional') - operacional, manutencao, inativo
  - `ultima_manutencao` (date)
  - `created_at` (timestamptz)

- `epi_tipos` (tipos de EPI disponíveis)
  - `id` (uuid, primary key)
  - `nome` (text, not null) - ex: Capacete, Luvas, Oculos
  - `descricao` (text)
  - `icone` (text) - nome do ícone lucide
  - `obrigatorio` (boolean, default true)
  - `created_at` (timestamptz)

- `epi_uso` (registro de uso de EPI por operário)
  - `id` (uuid, primary key)
  - `operario_id` (uuid, FK para operarios)
  - `epi_tipo_id` (uuid, FK para epi_tipos)
  - `usando` (boolean, default false)
  - `data_verificacao` (timestamptz, default now())
  - `verificado_por` (text)
  - `created_at` (timestamptz)

- `incidentes` (registro de incidentes de segurança)
  - `id` (uuid, primary key)
  - `setor_id` (uuid, FK para setores)
  - `operario_id` (uuid, FK para operarios, nullable)
  - `descricao` (text, not null)
  - `gravidade` (text) - leve, moderada, grave
  - `data` (timestamptz, default now())
  - `resolvido` (boolean, default false)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on all tables.
- Single-tenant: allow anon + authenticated full access since no auth required.
*/

-- Tabela de setores
CREATE TABLE IF NOT EXISTS setores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cor text DEFAULT '#3b82f6',
  coordenadas jsonb,
  created_at timestamptz DEFAULT now()
);

-- Tabela de operários
CREATE TABLE IF NOT EXISTS operarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  matricula text UNIQUE,
  cargo text,
  setor_id uuid REFERENCES setores(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  foto_url text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de máquinas
CREATE TABLE IF NOT EXISTS maquinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo text UNIQUE,
  tipo text,
  setor_id uuid REFERENCES setores(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'operacional',
  ultima_manutencao date,
  created_at timestamptz DEFAULT now()
);

-- Tabela de tipos de EPI
CREATE TABLE IF NOT EXISTS epi_tipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  icone text,
  obrigatorio boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela de uso de EPI
CREATE TABLE IF NOT EXISTS epi_uso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operario_id uuid NOT NULL REFERENCES operarios(id) ON DELETE CASCADE,
  epi_tipo_id uuid NOT NULL REFERENCES epi_tipos(id) ON DELETE CASCADE,
  usando boolean NOT NULL DEFAULT false,
  data_verificacao timestamptz DEFAULT now(),
  verificado_por text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(operario_id, epi_tipo_id)
);

-- Tabela de incidentes
CREATE TABLE IF NOT EXISTS incidentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setor_id uuid REFERENCES setores(id) ON DELETE SET NULL,
  operario_id uuid REFERENCES operarios(id) ON DELETE SET NULL,
  descricao text NOT NULL,
  gravidade text NOT NULL DEFAULT 'leve',
  data timestamptz DEFAULT now(),
  resolvido boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE operarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE maquinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE epi_tipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE epi_uso ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidentes ENABLE ROW LEVEL SECURITY;

-- Policies for setores
DROP POLICY IF EXISTS "anon_select_setores" ON setores;
CREATE POLICY "anon_select_setores" ON setores FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_setores" ON setores;
CREATE POLICY "anon_insert_setores" ON setores FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_setores" ON setores;
CREATE POLICY "anon_update_setores" ON setores FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_setores" ON setores;
CREATE POLICY "anon_delete_setores" ON setores FOR DELETE
  TO anon, authenticated USING (true);

-- Policies for operarios
DROP POLICY IF EXISTS "anon_select_operarios" ON operarios;
CREATE POLICY "anon_select_operarios" ON operarios FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_operarios" ON operarios;
CREATE POLICY "anon_insert_operarios" ON operarios FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_operarios" ON operarios;
CREATE POLICY "anon_update_operarios" ON operarios FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_operarios" ON operarios;
CREATE POLICY "anon_delete_operarios" ON operarios FOR DELETE
  TO anon, authenticated USING (true);

-- Policies for maquinas
DROP POLICY IF EXISTS "anon_select_maquinas" ON maquinas;
CREATE POLICY "anon_select_maquinas" ON maquinas FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_maquinas" ON maquinas;
CREATE POLICY "anon_insert_maquinas" ON maquinas FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_maquinas" ON maquinas;
CREATE POLICY "anon_update_maquinas" ON maquinas FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_maquinas" ON maquinas;
CREATE POLICY "anon_delete_maquinas" ON maquinas FOR DELETE
  TO anon, authenticated USING (true);

-- Policies for epi_tipos
DROP POLICY IF EXISTS "anon_select_epi_tipos" ON epi_tipos;
CREATE POLICY "anon_select_epi_tipos" ON epi_tipos FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_epi_tipos" ON epi_tipos;
CREATE POLICY "anon_insert_epi_tipos" ON epi_tipos FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_epi_tipos" ON epi_tipos;
CREATE POLICY "anon_update_epi_tipos" ON epi_tipos FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_epi_tipos" ON epi_tipos;
CREATE POLICY "anon_delete_epi_tipos" ON epi_tipos FOR DELETE
  TO anon, authenticated USING (true);

-- Policies for epi_uso
DROP POLICY IF EXISTS "anon_select_epi_uso" ON epi_uso;
CREATE POLICY "anon_select_epi_uso" ON epi_uso FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_epi_uso" ON epi_uso;
CREATE POLICY "anon_insert_epi_uso" ON epi_uso FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_epi_uso" ON epi_uso;
CREATE POLICY "anon_update_epi_uso" ON epi_uso FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_epi_uso" ON epi_uso;
CREATE POLICY "anon_delete_epi_uso" ON epi_uso FOR DELETE
  TO anon, authenticated USING (true);

-- Policies for incidentes
DROP POLICY IF EXISTS "anon_select_incidentes" ON incidentes;
CREATE POLICY "anon_select_incidentes" ON incidentes FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_incidentes" ON incidentes;
CREATE POLICY "anon_insert_incidentes" ON incidentes FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_incidentes" ON incidentes;
CREATE POLICY "anon_update_incidentes" ON incidentes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_incidentes" ON incidentes;
CREATE POLICY "anon_delete_incidentes" ON incidentes FOR DELETE
  TO anon, authenticated USING (true);
