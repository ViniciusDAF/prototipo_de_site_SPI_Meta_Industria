import { useState } from 'react';
import { User, Search, Filter, ChevronDown, ChevronUp, Plus, Pencil, Trash2, X, Check, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Operario, Setor, EpiUso, EpiTipo } from '../lib/supabase';

interface OperariosListProps {
  operarios: Operario[];
  setores: Setor[];
  epiUso: EpiUso[];
  epiTipos: EpiTipo[];
  onRefresh: () => void;
}

export default function OperariosList({ operarios, setores, epiUso, epiTipos, onRefresh }: OperariosListProps) {
  const [search, setSearch] = useState('');
  const [setorFilter, setSetorFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    matricula: '',
    cargo: '',
    setor_id: '',
    ativo: true,
    observacoes: '',
  });

  const filtered = operarios.filter(op => {
    const matchSearch = op.nome.toLowerCase().includes(search.toLowerCase()) || 
                        op.matricula?.toLowerCase().includes(search.toLowerCase());
    const matchSetor = setorFilter ? op.setor_id === setorFilter : true;
    const matchStatus = statusFilter ? String(op.ativo) === statusFilter : true;
    return matchSearch && matchSetor && matchStatus;
  });

  function getOperarioEpiStatus(operarioId: string) {
    const operarioEPIs = epiUso.filter(u => u.operario_id === operarioId);
    const total = epiTipos.filter(et => et.obrigatorio).length;
    const usados = operarioEPIs.filter(u => u.usando).length;
    return { total, usados, porcentagem: total > 0 ? Math.round((usados / total) * 100) : 0 };
  }

  function resetForm() {
    setForm({ nome: '', matricula: '', cargo: '', setor_id: '', ativo: true, observacoes: '' });
    setEditingId(null);
  }

  function openEdit(op: Operario) {
    setForm({
      nome: op.nome,
      matricula: op.matricula || '',
      cargo: op.cargo || '',
      setor_id: op.setor_id || '',
      ativo: op.ativo,
      observacoes: op.observacoes || '',
    });
    setEditingId(op.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await supabase.from('operarios').update(form).eq('id', editingId);
      } else {
        await supabase.from('operarios').insert(form);
      }
      resetForm();
      setShowForm(false);
      onRefresh();
    } catch (err) {
      console.error('Erro ao salvar operário:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este operário?')) return;
    try {
      await supabase.from('operarios').delete().eq('id', id);
      onRefresh();
    } catch (err) {
      console.error('Erro ao excluir operário:', err);
    }
  }

  async function toggleAtivo(id: string, atual: boolean) {
    try {
      await supabase.from('operarios').update({ ativo: !atual }).eq('id', id);
      onRefresh();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com botão adicionar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <User className="w-5 h-5" />
          Operários
        </h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">{editingId ? 'Editar Operário' : 'Novo Operário'}</h3>
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
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Matrícula</label>
              <input
                type="text"
                value={form.matricula}
                onChange={e => setForm(f => ({ ...f, matricula: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="OP-XXX"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Cargo</label>
              <input
                type="text"
                value={form.cargo}
                onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ex: Soldador"
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
              <label className="text-xs font-medium text-slate-600 mb-1 block">Observações</label>
              <input
                type="text"
                value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Informações adicionais"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Ativo</span>
              </label>
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

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
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
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white"
            >
              <option value="">Todos os status</option>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
        </div>

        {/* Lista */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <User className="w-12 h-12 mx-auto mb-2" />
              <p>Nenhum operário encontrado</p>
            </div>
          )}

          {filtered.map(op => {
            const epiStatus = getOperarioEpiStatus(op.id);
            return (
              <div key={op.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
                  <button
                    onClick={() => setExpandedId(expandedId === op.id ? null : op.id)}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* EPI status */}
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100">
                        {epiStatus.porcentagem >= 90 ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> :
                         epiStatus.porcentagem >= 70 ? <Shield className="w-3.5 h-3.5 text-amber-500" /> :
                         <ShieldAlert className="w-3.5 h-3.5 text-red-500" />}
                        <span className={`text-xs font-bold ${
                          epiStatus.porcentagem >= 90 ? 'text-emerald-600' :
                          epiStatus.porcentagem >= 70 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {epiStatus.porcentagem}%
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${op.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {op.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      {expandedId === op.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {/* Ações */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleAtivo(op.id, op.ativo)}
                      className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                      title={op.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {op.ativo ? <X className="w-3.5 h-3.5 text-slate-500" /> : <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                    <button
                      onClick={() => openEdit(op)}
                      className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5 text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(op.id)}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>

                {expandedId === op.id && (
                  <div className="px-3 pb-3 pt-0 bg-slate-50 border-t border-slate-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm">
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
                        <p className="text-xs text-slate-400">EPI</p>
                        <p className={`font-medium ${epiStatus.porcentagem >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {epiStatus.usados}/{epiStatus.total} ({epiStatus.porcentagem}%)
                        </p>
                      </div>
                    </div>
                    {op.observacoes && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-400">Observações</p>
                        <p className="text-sm text-slate-600">{op.observacoes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
