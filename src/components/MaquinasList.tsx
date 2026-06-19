import { useState } from 'react';
import { Wrench, Search, Filter, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { Maquina, Setor } from '../lib/supabase';

interface MaquinasListProps {
  maquinas: Maquina[];
  setores: Setor[];
}

export default function MaquinasList({ maquinas, setores }: MaquinasListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = maquinas.filter(mq => {
    const matchSearch = mq.nome.toLowerCase().includes(search.toLowerCase()) || 
                        mq.codigo?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? mq.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  function getStatusIcon(status: string) {
    switch (status) {
      case 'operacional': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'manutencao': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'operacional': return 'bg-emerald-100 text-emerald-700';
      case 'manutencao': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-500';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'operacional': return 'Operacional';
      case 'manutencao': return 'Em Manutenção';
      default: return 'Inativo';
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Wrench className="w-5 h-5" />
        Máquinas
      </h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white"
          >
            <option value="">Todos os status</option>
            <option value="operacional">Operacional</option>
            <option value="manutencao">Em Manutenção</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Wrench className="w-12 h-12 mx-auto mb-2" />
            <p>Nenhuma máquina encontrada</p>
          </div>
        )}

        {filtered.map(mq => (
          <div key={mq.id} className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === mq.id ? null : mq.id)}
              className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{mq.nome}</p>
                <p className="text-xs text-slate-500">{mq.codigo} - {mq.tipo}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${getStatusColor(mq.status)}`}>
                {getStatusIcon(mq.status)}
                {getStatusLabel(mq.status)}
              </span>
              {expandedId === mq.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {expandedId === mq.id && (
              <div className="px-3 pb-3 pt-0 bg-slate-50 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Setor</p>
                    <p className="font-medium text-slate-700">{mq.setor?.nome || 'Não atribuído'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Tipo</p>
                    <p className="font-medium text-slate-700">{mq.tipo || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Código</p>
                    <p className="font-medium text-slate-700">{mq.codigo || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Última Manutenção</p>
                    <p className="font-medium text-slate-700">
                      {mq.ultima_manutencao ? new Date(mq.ultima_manutencao).toLocaleDateString('pt-BR') : 'Não registrada'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
