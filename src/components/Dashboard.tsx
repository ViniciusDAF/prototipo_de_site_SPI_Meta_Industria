import MapaFabrica from './MapaFabrica';
import StatusCards from './StatusCards';
import EpiMonitor from './EpiMonitor';
import IncidentesPanel from './IncidentesPanel';
import type { Setor, Operario, Maquina, EpiUso, Incidente, EpiTipo } from '../lib/supabase';

interface DashboardProps {
  setores: Setor[];
  operarios: Operario[];
  maquinas: Maquina[];
  epiUso: EpiUso[];
  epiTipos: EpiTipo[];
  incidentes: Incidente[];
  onResolverIncidente: (id: string) => void;
}

export default function Dashboard({
  setores, operarios, maquinas, epiUso, epiTipos, incidentes, onResolverIncidente
}: DashboardProps) {
  return (
    <div className="space-y-6">
      <StatusCards
        setores={setores}
        operarios={operarios}
        maquinas={maquinas}
        epiUso={epiUso}
        incidentes={incidentes}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MapaFabrica
          setores={setores}
          maquinas={maquinas}
          incidentes={incidentes}
          operarios={operarios}
          epiUso={epiUso}
        />
        <EpiMonitor
          operarios={operarios}
          epiUso={epiUso}
          epiTipos={epiTipos}
        />
      </div>

      <IncidentesPanel
        incidentes={incidentes}
        onResolver={onResolverIncidente}
      />
    </div>
  );
}
