/*
# Criar tabelas para logs de monitoramento de segurança

1. New Tables
- `monitoramento_ergonomico` - registros de detecção de postura
  - `id` (uuid, primary key)
  - `operario_id` (uuid, FK para operarios, nullable)
  - `setor_id` (uuid, FK para setores, nullable)
  - `status_postura` (text) - POSTURA_OK, POSTURA_INADEQUADA, MAO_ZONA_CRITICA, RISCO_IMEDIATO
  - `detalhes` (text) - descrição do que foi detectado
  - `imagem_url` (text) - URL da captura
  - `detectado_em` (timestamptz, default now())

- `verificacao_epi` - registros de verificação de EPI por câmera
  - `id` (uuid, primary key)
  - `operario_id` (uuid, FK para operarios, nullable)
  - `fase` (integer) - 1 (máscara), 2 (luvas), 3 (completo)
  - `status` (text) - DESEQUIPADO, INCOMPLETO, VALIDANDO, EQUIPADO
  - `epi_detectado` (text[]) - lista de EPIs detectados
  - `epi_faltando` (text[]) - lista de EPIs faltando
  - `tempo_validacao` (integer) - segundos de validação
  - `detectado_em` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- Single-tenant: allow anon + authenticated full access.
*/

CREATE TABLE IF NOT EXISTS monitoramento_ergonomico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operario_id uuid REFERENCES operarios(id) ON DELETE SET NULL,
  setor_id uuid REFERENCES setores(id) ON DELETE SET NULL,
  status_postura text NOT NULL DEFAULT 'POSTURA_OK',
  detalhes text,
  imagem_url text,
  detectado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verificacao_epi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operario_id uuid REFERENCES operarios(id) ON DELETE SET NULL,
  fase integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'DESEQUIPADO',
  epi_detectado text[] DEFAULT '{}',
  epi_faltando text[] DEFAULT '{}',
  tempo_validacao integer,
  detectado_em timestamptz DEFAULT now()
);

ALTER TABLE monitoramento_ergonomico ENABLE ROW LEVEL SECURITY;
ALTER TABLE verificacao_epi ENABLE ROW LEVEL SECURITY;

-- Policies for monitoramento_ergonomico
DROP POLICY IF EXISTS "anon_select_ergonomico" ON monitoramento_ergonomico;
CREATE POLICY "anon_select_ergonomico" ON monitoramento_ergonomico FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ergonomico" ON monitoramento_ergonomico;
CREATE POLICY "anon_insert_ergonomico" ON monitoramento_ergonomico FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ergonomico" ON monitoramento_ergonomico;
CREATE POLICY "anon_update_ergonomico" ON monitoramento_ergonomico FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ergonomico" ON monitoramento_ergonomico;
CREATE POLICY "anon_delete_ergonomico" ON monitoramento_ergonomico FOR DELETE
  TO anon, authenticated USING (true);

-- Policies for verificacao_epi
DROP POLICY IF EXISTS "anon_select_verificacao_epi" ON verificacao_epi;
CREATE POLICY "anon_select_verificacao_epi" ON verificacao_epi FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_verificacao_epi" ON verificacao_epi;
CREATE POLICY "anon_insert_verificacao_epi" ON verificacao_epi FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_verificacao_epi" ON verificacao_epi;
CREATE POLICY "anon_update_verificacao_epi" ON verificacao_epi FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_verificacao_epi" ON verificacao_epi;
CREATE POLICY "anon_delete_verificacao_epi" ON verificacao_epi FOR DELETE
  TO anon, authenticated USING (true);
