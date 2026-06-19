import { useState } from 'react';
import { User, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import type { Operario, Setor } from '../lib/supabase';

interface OperariosListProps {
  operarios: Operario[];
  setores: Setor[];
}

export default function OperariosList({ operarios, setores }: OperariosListProps) {
  const [search, setSearch] = useState('');
  const [setorFilter, setSetorFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = operarios.filter(op => {
    const matchSearch = op.nome.toLowerCase().includes(search.toLowerCase()) || 
                        op.matricula?.toLowerCase().includes(search.toLowerCase());
    const matchSetor = setorFilter ? op.setor_id === setorFilter : true;
    return matchSearch && matchSetor;
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <User className="w-5 h-5" />
        Operários
      </h2>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou matrícula..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={setorFilter}
            onChange={e => setSetorFilter(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white"
          >
            <option value="">Todos os setores</option>
            {setores.map(s => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <User className="w-12 h-12 mx-auto mb-2" />
            <p>Nenhum operário encontrado</p>
          </div>
        )}

        {filtered.map(op => (
          <div key={op.id} className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === op.id ? null : op.id)}
              className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">
                  {op.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{op.nome}</p>
                <p className="text-xs text-slate-500">{op.matricula} - {op.cargo}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${op.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {op.ativo ? 'Ativo' : 'Inativo'}
              </span>
              {expandedId === op.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {expandedId === op.id && (
              <div className="px-3 pb-3 pt-0 bg-slate-50 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Setor</p>
                    <p className="font-medium text-slate-700">{op.setor?.nome || 'Não atribuído'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Cargo</p>
                    <p className="font-medium text-slate-700">{op.cargo || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Matrícula</p>
                    <p className="font-medium text-slate-700">{op.matricula || 'Não informada'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="font-medium text-slate-700">{op.ativo ? 'Ativo' : 'Inativo'}</p>
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
