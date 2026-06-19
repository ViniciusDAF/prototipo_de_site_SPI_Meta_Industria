import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Setor = {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  coordenadas: { x: number; y: number; width: number; height: number } | null;
  created_at: string;
};

export type Operario = {
  id: string;
  nome: string;
  matricula: string | null;
  cargo: string | null;
  setor_id: string | null;
  ativo: boolean;
  foto_url: string | null;
  created_at: string;
  setor?: Setor;
};

export type Maquina = {
  id: string;
  nome: string;
  codigo: string | null;
  tipo: string | null;
  setor_id: string | null;
  status: string;
  ultima_manutencao: string | null;
  created_at: string;
  setor?: Setor;
};

export type EpiTipo = {
  id: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  obrigatorio: boolean;
  created_at: string;
};

export type EpiUso = {
  id: string;
  operario_id: string;
  epi_tipo_id: string;
  usando: boolean;
  data_verificacao: string;
  verificado_por: string | null;
  created_at: string;
  operario?: Operario;
  epi_tipo?: EpiTipo;
};

export type Incidente = {
  id: string;
  setor_id: string | null;
  operario_id: string | null;
  descricao: string;
  gravidade: string;
  data: string;
  resolvido: boolean;
  created_at: string;
  setor?: Setor;
  operario?: Operario;
};
