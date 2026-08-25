import { Shield, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import type { Operario, EpiUso, EpiTipo } from '../lib/supabase';

interface EpiMonitorProps {
  operarios: Operario[];
  epiUso: EpiUso[];
  epiTipos: EpiTipo[];
}

export default function EpiMonitor({ operarios, epiUso, epiTipos }: EpiMonitorProps) {
  function getOperarioEpiStatus(operarioId: string) {
    const operarioEPIs = epiUso.filter(u => u.operario_id === operarioId);
    const total = epiTipos.filter(et => et.obrigatorio).length;
    const usados = operarioEPIs.filter(u => u.usando).length;
    return { total, usados, porcentagem: total > 0 ? Math.round((usados / total) * 100) : 0 };
  }

  function getStatusColor(porcentagem: number) {
    if (porcentagem >= 90) return 'bg-emerald-500';
    if (porcentagem >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  }

  function getStatusIcon(porcentagem: number) {
    if (porcentagem >= 90) return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
    if (porcentagem >= 70) return <Shield className="w-5 h-5 text-amber-500" />;
    return <ShieldAlert className="w-5 h-5 text-red-500" />;
  }

  const operariosAtivos = operarios.filter(o => o.ativo);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5" />
        Monitoramento de EPI
      </h2>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {operariosAtivos.map(operario => {
          const status = getOperarioEpiStatus(operario.id);
          return (
            <div 
              key={operario.id}
              className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800 truncate">{operario.nome}</p>
                  {getStatusIcon(status.porcentagem)}
                </div>
                <p className="text-xs text-slate-500">{operario.cargo} - {operario.setor?.nome || 'Sem setor'}</p>
                
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">{status.usados}/{status.total} EPIs</span>
                    <span className={`font-bold ${status.porcentagem >= 90 ? 'text-emerald-600' : status.porcentagem >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                      {status.porcentagem}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getStatusColor(status.porcentagem)}`}
                      style={{ width: `${status.porcentagem}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo por tipo de EPI */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Uso por Tipo de EPI</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {epiTipos.filter(et => et.obrigatorio).map(tipo => {
            const totalOperarios = operariosAtivos.length;
            const usados = epiUso.filter(u => u.epi_tipo_id === tipo.id && u.usando).length;
            const pct = totalOperarios > 0 ? Math.round((usados / totalOperarios) * 100) : 0;
            
            return (
              <div key={tipo.id} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-600 font-medium truncate">{tipo.nome}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
