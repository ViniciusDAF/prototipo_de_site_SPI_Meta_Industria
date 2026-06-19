import { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, MapPin, User, Plus, X, Check, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Incidente, Setor, Operario } from '../lib/supabase';

interface IncidentesPanelProps {
  incidentes: Incidente[];
  setores: Setor[];
  operarios: Operario[];
  onRefresh: () => void;
}

export default function IncidentesPanel({ incidentes, setores, operarios, onRefresh }: IncidentesPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gravidadeFilter, setGravidadeFilter] = useState<string>('');
  const [form, setForm] = useState({
    setor_id: '',
    operario_id: '',
    descricao: '',
    gravidade: 'leve',
  });

  const ativos = incidentes.filter(i => !i.resolvido && (!gravidadeFilter || i.gravidade === gravidadeFilter));
  const resolvidos = incidentes.filter(i => i.resolvido && (!gravidadeFilter || i.gravidade === gravidadeFilter));

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

  async function handleSave() {
    if (!form.descricao.trim()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        descricao: form.descricao,
        gravidade: form.gravidade,
      };
      if (form.setor_id) payload.setor_id = form.setor_id;
      if (form.operario_id) payload.operario_id = form.operario_id;

      await supabase.from('incidentes').insert(payload);
      setForm({ setor_id: '', operario_id: '', descricao: '', gravidade: 'leve' });
      setShowForm(false);
      onRefresh();
    } catch (err) {
      console.error('Erro ao registrar incidente:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleResolver(id: string) {
    try {
      await supabase.from('incidentes').update({ resolvido: true }).eq('id', id);
      onRefresh();
    } catch (err) {
      console.error('Erro ao resolver incidente:', err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Incidentes de Segurança
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar Incidente
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Novo Incidente</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Setor</label>
              <select
                value={form.setor_id}
                onChange={e => setForm(f => ({ ...f, setor_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
              >
                <option value="">Selecionar setor</option>
                {setores.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Operário (opcional)</label>
              <select
                value={form.operario_id}
                onChange={e => setForm(f => ({ ...f, operario_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
              >
                <option value="">Selecionar operário</option>
                {operarios.filter(o => o.ativo).map(o => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Descrição *</label>
              <textarea
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
                rows={3}
                placeholder="Descreva o incidente..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Gravidade</label>
              <select
                value={form.gravidade}
                onChange={e => setForm(f => ({ ...f, gravidade: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
              >
                <option value="leve">Leve</option>
                <option value="moderada">Moderada</option>
                <option value="grave">Grave</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.descricao.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-slate-600">Ativos ({ativos.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-slate-600">Resolvidos ({resolvidos.length})</span>
          </div>
          <div className="ml-auto relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              value={gravidadeFilter}
              onChange={e => setGravidadeFilter(e.target.value)}
              className="pl-8 pr-6 py-1.5 rounded-lg border border-slate-200 text-sm appearance-none bg-white"
            >
              <option value="">Todas as gravidades</option>
              <option value="leve">Leve</option>
              <option value="moderada">Moderada</option>
              <option value="grave">Grave</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
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
                  onClick={() => handleResolver(incidente.id)}
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
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getGravidadeColor(incidente.gravidade)}`}>
                  {getGravidadeLabel(incidente.gravidade)}
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
    </div>
  );
}
