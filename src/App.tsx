import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import OperariosList from './components/OperariosList';
import MaquinasList from './components/MaquinasList';
import IncidentesPanel from './components/IncidentesPanel';
import EpiMonitor from './components/EpiMonitor';
import MapaFabrica from './components/MapaFabrica';
import { supabase, type Setor, type Operario, type Maquina, type EpiUso, type Incidente, type EpiTipo } from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [operarios, setOperarios] = useState<Operario[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [epiUso, setEpiUso] = useState<EpiUso[]>([]);
  const [epiTipos, setEpiTipos] = useState<EpiTipo[]>([]);
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: setoresData },
        { data: operariosData },
        { data: maquinasData },
        { data: epiUsoData },
        { data: epiTiposData },
        { data: incidentesData },
      ] = await Promise.all([
        supabase.from('setores').select('*').order('nome'),
        supabase.from('operarios').select('*, setor:setor_id(*)').order('nome'),
        supabase.from('maquinas').select('*, setor:setor_id(*)').order('nome'),
        supabase.from('epi_uso').select('*'),
        supabase.from('epi_tipos').select('*').order('nome'),
        supabase.from('incidentes').select('*, setor:setor_id(*), operario:operario_id(*)').order('data', { ascending: false }),
      ]);

      setSetores(setoresData || []);
      setOperarios(operariosData || []);
      setMaquinas(maquinasData || []);
      setEpiUso(epiUsoData || []);
      setEpiTipos(epiTiposData || []);
      setIncidentes(incidentesData || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResolverIncidente = async (id: string) => {
    try {
      const { error } = await supabase
        .from('incidentes')
        .update({ resolvido: true })
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Erro ao resolver incidente:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Carregando dados da fábrica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            setores={setores}
            operarios={operarios}
            maquinas={maquinas}
            epiUso={epiUso}
            epiTipos={epiTipos}
            incidentes={incidentes}
            onResolverIncidente={handleResolverIncidente}
          />
        )}
        
        {activeTab === 'operarios' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <OperariosList operarios={operarios} setores={setores} epiUso={epiUso} epiTipos={epiTipos} onRefresh={fetchData} />
            <EpiMonitor operarios={operarios} epiUso={epiUso} epiTipos={epiTipos} />
          </div>
        )}
        
        {activeTab === 'maquinas' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <MaquinasList maquinas={maquinas} setores={setores} onRefresh={fetchData} />
            <MapaFabrica
              setores={setores}
              maquinas={maquinas}
              incidentes={incidentes}
              operarios={operarios}
              epiUso={epiUso}
            />
          </div>
        )}
        
        {activeTab === 'incidentes' && (
          <IncidentesPanel
            incidentes={incidentes}
            setores={setores}
            operarios={operarios}
            onRefresh={fetchData}
          />
        )}
      </main>
    </div>
  );
}
