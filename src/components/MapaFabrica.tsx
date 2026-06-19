import { useState } from 'react';
import { AlertTriangle, CheckCircle, Users, Wrench } from 'lucide-react';
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

  function getSetorStats(setorId: string) {
    const setorOperarios = operarios.filter(o => o.setor_id === setorId);
    const setorMaquinas = maquinas.filter(m => m.setor_id === setorId);
    const setorIncidentes = incidentes.filter(i => i.setor_id === setorId && !i.resolvido);
    
    const totalEpi = setorOperarios.length * 6; // 6 tipos de EPI
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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Wrench className="w-5 h-5" />
        Mapa da Fábrica
      </h2>
      
      <div className="relative bg-slate-50 rounded-xl overflow-hidden" style={{ width: 420, height: 420 }}>
        <svg viewBox="0 0 420 420" className="w-full h-full">
          {/* Piso */}
          <rect x="0" y="0" width="420" height="420" fill="#f8fafc" />
          
          {/* Corredores */}
          <rect x="0" y="130" width="420" height="20" fill="#e2e8f0" />
          <rect x="200" y="0" width="20" height="420" fill="#e2e8f0" />
          <rect x="0" y="270" width="420" height="20" fill="#e2e8f0" />
          
          {/* Setores */}
          {setores.map(setor => {
            const coords = setor.coordenadas || { x: 0, y: 0, width: 100, height: 100 };
            const isHovered = hoveredSetor === setor.id;
            const color = getSetorColor(setor.id);
            
            return (
              <g 
                key={setor.id}
                onMouseEnter={() => setHoveredSetor(setor.id)}
                onMouseLeave={() => setHoveredSetor(null)}
                className="cursor-pointer"
              >
                <rect
                  x={coords.x}
                  y={coords.y}
                  width={coords.width}
                  height={coords.height}
                  fill={isHovered ? color : `${color}20`}
                  stroke={color}
                  strokeWidth={isHovered ? 3 : 2}
                  rx="8"
                  style={{ transition: 'all 0.2s ease' }}
                />
                <text
                  x={coords.x + coords.width / 2}
                  y={coords.y + coords.height / 2 - 8}
                  textAnchor="middle"
                  fill={color}
                  fontSize="14"
                  fontWeight="bold"
                >
                  {setor.nome}
                </text>
                
                {/* Ícones de status */}
                {getSetorStats(setor.id).setorIncidentes.length > 0 && (
                  <g transform={`translate(${coords.x + coords.width - 24}, ${coords.y + 8})`}>
                    <circle cx="8" cy="8" r="8" fill="#ef4444" />
                    <text x="8" y="12" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      {getSetorStats(setor.id).setorIncidentes.length}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          
          {/* Legendas */}
          <text x="210" y="415" textAnchor="middle" fill="#64748b" fontSize="12">
            Entrada Principal
          </text>
        </svg>
        
        {/* Tooltip */}
        {hoveredSetor && (
          <div className="absolute top-4 right-4 bg-white rounded-xl shadow-xl p-4 border border-slate-200 z-10 min-w-[200px]">
            {(() => {
              const setor = setores.find(s => s.id === hoveredSetor);
              if (!setor) return null;
              const stats = getSetorStats(setor.id);
              return (
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">{setor.nome}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>{stats.setorOperarios.length} operários</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-slate-500" />
                      <span>{stats.setorMaquinas.length} máquinas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stats.taxaEpi >= 70 ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <span>{stats.taxaEpi}% EPI em uso</span>
                    </div>
                    {stats.setorIncidentes.length > 0 && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{stats.setorIncidentes.length} incidente(s) ativo(s)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
      
      {/* Legenda */}
      <div className="flex flex-wrap gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-slate-600">Seguro (EPI &gt; 70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500" />
          <span className="text-slate-600">Atenção (EPI &lt; 70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-slate-600">Crítico (Incidentes)</span>
        </div>
      </div>
    </div>
  );
}
