import { AlertTriangle, CheckCircle, Clock, MapPin, User } from 'lucide-react';
import type { Incidente } from '../lib/supabase';

interface IncidentesPanelProps {
  incidentes: Incidente[];
  onResolver: (id: string) => void;
}

export default function IncidentesPanel({ incidentes, onResolver }: IncidentesPanelProps) {
  const ativos = incidentes.filter(i => !i.resolvido);
  const resolvidos = incidentes.filter(i => i.resolvido);

  function getGravidadeColor(gravidade: string) {
    switch (gravidade) {
      case 'grave': return 'bg-red-100 text-red-700 border-red-300';
      case 'moderada': return 'bg-amber-100 text-amber-700 border-amber-300';
      default: return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  }

  function getGravidadeLabel(gravidade: string) {
    switch (gravidade) {
      case 'grave': return 'Grave';
      case 'moderada': return 'Moderada';
      default: return 'Leve';
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Incidentes de Segurança
      </h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-sm font-medium text-slate-600">Ativos ({ativos.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium text-slate-600">Resolvidos ({resolvidos.length})</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
        {ativos.length === 0 && resolvidos.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-2" />
            <p>Nenhum incidente registrado</p>
          </div>
        )}

        {ativos.map(incidente => (
          <div key={incidente.id} className="border border-red-200 rounded-xl p-4 bg-red-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getGravidadeColor(incidente.gravidade)}`}>
                    {getGravidadeLabel(incidente.gravidade)}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(incidente.data).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-slate-800 font-medium">{incidente.descricao}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  {incidente.setor && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {incidente.setor.nome}
                    </span>
                  )}
                  {incidente.operario && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {incidente.operario.nome}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onResolver(incidente.id)}
                className="ml-3 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0"
              >
                Resolver
              </button>
            </div>
          </div>
        ))}

        {resolvidos.map(incidente => (
          <div key={incidente.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 opacity-70">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-100">
                Resolvido
              </span>
            </div>
            <p className="text-sm text-slate-600 line-through">{incidente.descricao}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              {incidente.setor && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {incidente.setor.nome}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
