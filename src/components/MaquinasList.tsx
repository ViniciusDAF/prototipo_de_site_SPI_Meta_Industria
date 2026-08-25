import { useState } from 'react';
import { Wrench, Search, Filter, ChevronDown, ChevronUp, Plus, Pencil, Trash2, X, Check, AlertCircle, CheckCircle, Clock, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Maquina, Setor } from '../lib/supabase';

interface MaquinasListProps {
  maquinas: Maquina[];
  setores: Setor[];
  onRefresh: () => void;
}

export default function MaquinasList({ maquinas, setores, onRefresh }: MaquinasListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [setorFilter, setSetorFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    codigo: '',
    tipo: '',
    setor_id: '',
    status: 'operacional',
    ultima_manutencao: '',
    localizacao: '',
    data_aquisicao: '',
  });

  const filtered = maquinas.filter(mq => {
    const matchSearch = mq.nome.toLowerCase().includes(search.toLowerCase()) || 
                        mq.codigo?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? mq.status === statusFilter : true;
    const matchSetor = setorFilter ? mq.setor_id === setorFilter : true;
    return matchSearch && matchStatus && matchSetor;
  });

  function resetForm() {
    setForm({ nome: '', codigo: '', tipo: '', setor_id: '', status: 'operacional', ultima_manutencao: '', localizacao: '', data_aquisicao: '' });
    setEditingId(null);
  }

  function openEdit(mq: Maquina) {
    setForm({
      nome: mq.nome,
      codigo: mq.codigo || '',
      tipo: mq.tipo || '',
      setor_id: mq.setor_id || '',
      status: mq.status,
      ultima_manutencao: mq.ultima_manutencao || '',
      localizacao: mq.localizacao || '',
      data_aquisicao: mq.data_aquisicao || '',
    });
    setEditingId(mq.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.ultima_manutencao) delete (payload as Record<string, unknown>).ultima_manutencao;
      if (!payload.data_aquisicao) delete (payload as Record<string, unknown>).data_aquisicao;

      if (editingId) {
        await supabase.from('maquinas').update(payload).eq('id', editingId);
      } else {
        await supabase.from('maquinas').insert(payload);
      }
      resetForm();
      setShowForm(false);
      onRefresh();
    } catch (err) {
      console.error('Erro ao salvar máquina:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta máquina?')) return;
    try {
      await supabase.from('maquinas').delete().eq('id', id);
      onRefresh();
    } catch (err) {
      console.error('Erro ao excluir máquina:', err);
    }
  }

  async function updateStatus(id: string, novoStatus: string) {
    try {
      await supabase.from('maquinas').update({ status: novoStatus }).eq('id', id);
      onRefresh();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  }

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

  const statusCounts = {
    operacional: maquinas.filter(m => m.status === 'operacional').length,
    manutencao: maquinas.filter(m => m.status === 'manutencao').length,
    inativo: maquinas.filter(m => m.status === 'inativo').length,
  };

  return (
    <div className="space-y-6">
      {/* Header com botão adicionar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Máquinas
        </h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Cards de resumo de status */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
          <p className="text-xs text-emerald-600 font-medium">Operacionais</p>
          <p className="text-2xl font-bold text-emerald-700">{statusCounts.operacional}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
          <p className="text-xs text-amber-600 font-medium">Em Manutenção</p>
          <p className="text-2xl font-bold text-amber-700">{statusCounts.manutencao}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Inativas</p>
          <p className="text-2xl font-bold text-slate-600">{statusCounts.inativo}</p>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">{editingId ? 'Editar Máquina' : 'Nova Máquina'}</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Nome da máquina"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Código</label>
              <input
                type="text"
                value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="MQ-XXX"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo</label>
              <input
                type="text"
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ex: Corte a Laser"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Setor</label>
              <select
                value={form.setor_id}
                onChange={e => setForm(f => ({ ...f, setor_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="">Selecionar setor</option>
                {setores.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="operacional">Operacional</option>
                <option value="manutencao">Em Manutenção</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Localização</label>
              <input
                type="text"
                value={form.localizacao}
                onChange={e => setForm(f => ({ ...f, localizacao: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ex: Corte - Área A"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Última Manutenção</label>
              <input
                type="date"
                value={form.ultima_manutencao}
                onChange={e => setForm(f => ({ ...f, ultima_manutencao: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Data de Aquisição</label>
              <input
                type="date"
                value={form.data_aquisicao}
                onChange={e => setForm(f => ({ ...f, data_aquisicao: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
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
              disabled={saving || !form.nome.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Filtros e lista */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
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

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Wrench className="w-12 h-12 mx-auto mb-2" />
              <p>Nenhuma máquina encontrada</p>
            </div>
          )}

          {filtered.map(mq => (
            <div key={mq.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
                <button
                  onClick={() => setExpandedId(expandedId === mq.id ? null : mq.id)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{mq.nome}</p>
                    <p className="text-xs text-slate-500">{mq.codigo} - {mq.tipo}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${getStatusColor(mq.status)}`}>
                      {getStatusIcon(mq.status)}
                      {getStatusLabel(mq.status)}
                    </span>
                    {expandedId === mq.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {/* Ações rápidas de status */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {mq.status !== 'operacional' && (
                    <button
                      onClick={() => updateStatus(mq.id, 'operacional')}
                      className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors"
                      title="Marcar como operacional"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    </button>
                  )}
                  {mq.status !== 'manutencao' && (
                    <button
                      onClick={() => updateStatus(mq.id, 'manutencao')}
                      className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors"
                      title="Enviar para manutenção"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(mq)}
                    className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(mq.id)}
                    className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>

              {expandedId === mq.id && (
                <div className="px-3 pb-3 pt-0 bg-slate-50 border-t border-slate-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm">
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
                      <p className="text-xs text-slate-400">Localização</p>
                      <p className="font-medium text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {mq.localizacao || 'Não definida'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Última Manutenção</p>
                      <p className="font-medium text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {mq.ultima_manutencao ? new Date(mq.ultima_manutencao).toLocaleDateString('pt-BR') : 'Não registrada'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Aquisição</p>
                      <p className="font-medium text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {mq.data_aquisicao ? new Date(mq.data_aquisicao).toLocaleDateString('pt-BR') : 'Não registrada'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
