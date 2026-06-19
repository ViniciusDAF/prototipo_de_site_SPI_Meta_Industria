import { Shield, AlertTriangle, Users, Wrench, TrendingUp, TrendingDown } from 'lucide-react';
import type { Setor, Operario, Maquina, EpiUso, Incidente } from '../lib/supabase';

interface StatusCardsProps {
  setores: Setor[];
  operarios: Operario[];
  maquinas: Maquina[];
  epiUso: EpiUso[];
  incidentes: Incidente[];
}

export default function StatusCards({ setores, operarios, maquinas, epiUso, incidentes }: StatusCardsProps) {
  const totalEpi = operarios.length * 6;
  const usadosEpi = epiUso.filter(u => u.usando).length;
  const taxaEpi = totalEpi > 0 ? Math.round((usadosEpi / totalEpi) * 100) : 0;
  
  const incidentesAtivos = incidentes.filter(i => !i.resolvido).length;
  const maquinasManutencao = maquinas.filter(m => m.status === 'manutencao').length;
  
  // Calcular segurança por setor
  const setorSeguranca = setores.map(setor => {
    const setorOperarios = operarios.filter(o => o.setor_id === setor.id);
    const setorEpiTotal = setorOperarios.length * 6;
    const setorEpiUsados = epiUso.filter(u => 
      setorOperarios.some(o => o.id === u.operario_id) && u.usando
    ).length;
    const taxa = setorEpiTotal > 0 ? Math.round((setorEpiUsados / setorEpiTotal) * 100) : 0;
    const setorIncidentes = incidentes.filter(i => i.setor_id === setor.id && !i.resolvido).length;
    return { ...setor, taxaEpi: taxa, incidentes: setorIncidentes };
  });
  
  const maisSeguro = setorSeguranca.sort((a, b) => b.taxaEpi - a.taxaEpi)[0];
  const menosSeguro = setorSeguranca.sort((a, b) => a.taxaEpi - b.taxaEpi)[0];

  const cards = [
    {
      title: 'Operários Ativos',
      value: operarios.filter(o => o.ativo).length,
      icon: Users,
      color: 'bg-blue-500',
      trend: null,
    },
    {
      title: 'Máquinas Operacionais',
      value: maquinas.filter(m => m.status === 'operacional').length,
      icon: Wrench,
      color: 'bg-emerald-500',
      sub: `${maquinasManutencao} em manutenção`,
      trend: null,
    },
    {
      title: 'Taxa de Uso EPI',
      value: `${taxaEpi}%`,
      icon: Shield,
      color: taxaEpi >= 70 ? 'bg-emerald-500' : taxaEpi >= 50 ? 'bg-amber-500' : 'bg-red-500',
      trend: taxaEpi >= 70 ? 'up' : 'down',
    },
    {
      title: 'Incidentes Ativos',
      value: incidentesAtivos,
      icon: AlertTriangle,
      color: incidentesAtivos === 0 ? 'bg-emerald-500' : 'bg-red-500',
      trend: incidentesAtivos > 0 ? 'down' : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">{card.title}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{card.value}</p>
                {card.sub && (
                  <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
                )}
              </div>
              <div className={`${card.color} p-3 rounded-xl`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            {card.trend && (
              <div className="flex items-center gap-1 mt-3">
                {card.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-xs font-medium ${card.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {card.trend === 'up' ? 'Bom desempenho' : 'Requer atenção'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Setores mais e menos seguros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {maisSeguro && (
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-emerald-800">Setor Mais Seguro</h3>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{maisSeguro.nome}</p>
            <p className="text-emerald-600 text-sm mt-1">
              {maisSeguro.taxaEpi}% de EPI em uso
              {maisSeguro.incidentes > 0 ? ` - ${maisSeguro.incidentes} incidente(s)` : ' - Sem incidentes'}
            </p>
          </div>
        )}
        {menosSeguro && (
          <div className="bg-red-50 rounded-2xl p-5 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-red-800">Setor Menos Seguro</h3>
            </div>
            <p className="text-2xl font-bold text-red-700">{menosSeguro.nome}</p>
            <p className="text-red-600 text-sm mt-1">
              {menosSeguro.taxaEpi}% de EPI em uso
              {menosSeguro.incidentes > 0 ? ` - ${menosSeguro.incidentes} incidente(s) ativo(s)` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
