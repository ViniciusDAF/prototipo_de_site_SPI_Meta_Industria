import { useState } from 'react';
import { AlertTriangle, CheckCircle, Users, Wrench, X, MapPin } from 'lucide-react';
import type { Setor, Maquina, Incidente, Operario } from '../lib/supabase';

interface MapaFabricaProps {
  setores: Setor[];
  maquinas: Maquina[];
  incidentes: Incidente[];
  operarios: Operario[];
  epiUso: { operario_id: string; usando: boolean; epi_tipo_id: string }[];
}

export default function MapaFabrica({ setores, maquinas, incidentes, operarios, epiUso }: MapaFabricaProps) {
  const [hoveredSetor, setHoveredSetor] = useState<string | null>(null);
  const [selectedSetor, setSelectedSetor] = useState<string | null>(null);

  function getSetorStats(setorId: string) {
    const setorOperarios = operarios.filter(o => o.setor_id === setorId);
    const setorMaquinas = maquinas.filter(m => m.setor_id === setorId);
    const setorIncidentes = incidentes.filter(i => i.setor_id === setorId && !i.resolvido);
    
    const totalEpi = setorOperarios.length * 6;
    const usadosEpi = epiUso.filter(u => 
      setorOperarios.some(o => o.id === u.operario_id) && u.usando
    ).length;
    const taxaEpi = totalEpi > 0 ? Math.round((usadosEpi / totalEpi) * 100) : 0;

    return { setorOperarios, setorMaquinas, setorIncidentes, taxaEpi };
  }

  function getSetorColor(setorId: string) {
    const stats = getSetorStats(setorId);
    const setor = setores.find(s => s.id === setorId);
    if (!setor) return '#94a3b8';
    
    if (stats.setorIncidentes.length > 0) return '#ef4444';
    if (stats.taxaEpi < 70) return '#f59e0b';
    return setor.cor || '#10b981';
  }

  function getSetorStatus(setorId: string) {
    const stats = getSetorStats(setorId);
    if (stats.setorIncidentes.length > 0) return 'crítico';
    if (stats.taxaEpi < 70) return 'atenção';
    return 'seguro';
  }

  const selectedSetorData = selectedSetor ? setores.find(s => s.id === selectedSetor) : null;
  const selectedStats = selectedSetor ? getSetorStats(selectedSetor) : null;
  const selectedMaquinas = selectedSetor ? maquinas.filter(m => m.setor_id === selectedSetor) : [];
  const selectedIncidentes = selectedSetor ? incidentes.filter(i => i.setor_id === selectedSetor && !i.resolvido) : [];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        Mapa da Fábrica
      </h2>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* SVG Mapa */}
        <div className="relative bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 w-full lg:w-[520px]" style={{ aspectRatio: '520/420' }}>
          <svg viewBox="0 0 520 420" className="w-full h-full block">
            {/* Piso externo */}
            <rect x="0" y="0" width="520" height="420" fill="#f1f5f9" />
            
            {/* Parede externa */}
            <rect x="5" y="5" width="510" height="410" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" rx="4" />
            
            {/* Corredores horizontais */}
            <rect x="5" y="135" width="510" height="18" fill="#e2e8f0" />
            <rect x="5" y="275" width="510" height="18" fill="#e2e8f0" />
            
            {/* Corredor vertical */}
            <rect x="255" y="5" width="18" height="410" fill="#e2e8f0" />
            
            {/* Entradas */}
            <rect x="240" y="412" width="48" height="8" fill="#94a3b8" rx="2" />
            <text x="264" y="408" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="500">ENTRADA PRINCIPAL</text>
            
            {/* Setores */}
            {setores.map(setor => {
              const coords = setor.coordenadas || { x: 0, y: 0, width: 100, height: 100 };
              const isHovered = hoveredSetor === setor.id;
              const isSelected = selectedSetor === setor.id;
              const color = getSetorColor(setor.id);
              const status = getSetorStatus(setor.id);
              
              return (
                <g 
                  key={setor.id}
                  onMouseEnter={() => setHoveredSetor(setor.id)}
                  onMouseLeave={() => setHoveredSetor(null)}
                  onClick={() => setSelectedSetor(selectedSetor === setor.id ? null : setor.id)}
                  className="cursor-pointer"
                >
                  {/* Área do setor */}
                  <rect
                    x={coords.x}
                    y={coords.y}
                    width={coords.width}
                    height={coords.height}
                    fill={isSelected ? `${color}40` : isHovered ? `${color}30` : `${color}15`}
                    stroke={isSelected ? color : color}
                    strokeWidth={isSelected ? 4 : 2}
                    rx="10"
                    style={{ transition: 'all 0.25s ease' }}
                  />
                  
                  {/* Nome do setor */}
                  <text
                    x={coords.x + coords.width / 2}
                    y={coords.y + 22}
                    textAnchor="middle"
                    fill={color}
                    fontSize="13"
                    fontWeight="bold"
                  >
                    {setor.nome}
                  </text>
                  
                  {/* Status badge */}
                  <g transform={`translate(${coords.x + coords.width / 2 - 30}, ${coords.y + 32})`}>
                    <rect x="0" y="0" width="60" height="16" rx="8" fill={status === 'crítico' ? '#ef4444' : status === 'atenção' ? '#f59e0b' : '#10b981'} opacity="0.9" />
                    <text x="30" y="12" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
                      {status === 'crítico' ? 'CRÍTICO' : status === 'atenção' ? 'ATENÇÃO' : 'SEGURO'}
                    </text>
                  </g>
                  
                  {/* Máquinas no setor */}
                  {maquinas.filter(m => m.setor_id === setor.id).map((mq, idx) => {
                    const mx = coords.x + 20 + (idx % 2) * (coords.width - 40);
                    const my = coords.y + 60 + Math.floor(idx / 2) * 28;
                    return (
                      <g key={mq.id} transform={`translate(${mx}, ${my})`}>
                        <rect x="0" y="0" width="16" height="16" rx="3" fill={mq.status === 'operacional' ? '#10b981' : mq.status === 'manutencao' ? '#f59e0b' : '#94a3b8'} stroke="white" strokeWidth="1" />
                        <text x="20" y="12" fill="#475569" fontSize="8">{mq.codigo}</text>
                      </g>
                    );
                  })}
                  
                  {/* Contador de incidentes */}
                  {getSetorStats(setor.id).setorIncidentes.length > 0 && (
                    <g transform={`translate(${coords.x + coords.width - 28}, ${coords.y + 8})`}>
                      <circle cx="10" cy="10" r="10" fill="#ef4444" stroke="white" strokeWidth="2" />
                      <text x="10" y="14" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                        {getSetorStats(setor.id).setorIncidentes.length}
                      </text>
                    </g>
                  )}
                  
                  {/* Contador de operários */}
                  <g transform={`translate(${coords.x + 8}, ${coords.y + coords.height - 22})`}>
                    <circle cx="8" cy="8" r="8" fill="#3b82f6" opacity="0.9" />
                    <text x="8" y="12" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                      {getSetorStats(setor.id).setorOperarios.length}
                    </text>
                    <text x="18" y="12" fill="#64748b" fontSize="8">ops</text>
                  </g>
                </g>
              );
            })}
            
            {/* Legendas de áreas comuns */}
            <text x="10" y="398" fill="#94a3b8" fontSize="9">Almoxarifado</text>
            <text x="460" y="398" fill="#94a3b8" fontSize="9">Vestiário</text>
          </svg>
          
          {/* Tooltip flutuante */}
          {hoveredSetor && !selectedSetor && (
            <div className="absolute top-3 left-3 bg-white rounded-xl shadow-xl p-3 border border-slate-200 z-10 min-w-[180px]">
              {(() => {
                const setor = setores.find(s => s.id === hoveredSetor);
                if (!setor) return null;
                const stats = getSetorStats(setor.id);
                return (
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{setor.nome}</h3>
                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-blue-500" />
                        <span>{stats.setorOperarios.length} operários</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-3 h-3 text-slate-500" />
                        <span>{stats.setorMaquinas.length} máquinas</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {stats.taxaEpi >= 70 ? (
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                        )}
                        <span>{stats.taxaEpi}% EPI</span>
                      </div>
                      {stats.setorIncidentes.length > 0 && (
                        <div className="flex items-center gap-1.5 text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{stats.setorIncidentes.length} incidente(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        
        {/* Painel de detalhes do setor selecionado */}
        <div className="flex-1 min-w-0">
          {selectedSetorData && selectedStats ? (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: getSetorColor(selectedSetorData.id) }}
                  />
                  <h3 className="text-lg font-bold text-slate-800">{selectedSetorData.nome}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    getSetorStatus(selectedSetorData.id) === 'crítico' ? 'bg-red-100 text-red-700' :
                    getSetorStatus(selectedSetorData.id) === 'atenção' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {getSetorStatus(selectedSetorData.id).toUpperCase()}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedSetor(null)}
                  className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              
              <p className="text-sm text-slate-600 mb-4">{selectedSetorData.descricao || 'Sem descrição'}</p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500">Operários</p>
                  <p className="text-xl font-bold text-slate-800">{selectedStats.setorOperarios.length}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500">Máquinas</p>
                  <p className="text-xl font-bold text-slate-800">{selectedStats.setorMaquinas.length}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500">EPI</p>
                  <p className={`text-xl font-bold ${selectedStats.taxaEpi >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedStats.taxaEpi}%
                  </p>
                </div>
              </div>
              
              {/* Máquinas */}
              {selectedMaquinas.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    Máquinas ({selectedMaquinas.length})
                  </h4>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                    {selectedMaquinas.map(mq => (
                      <div key={mq.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-200 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${mq.status === 'operacional' ? 'bg-emerald-500' : mq.status === 'manutencao' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                          <span className="font-medium text-slate-700">{mq.nome}</span>
                          <span className="text-xs text-slate-400">{mq.codigo}</span>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          mq.status === 'operacional' ? 'bg-emerald-100 text-emerald-700' :
                          mq.status === 'manutencao' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {mq.status === 'operacional' ? 'OK' : mq.status === 'manutencao' ? 'Manut.' : 'Inativo'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Incidentes ativos */}
              {selectedIncidentes.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5 text-red-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Incidentes Ativos ({selectedIncidentes.length})
                  </h4>
                  <div className="space-y-1.5 max-h-[100px] overflow-y-auto">
                    {selectedIncidentes.map(inc => (
                      <div key={inc.id} className="bg-red-50 rounded-lg px-3 py-2 border border-red-200 text-sm">
                        <p className="text-slate-700 text-xs">{inc.descricao}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            inc.gravidade === 'grave' ? 'bg-red-200 text-red-800' :
                            inc.gravidade === 'moderada' ? 'bg-amber-200 text-amber-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {inc.gravidade}
                          </span>
                          {inc.operario && (
                            <span className="text-[10px] text-slate-500">{inc.operario.nome}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedIncidentes.length === 0 && selectedMaquinas.length === 0 && (
                <div className="text-center py-6 text-slate-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm">Setor sem máquinas ou incidentes registrados</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-8 h-full flex items-center justify-center">
              <div className="text-center text-slate-400">
                <MapPin className="w-10 h-10 mx-auto mb-3" />
                <p className="text-sm font-medium">Clique em um setor do mapa para ver detalhes</p>
                <p className="text-xs mt-1">Operários, máquinas, EPI e incidentes</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Legenda */}
      <div className="flex flex-wrap gap-4 mt-4 text-sm pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-600 text-xs">Seguro (EPI &gt; 70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-slate-600 text-xs">Atenção (EPI &lt; 70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-600 text-xs">Crítico (Incidentes)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500 border border-white" />
          <span className="text-slate-600 text-xs">Máquina OK</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-500 border border-white" />
          <span className="text-slate-600 text-xs">Máquina Manut.</span>
        </div>
      </div>
    </div>
  );
}
