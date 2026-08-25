import { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Camera, Play, Square, Check, X, History, User, Timer, ListChecks } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { VerificacaoEpi as VerificacaoEpiType, Operario } from '../lib/supabase';

interface Props {
  operarios: Operario[];
}

export default function VerificacaoEpiPage({ operarios }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [fase, setFase] = useState(1);
  const [status, setStatus] = useState<'DESEQUIPADO' | 'INCOMPLETO' | 'VALIDANDO' | 'EQUIPADO'>('DESEQUIPADO');
  const [selectedOperario, setSelectedOperario] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [epiDetectado, setEpiDetectado] = useState<string[]>([]);
  const [epiFaltando, setEpiFaltando] = useState<string[]>([]);
  const [logs, setLogs] = useState<VerificacaoEpiType[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from('verificacao_epi')
      .select('*, operario:operario_id(*)')
      .order('detectado_em', { ascending: false })
      .limit(20);
    setLogs(data || []);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const simulateDetection = useCallback(() => {
    const rand = Math.random();
    let newStatus: typeof status = 'DESEQUIPADO';
    let newFase = fase;
    let detectados: string[] = [];
    let faltando: string[] = [];

    if (fase === 1) {
      // Fase 1: Máscara
      if (rand < 0.3) {
        newStatus = 'DESEQUIPADO';
        faltando = ['Máscara'];
      } else if (rand < 0.6) {
        newStatus = 'VALIDANDO';
        detectados = ['Máscara'];
        // Simular progresso para fase 2
        if (Math.random() < 0.4) {
          newFase = 2;
          newStatus = 'EQUIPADO';
        }
      } else {
        newStatus = 'EQUIPADO';
        detectados = ['Máscara'];
        newFase = 2;
      }
    } else if (fase === 2) {
      // Fase 2: Luvas
      if (rand < 0.25) {
        newStatus = 'DESEQUIPADO';
        faltando = ['Luvas'];
      } else if (rand < 0.4) {
        newStatus = 'INCOMPLETO';
        detectados = ['Luva Esquerda'];
        faltando = ['Luva Direita'];
      } else if (rand < 0.7) {
        newStatus = 'VALIDANDO';
        detectados = ['Luva Esquerda', 'Luva Direita'];
        if (Math.random() < 0.4) {
          newFase = 3;
          newStatus = 'EQUIPADO';
        }
      } else {
        newStatus = 'EQUIPADO';
        detectados = ['Luva Esquerda', 'Luva Direita'];
        newFase = 3;
      }
    }

    setStatus(newStatus);
    setFase(newFase);
    setEpiDetectado(detectados);
    setEpiFaltando(faltando);

    // Salvar no banco
    if (newStatus !== 'DESEQUIPADO' || faltando.length > 0) {
      supabase.from('verificacao_epi').insert({
        operario_id: selectedOperario || null,
        fase: newFase,
        status: newStatus,
        epi_detectado: detectados,
        epi_faltando: faltando,
        tempo_validacao: newStatus === 'VALIDANDO' ? 5 : null,
      }).then(() => fetchLogs());
    }
  }, [fase, selectedOperario, fetchLogs]);

  const toggleMonitoring = async () => {
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (detectTimerRef.current) clearTimeout(detectTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      setIsRunning(false);
      setFase(1);
      setStatus('DESEQUIPADO');
      setCountdown(0);
      setEpiDetectado([]);
      setEpiFaltando([]);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsRunning(true);
        setFase(1);
        setStatus('DESEQUIPADO');
        setCountdown(3);

        let cd = 3;
        intervalRef.current = setInterval(() => {
          cd -= 1;
          setCountdown(cd);
          if (cd <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setCountdown(0);
            const runDetect = () => {
              simulateDetection();
              detectTimerRef.current = setTimeout(runDetect, 2500 + Math.random() * 2500);
            };
            runDetect();
          }
        }, 1000);
      } catch (err) {
        console.error('Erro ao acessar câmera:', err);
        alert('Não foi possível acessar a câmera. Verifique as permissões.');
      }
    }
  };

  // Desenhar overlay
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!canvasRef.current || !videoRef.current) return;
      canvasRef.current.width = videoRef.current.videoWidth || 640;
      canvasRef.current.height = videoRef.current.videoHeight || 480;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;

      ctx.drawImage(videoRef.current, 0, 0, w, h);

      if (isRunning && countdown === 0) {
        // Caixas de detecção simuladas
        const statusColors: Record<string, string> = {
          DESEQUIPADO: '#ef4444',
          INCOMPLETO: '#f97316',
          VALIDANDO: '#f59e0b',
          EQUIPADO: '#10b981',
        };
        const color = statusColors[status] || '#ef4444';

        // Caixa rosto (máscara)
        ctx.strokeStyle = fase >= 2 ? '#10b981' : color;
        ctx.lineWidth = 3;
        ctx.strokeRect(w * 0.35, h * 0.15, w * 0.3, h * 0.25);
        ctx.fillStyle = fase >= 2 ? 'rgba(16, 185, 129, 0.15)' : `rgba(${color === '#ef4444' ? '239,68,68' : color === '#f59e0b' ? '245,158,11' : '16,185,129'}, 0.15)`;
        ctx.fillRect(w * 0.35, h * 0.15, w * 0.3, h * 0.25);
        ctx.fillStyle = fase >= 2 ? '#10b981' : color;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(fase >= 2 ? 'MASCARA [OK]' : 'MASCARA', w * 0.35 + 8, h * 0.15 + 20);

        // Caixas mãos (luvas)
        if (fase === 2 || status === 'EQUIPADO') {
          const luvaEsq = epiDetectado.includes('Luva Esquerda');
          const luvaDir = epiDetectado.includes('Luva Direita');

          ctx.strokeStyle = luvaEsq ? '#10b981' : '#ef4444';
          ctx.lineWidth = 3;
          ctx.strokeRect(w * 0.15, h * 0.55, w * 0.18, h * 0.18);
          ctx.fillStyle = luvaEsq ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
          ctx.fillRect(w * 0.15, h * 0.55, w * 0.18, h * 0.18);
          ctx.fillStyle = luvaEsq ? '#10b981' : '#ef4444';
          ctx.fillText(luvaEsq ? 'LUVA ESQ [OK]' : 'LUVA ESQ [FALTA]', w * 0.15 + 8, h * 0.55 + 20);

          ctx.strokeStyle = luvaDir ? '#10b981' : '#ef4444';
          ctx.lineWidth = 3;
          ctx.strokeRect(w * 0.67, h * 0.55, w * 0.18, h * 0.18);
          ctx.fillStyle = luvaDir ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
          ctx.fillRect(w * 0.67, h * 0.55, w * 0.18, h * 0.18);
          ctx.fillStyle = luvaDir ? '#10b981' : '#ef4444';
          ctx.fillText(luvaDir ? 'LUVA DIR [OK]' : 'LUVA DIR [FALTA]', w * 0.67 + 8, h * 0.55 + 20);
        }

        // Status principal
        ctx.fillStyle = color;
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText(status, 24, 50);

        // Substatus
        ctx.font = 'bold 18px sans-serif';
        if (status === 'VALIDANDO') {
          ctx.fillText('Aguarde 5 segundos...', 24, 80);
        } else if (status === 'INCOMPLETO') {
          ctx.fillText('Falta 1 mão na câmera', 24, 80);
        } else if (status === 'DESEQUIPADO') {
          ctx.fillText(`Faltando: ${fase === 1 ? 'Máscara' : 'Luvas'}`, 24, 80);
        }

        // Checklist
        if (fase >= 2) {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('[OK] MASCARA', 24, h - 60);
        }
        if (fase === 3) {
          ctx.fillStyle = '#10b981';
          ctx.fillText('[OK] LUVAS', 24, h - 30);
        }
      }

      requestAnimationFrame(draw);
    };

    draw();
  }, [isRunning, status, fase, countdown, epiDetectado]);

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'EQUIPADO': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'VALIDANDO': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'INCOMPLETO': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-red-100 text-red-700 border-red-300';
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'EQUIPADO': return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
      case 'VALIDANDO': return <Timer className="w-5 h-5 text-amber-500" />;
      case 'INCOMPLETO': return <ShieldAlert className="w-5 h-5 text-orange-500" />;
      default: return <ShieldAlert className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Verificação de EPI por Câmera
        </h2>
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
        >
          <History className="w-4 h-4" />
          {showLogs ? 'Ocultar Histórico' : 'Ver Histórico'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Área da câmera */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-lg p-4">
            {/* Seletor operário */}
            <div className="mb-4">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Operário</label>
              <select
                value={selectedOperario}
                onChange={e => setSelectedOperario(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                disabled={isRunning}
              >
                <option value="">Selecionar operário</option>
                {operarios.filter(o => o.ativo).map(o => (
                  <option key={o.id} value={o.id}>{o.nome} - {o.matricula}</option>
                ))}
              </select>
            </div>

            {/* Preview */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900" style={{ aspectRatio: '4/3' }}>
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-0" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

              {!isRunning && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                  <div className="text-center text-white">
                    <Camera className="w-12 h-12 mx-auto mb-3 opacity-60" />
                    <p className="text-lg font-medium">Câmera desligada</p>
                    <p className="text-sm opacity-60 mt-1">Clique em Iniciar para verificar EPI</p>
                  </div>
                </div>
              )}

              {isRunning && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
                  <div className="text-center text-white">
                    <p className="text-6xl font-bold">{countdown}</p>
                    <p className="text-sm opacity-80 mt-2">Iniciando verificação...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controles */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={toggleMonitoring}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  isRunning
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isRunning ? <><Square className="w-4 h-4" /> Parar</> : <><Play className="w-4 h-4" /> Iniciar Verificação</>}
              </button>
            </div>
          </div>

          {/* Fluxo de verificação */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ListChecks className="w-5 h-5" />
              Fluxo de Verificação
            </h3>
            <div className="flex items-center gap-4">
              <div className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                fase === 1 ? 'border-blue-500 bg-blue-50' : fase >= 2 ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold ${
                  fase >= 2 ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
                }`}>
                  {fase >= 2 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <p className="text-sm font-bold text-slate-700">Máscara</p>
                <p className="text-xs text-slate-500 mt-1">Detectar máscara no rosto</p>
              </div>
              <div className="text-slate-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
              <div className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                fase === 2 ? 'border-blue-500 bg-blue-50' : fase >= 3 ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold ${
                  fase >= 3 ? 'bg-emerald-500 text-white' : fase === 2 ? 'bg-blue-500 text-white' : 'bg-slate-300 text-white'
                }`}>
                  {fase >= 3 ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <p className="text-sm font-bold text-slate-700">Luvas</p>
                <p className="text-xs text-slate-500 mt-1">Detectar ambas as luvas</p>
              </div>
              <div className="text-slate-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
              <div className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                fase === 3 ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold ${
                  fase === 3 ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'
                }`}>
                  {fase === 3 ? <Check className="w-4 h-4" /> : '3'}
                </div>
                <p className="text-sm font-bold text-slate-700">Acesso Liberado</p>
                <p className="text-xs text-slate-500 mt-1">EPI completo validado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status atual */}
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <h3 className="font-bold text-slate-800 mb-3">Status Atual</h3>
            <div className={`p-4 rounded-xl border text-center ${getStatusColor(status)}`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                {getStatusIcon(status)}
                <p className="text-lg font-bold">{status}</p>
              </div>
              <p className="text-xs opacity-80">
                {status === 'EQUIPADO' ? 'Acesso liberado' :
                 status === 'VALIDANDO' ? 'Aguarde 5 segundos...' :
                 status === 'INCOMPLETO' ? 'Falta 1 mão na câmera' :
                 `Faltando: ${fase === 1 ? 'Máscara' : 'Luvas'}`}
              </p>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">
                  {selectedOperario ? operarios.find(o => o.id === selectedOperario)?.nome : 'Nenhum operário selecionado'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Fase {fase} de 3</span>
              </div>
            </div>
          </div>

          {/* EPIs detectados/faltando */}
          {isRunning && (
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <h3 className="font-bold text-slate-800 mb-3">Detecção Atual</h3>
              {epiDetectado.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-emerald-600 mb-1">Detectados</p>
                  <div className="flex flex-wrap gap-1.5">
                    {epiDetectado.map((epi, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                        <Check className="w-3 h-3 inline mr-1" />{epi}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {epiFaltando.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-600 mb-1">Faltando</p>
                  <div className="flex flex-wrap gap-1.5">
                    {epiFaltando.map((epi, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                        <X className="w-3 h-3 inline mr-1" />{epi}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {epiDetectado.length === 0 && epiFaltando.length === 0 && (
                <p className="text-sm text-slate-400">Aguardando detecção...</p>
              )}
            </div>
          )}

          {/* Estatísticas */}
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <h3 className="font-bold text-slate-800 mb-3">Estatísticas (Hoje)</h3>
            <div className="space-y-2">
              {['EQUIPADO', 'VALIDANDO', 'INCOMPLETO', 'DESEQUIPADO'].map(s => {
                const count = logs.filter(l => l.status === s && new Date(l.detectado_em).toDateString() === new Date().toDateString()).length;
                const colors: Record<string, string> = {
                  EQUIPADO: 'bg-emerald-500',
                  VALIDANDO: 'bg-amber-500',
                  INCOMPLETO: 'bg-orange-500',
                  DESEQUIPADO: 'bg-red-500',
                };
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[s]}`} />
                    <span className="text-xs text-slate-600 flex-1">{s}</span>
                    <span className="text-sm font-bold text-slate-800">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Histórico */}
      {showLogs && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-slate-800 mb-3">Histórico de Verificações</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Data/Hora</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Operário</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Fase</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Detectados</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Faltando</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-700">{new Date(log.detectado_em).toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-3 text-slate-700">{log.operario?.nome || '-'}</td>
                    <td className="py-2 px-3 text-slate-700">{log.fase}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{log.epi_detectado?.join(', ') || '-'}</td>
                    <td className="py-2 px-3 text-slate-600">{log.epi_faltando?.join(', ') || '-'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">Nenhum registro encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
