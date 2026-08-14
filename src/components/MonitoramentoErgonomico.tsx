import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, AlertTriangle, CheckCircle, Camera, Pause, Play, Square, User, MapPin, History } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { MonitoramentoErgonomico as MonitoramentoType, Operario, Setor } from '../lib/supabase';

interface Props {
  operarios: Operario[];
  setores: Setor[];
}

export default function MonitoramentoErgonomicoPage({ operarios, setores }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<'POSTURA_OK' | 'POSTURA_INADEQUADA' | 'MAO_ZONA_CRITICA' | 'RISCO_IMEDIATO'>('POSTURA_OK');
  const [detalhes, setDetalhes] = useState('');
  const [selectedOperario, setSelectedOperario] = useState('');
  const [selectedSetor, setSelectedSetor] = useState('');
  const [logs, setLogs] = useState<MonitoramentoType[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carregar logs
  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from('monitoramento_ergonomico')
      .select('*, operario:operario_id(*), setor:setor_id(*)')
      .order('detectado_em', { ascending: false })
      .limit(20);
    setLogs(data || []);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Simulação de detecção de pose
  const simulateDetection = useCallback(() => {
    const rand = Math.random();
    let newStatus: typeof status = 'POSTURA_OK';
    let newDetalhes = 'Postura adequada detectada';

    if (rand < 0.05) {
      newStatus = 'RISCO_IMEDIATO';
      newDetalhes = 'RISCO IMEDIATO: Rosto próximo à zona crítica da esteira!';
    } else if (rand < 0.15) {
      newStatus = 'MAO_ZONA_CRITICA';
      newDetalhes = 'ALERTA: Mão detectada na zona crítica da esteira';
    } else if (rand < 0.35) {
      newStatus = 'POSTURA_INADEQUADA';
      const falhas = ['Inclinação lateral do tronco', 'Desnível de ombros', 'Postura corcunda'];
      newDetalhes = `POSTURA INADEQUADA: ${falhas[Math.floor(Math.random() * falhas.length)]}`;
    }

    setStatus(newStatus);
    setDetalhes(newDetalhes);

    // Salvar no banco
    if (newStatus !== 'POSTURA_OK') {
      supabase.from('monitoramento_ergonomico').insert({
        operario_id: selectedOperario || null,
        setor_id: selectedSetor || null,
        status_postura: newStatus,
        detalhes: newDetalhes,
      }).then(() => fetchLogs());
    }
  }, [selectedOperario, selectedSetor, fetchLogs]);

  // Iniciar/parar monitoramento
  const toggleMonitoring = async () => {
    if (isRunning) {
      // Parar
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (detectTimerRef.current) clearTimeout(detectTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      setIsRunning(false);
      setStatus('POSTURA_OK');
      setDetalhes('');
      setCountdown(0);
    } else {
      // Iniciar câmera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsRunning(true);
        setCountdown(5);

        // Contagem regressiva
        let cd = 5;
        intervalRef.current = setInterval(() => {
          cd -= 1;
          setCountdown(cd);
          if (cd <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setCountdown(0);
            // Iniciar detecção simulada a cada 2-4s
            const runDetect = () => {
              simulateDetection();
              detectTimerRef.current = setTimeout(runDetect, 2000 + Math.random() * 2000);
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

  // Desenhar overlay no canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!canvasRef.current || !videoRef.current) return;
      canvasRef.current.width = videoRef.current.videoWidth || 640;
      canvasRef.current.height = videoRef.current.videoHeight || 480;

      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      const zonaY1 = Math.floor(h * 0.7);

      // Zona crítica
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, zonaY1, w, h - zonaY1);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.fillRect(0, zonaY1, w, h - zonaY1);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('ZONA CRÍTICA (ESTEIRA)', 12, zonaY1 - 8);

      // Skeleton simulado
      if (isRunning && countdown === 0) {
        const cx = w / 2;
        const cy = h / 2;
        ctx.strokeStyle = status === 'POSTURA_OK' ? '#10b981' : status === 'POSTURA_INADEQUADA' ? '#f59e0b' : '#ef4444';
        ctx.lineWidth = 4;

        // Cabeça
        ctx.beginPath();
        ctx.arc(cx, cy - 80, 20, 0, Math.PI * 2);
        ctx.stroke();

        // Tronco
        ctx.beginPath();
        ctx.moveTo(cx, cy - 60);
        ctx.lineTo(cx, cy + 40);
        ctx.stroke();

        // Braços
        ctx.beginPath();
        ctx.moveTo(cx, cy - 40);
        ctx.lineTo(cx - 50, cy + 10);
        ctx.moveTo(cx, cy - 40);
        ctx.lineTo(cx + 50, cy + 10);
        ctx.stroke();

        // Pernas
        ctx.beginPath();
        ctx.moveTo(cx, cy + 40);
        ctx.lineTo(cx - 30, cy + 120);
        ctx.moveTo(cx, cy + 40);
        ctx.lineTo(cx + 30, cy + 120);
        ctx.stroke();

        // Coluna virtual (se postura inadequada)
        if (status === 'POSTURA_INADEQUADA') {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(cx + (Math.random() > 0.5 ? 15 : -15), cy - 60);
          ctx.lineTo(cx + (Math.random() > 0.5 ? -10 : 10), cy + 40);
          ctx.stroke();
        }
      }

      // Status overlay
      if (isRunning && countdown === 0) {
        const statusColors: Record<string, string> = {
          POSTURA_OK: '#10b981',
          POSTURA_INADEQUADA: '#f59e0b',
          MAO_ZONA_CRITICA: '#f97316',
          RISCO_IMEDIATO: '#ef4444',
        };
        const color = statusColors[status] || '#10b981';
        ctx.fillStyle = color;
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(status.replace(/_/g, ' '), 24, 50);

        if (detalhes) {
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(detalhes, 24, 80);
        }
      }

      requestAnimationFrame(draw);
    };

    draw();
  }, [isRunning, status, detalhes, countdown]);

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'POSTURA_OK': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'POSTURA_INADEQUADA': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'MAO_ZONA_CRITICA': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'RISCO_IMEDIATO': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Monitoramento Ergonômico
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
            {/* Seletores */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1">
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
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-600 mb-1 block">Setor</label>
                <select
                  value={selectedSetor}
                  onChange={e => setSelectedSetor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  disabled={isRunning}
                >
                  <option value="">Selecionar setor</option>
                  {setores.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>
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
                    <p className="text-sm opacity-60 mt-1">Clique em Iniciar para começar o monitoramento</p>
                  </div>
                </div>
              )}

              {isRunning && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
                  <div className="text-center text-white">
                    <p className="text-6xl font-bold">{countdown}</p>
                    <p className="text-sm opacity-80 mt-2">Iniciando detecção...</p>
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
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {isRunning ? <><Square className="w-4 h-4" /> Parar</> : <><Play className="w-4 h-4" /> Iniciar Monitoramento</>}
              </button>
            </div>
          </div>

          {/* Regras */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-slate-800 mb-3">Regras de Detecção</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-700">Postura OK</p>
                  <p className="text-xs text-emerald-600">Coluna alinhada, ombros nivelados, pescoço reto</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-700">Postura Inadequada</p>
                  <p className="text-xs text-amber-600">Inclinação lateral, desnível de ombros ou corcunda</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-orange-700">Mão na Zona Crítica</p>
                  <p className="text-xs text-orange-600">Mãos detectadas na zona crítica da esteira</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700">Risco Imediato</p>
                  <p className="text-xs text-red-600">Rosto detectado na zona crítica da esteira</p>
                </div>
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
              <p className="text-lg font-bold">{status.replace(/_/g, ' ')}</p>
              {detalhes && <p className="text-xs mt-1 opacity-80">{detalhes}</p>}
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">
                  {selectedOperario ? operarios.find(o => o.id === selectedOperario)?.nome : 'Nenhum operário selecionado'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">
                  {selectedSetor ? setores.find(s => s.id === selectedSetor)?.nome : 'Nenhum setor selecionado'}
                </span>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <h3 className="font-bold text-slate-800 mb-3">Estatísticas (Hoje)</h3>
            <div className="space-y-2">
              {['POSTURA_OK', 'POSTURA_INADEQUADA', 'MAO_ZONA_CRITICA', 'RISCO_IMEDIATO'].map(s => {
                const count = logs.filter(l => l.status_postura === s && new Date(l.detectado_em).toDateString() === new Date().toDateString()).length;
                const colors: Record<string, string> = {
                  POSTURA_OK: 'bg-emerald-500',
                  POSTURA_INADEQUADA: 'bg-amber-500',
                  MAO_ZONA_CRITICA: 'bg-orange-500',
                  RISCO_IMEDIATO: 'bg-red-500',
                };
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[s]}`} />
                    <span className="text-xs text-slate-600 flex-1">{s.replace(/_/g, ' ')}</span>
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
          <h3 className="font-bold text-slate-800 mb-3">Histórico de Detecções</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Data/Hora</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Operário</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Setor</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-700">{new Date(log.detectado_em).toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-3 text-slate-700">{log.operario?.nome || '-'}</td>
                    <td className="py-2 px-3 text-slate-700">{log.setor?.nome || '-'}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getStatusColor(log.status_postura)}`}>
                        {log.status_postura.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{log.detalhes || '-'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">Nenhum registro encontrado</td>
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
