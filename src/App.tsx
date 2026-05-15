import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  FileText, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Database, 
  Activity, 
  Zap, 
  Menu, 
  X, 
  Sun, 
  Moon,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Globe,
  RefreshCw,
  Download,
  Pencil,
  Users,
  LogOut,
  UserPlus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar
} from 'recharts';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Integration {
  id: number;
  name: string;
  origin: string;
  destination: string;
  port: number;
  protocol: string;
  access_type: string;
  tls_version: string;
  observations: string;
  created_at: string;
}

interface Log {
  id: number;
  integration_id: number;
  integration_name: string;
  ip: string;
  geo: string;
  method: string;
  status: number;
  auth_status: string;
  tls_version: string;
  timestamp: string;
}

interface Stats {
  summary: {
    totalVolume: number;
    errorRate: string;
    authFailures: number;
  };
  methods: { method: string; count: number }[];
  timeline: { hour: string; count: number }[];
}

interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'client';
  created_at?: string;
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-sm font-medium",
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")} />
    <span>{label}</span>
  </button>
);

const Navbar = ({ toggleDarkMode, isDark, toggleSidebar, user, onLogout }: any) => (
  <nav className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
    <div className="flex items-center gap-4">
      <button onClick={toggleSidebar} className="lg:hidden text-zinc-400 p-2 hover:bg-zinc-800 rounded-lg">
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Nexus <span className="text-blue-500">API</span></h1>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button 
        onClick={toggleDarkMode}
        className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white transition-colors"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      <div className="h-8 w-px bg-zinc-800 mx-2" />
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-zinc-200">{user?.name}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{user?.role}</p>
        </div>
        <button 
          onClick={onLogout}
          className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors group"
          title="Sair"
        >
           <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>
      </div>
    </div>
  </nav>
);

const Dashboard = ({ stats, integrations, onFilterChange }: { stats: Stats | null, integrations: Integration[], onFilterChange: (id: number | 'all') => void }) => {
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Executivo</h2>
          <p className="text-zinc-500 text-sm">Resumo operacional e métricas de desempenho.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Filtrar por</label>
          <select 
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500/50 transition-colors min-w-[200px]"
            onChange={(e) => onFilterChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          >
            <option value="all">Todas as Integrações</option>
            {integrations.map(int => (
              <option key={int.id} value={int.id}>{int.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-16 h-16 text-blue-500" />
          </div>
          <p className="text-zinc-500 text-sm font-medium mb-1">Volume Total</p>
          <h3 className="text-3xl font-bold tracking-tight text-white">{stats.summary.totalVolume}</h3>
          <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
             <ChevronRight className="w-3 h-3" /> Logs processados
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
          <p className="text-zinc-500 text-sm font-medium mb-1">Taxa de Erro</p>
          <h3 className="text-3xl font-bold tracking-tight text-white">{stats.summary.errorRate}%</h3>
          <div className={cn("h-1 w-full bg-zinc-800 mt-3 rounded-full overflow-hidden")}>
             <div className="h-full bg-red-500" style={{ width: `${stats.summary.errorRate}%` }} />
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck className="w-16 h-16 text-orange-500" />
          </div>
          <p className="text-zinc-500 text-sm font-medium mb-1">Falhas Auth</p>
          <h3 className="text-3xl font-bold tracking-tight text-white">{stats.summary.authFailures}</h3>
          <p className="text-xs text-zinc-500 mt-2 uppercase tracking-widest font-bold">Tentativas negadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 h-[400px]">
          <h4 className="text-sm font-semibold text-zinc-100 mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" /> Tráfego 24h
          </h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="hour" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 h-[400px]">
          <h4 className="text-sm font-semibold text-zinc-100 mb-6 flex items-center gap-2">
            <Database className="w-4 h-4 text-green-500" /> Métodos HTTP
          </h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.methods}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="method" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const Integrations = ({ integrations, fetchIntegrations, userRole }: { integrations: Integration[], fetchIntegrations: () => void, userRole: string }) => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  
  const isAdmin = userRole === 'admin';
  
  const [formData, setFormData] = useState({
    name: '',
    origin: '',
    destination: '',
    port: 443,
    protocol: 'HTTPS',
    access_type: 'Private',
    tls_version: 'TLS 1.2',
    observations: ''
  });

  useEffect(() => {
    if (editingIntegration) {
      setFormData({
        name: editingIntegration.name,
        origin: editingIntegration.origin,
        destination: editingIntegration.destination,
        port: editingIntegration.port,
        protocol: editingIntegration.protocol,
        access_type: editingIntegration.access_type,
        tls_version: editingIntegration.tls_version || 'TLS 1.2',
        observations: editingIntegration.observations || ''
      });
    } else {
      setFormData({ name: '', origin: '', destination: '', port: 443, protocol: 'HTTPS', access_type: 'Private', tls_version: 'TLS 1.2', observations: '' });
    }
  }, [editingIntegration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIntegration) {
      await axios.put(`/api/integrations/${editingIntegration.id}`, formData);
    } else {
      await axios.post('/api/integrations', formData);
    }
    fetchIntegrations();
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingIntegration(null);
  };

  const handleEdit = (integration: Integration) => {
    setEditingIntegration(integration);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    await axios.delete(`/api/integrations/${id}`);
    fetchIntegrations();
    setShowDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Integrações API</h2>
          <p className="text-zinc-500 text-sm">Gerencie múltiplos fluxos de dados e endpoints.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingIntegration(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" /> Nova Integração
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {integrations.map((int) => (
          <div key={int.id} className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 group hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{int.name}</h3>
                  <p className="text-xs text-zinc-500">Criado em {new Date(int.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(int)}
                    className="p-2 text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(int.id)}
                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Origem</p>
                <p className="text-sm text-zinc-300 font-mono flex items-center gap-2">
                  <Globe className="w-3 h-3 text-zinc-500" /> {int.origin}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Destino</p>
                <p className="text-sm text-zinc-300 font-mono flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-zinc-500" /> {int.destination}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Configurações</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700">{int.protocol}:{int.port}</span>
                  {int.tls_version && (
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-500 border border-zinc-700">{int.tls_version}</span>
                  )}
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] border",
                    int.access_type === 'Public' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  )}>{int.access_type}</span>
                </div>
              </div>
              {int.observations && (
                <div className="col-span-2 mt-2 pt-4 border-t border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Observações</p>
                  <p className="text-xs text-zinc-400 italic line-clamp-2">"{int.observations}"</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {integrations.length === 0 && (
          <div className="col-span-full py-20 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-zinc-500">
            <Database className="w-12 h-12 mb-4 opacity-20" />
            <p>Nenhuma integração cadastrada.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{editingIntegration ? 'Editar Integração' : 'Nova Integração'}</h3>
                <button onClick={closeModal} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nome do Serviço</label>
                  <input 
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                    placeholder="Ex: ERP Sync, Webhook Receiver"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">IP/Host Origem</label>
                    <input 
                      required
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                      value={formData.origin}
                      onChange={e => setFormData({...formData, origin: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">IP/Host Destino</label>
                    <input 
                      required
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                      value={formData.destination}
                      onChange={e => setFormData({...formData, destination: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Porta</label>
                    <input 
                      type="text"
                      required
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                      value={formData.port}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({...formData, port: val === '' ? 0 : parseInt(val)});
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Protocolo</label>
                    <select 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none"
                      value={formData.protocol}
                      onChange={e => setFormData({...formData, protocol: e.target.value})}
                    >
                      <option>HTTPS</option>
                      <option>HTTP</option>
                      <option>gRPC</option>
                      <option>WebSocket</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Acesso</label>
                    <select 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none"
                      value={formData.access_type}
                      onChange={e => setFormData({...formData, access_type: e.target.value})}
                    >
                      <option>Private</option>
                      <option>Public</option>
                      <option>VPN Only</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Inspeção SSL/TLS (quando aplicável)</label>
                  <input 
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                    placeholder="Ex: TLS 1.2, TLS 1.3 ou Inspeção Ativa"
                    value={formData.tls_version}
                    onChange={e => setFormData({...formData, tls_version: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Observações</label>
                  <textarea 
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-600/50 min-h-[80px]"
                    placeholder="Notas adicionais sobre esta integração..."
                    value={formData.observations}
                    onChange={e => setFormData({...formData, observations: e.target.value})}
                  />
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-xl shadow-blue-600/20 mt-4">
                  {editingIntegration ? 'Salvar Alterações' : 'Criar Integração'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Confirmar Exclusão</h3>
              <p className="text-zinc-500 text-sm mb-6">Tem certeza que deseja excluir esta integração? Todos os logs relacionados serão mantidos no histórico, mas a integração deixará de existir.</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors shadow-lg shadow-red-600/20"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LogsTable = ({ logs, integrations, simulateLogs, exportPDF, exportCSV }: { logs: Log[], integrations: Integration[], simulateLogs: () => void, exportPDF: (data: Log[]) => void, exportCSV: (data: Log[]) => void }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterIntegration, setFilterIntegration] = useState<number | 'all'>('all');
  const itemsPerPage = 10;
  
  const filteredLogs = filterIntegration === 'all' 
    ? logs 
    : logs.filter(l => l.integration_id === filterIntegration);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterIntegration]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Logs de Tráfego</h2>
          <p className="text-zinc-500 text-sm">Monitoramento detalhado de cada requisição.</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500/50 transition-colors"
            value={filterIntegration}
            onChange={(e) => setFilterIntegration(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          >
            <option value="all">Todas as Integrações</option>
            {integrations.map(int => (
              <option key={int.id} value={int.id}>{int.name}</option>
            ))}
          </select>
          <div className="h-6 w-px bg-zinc-800 mx-1" />
          <button 
            onClick={simulateLogs}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-xl text-sm font-medium border border-zinc-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Simular Fluxo
          </button>
          <div className="h-6 w-px bg-zinc-800 mx-1" />
          <button 
            onClick={() => exportCSV(filteredLogs)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-xl text-sm font-medium border border-zinc-700 transition-all"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button 
            onClick={() => exportPDF(filteredLogs)}
            className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 px-4 py-2 rounded-xl text-sm font-medium border border-blue-500/20 transition-all"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/30">
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">TS / Service</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Origem / Geo</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Info / TLS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {currentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-xs text-white font-medium">{log.integration_name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-zinc-300 font-mono">{log.ip}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {log.geo}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded",
                      log.method === 'GET' ? "bg-green-500/10 text-green-500" : 
                      log.method === 'POST' ? "bg-blue-500/10 text-blue-500" : 
                      "bg-orange-500/10 text-orange-500"
                    )}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-xs font-bold",
                      log.status < 300 ? "text-green-500" : 
                      log.status < 500 ? "text-orange-500" : "text-red-500"
                    )}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-md border",
                        log.auth_status === 'success' ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        Auth: {log.auth_status}
                      </span>
                      <span className="text-[9px] text-zinc-500">{log.tls_version}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-zinc-500">
                    Nenhum log encontrado. Clique em "Simular Fluxo".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/20">
            <p className="text-xs text-zinc-500">
              Mostrando <span className="text-zinc-300 font-medium">{startIndex + 1}</span> a <span className="text-zinc-300 font-medium">{Math.min(startIndex + itemsPerPage, logs.length)}</span> de <span className="text-zinc-300 font-medium">{logs.length}</span> logs
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                    if (Math.abs(page - currentPage) === 2) return <span key={page} className="text-zinc-600 px-1">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-medium transition-all",
                        currentPage === page 
                          ? "bg-blue-600 text-white" 
                          : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                      )}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'client'
  });

  const fetchUsers = async () => {
    const res = await axios.get('/api/users');
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        password: '',
        name: editingUser.name,
        role: editingUser.role
      });
    } else {
      setFormData({ username: '', password: '', name: '', role: 'client' });
    }
  }, [editingUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, formData);
      } else {
        await axios.post('/api/users', formData);
      }
      fetchUsers();
      setShowModal(false);
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao salvar usuário");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Deseja realmente excluir este usuário?")) {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Gestão de Acesso</h2>
          <p className="text-zinc-500 text-sm">Controle quem pode acessar o dashboard.</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <UserPlus className="w-5 h-5" /> Novo Usuário
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => (
          <div key={u.id} className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-start gap-4">
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-blue-500 font-bold border border-zinc-700">
                {u.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditingUser(u); setShowModal(true); }} className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                {u.username !== 'admin' && (
                  <button onClick={() => handleDelete(u.id)} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{u.name}</h3>
              <p className="text-sm text-zinc-500 italic">@{u.username}</p>
            </div>
            <div className="flex items-center justify-between w-full mt-2">
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest",
                u.role === 'admin' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
              )}>
                {u.role}
              </span>
              <span className="text-[10px] text-zinc-500">{new Date(u.created_at || '').toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">Nome Completo</label>
                  <input required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-600/50" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">Usuário (Login)</label>
                  <input required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-600/50" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} disabled={editingUser?.username === 'admin'} />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">Senha {editingUser && '(deixe em branco para não alterar)'}</label>
                  <input type="password" required={!editingUser} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-600/50" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">Papel (Role)</label>
                  <select className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} disabled={editingUser?.username === 'admin'}>
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-xl shadow-blue-600/20 mt-2">
                  Salvar Usuário
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Login = ({ onLoginSuccess }: { onLoginSuccess: (user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/login', { username, password });
      onLoginSuccess(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Login falhou");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-xl shadow-blue-600/20">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Nexus <span className="text-blue-500">API</span></h1>
          <p className="text-zinc-500 mt-2">Controle Central de Infraestrutura</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Usuário</label>
            <input required className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder-zinc-700 outline-none focus:ring-2 focus:ring-blue-600/50 transition-all border-b-4 border-b-transparent focus:border-b-blue-600" placeholder="Insira seu login" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Senha</label>
            <input type="password" required className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder-zinc-700 outline-none focus:ring-2 focus:ring-blue-600/50 transition-all border-b-4 border-b-transparent focus:border-b-blue-600" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {error && <p className="text-red-500 text-sm text-center font-medium bg-red-500/10 py-2 rounded-lg">{error}</p>}

          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 group">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Acessar Dashboard"}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-600 font-medium">Enterprise Security Protocol v4.2</p>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nexus_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('nexus_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nexus_user');
  };

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<number | 'all'>('all');

  const fetchData = async () => {
    try {
      const [intRes, logRes] = await Promise.all([
        axios.get('/api/integrations'),
        axios.get('/api/logs')
      ]);
      setIntegrations(intRes.data);
      setLogs(logRes.data);
      
      const statsUrl = dashboardFilter === 'all' ? '/api/stats' : `/api/stats?integrationId=${dashboardFilter}`;
      const statRes = await axios.get(statsUrl);
      setStats(statRes.data);
    } catch (e) {
      console.error("Error fetching data", e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling logs
    return () => clearInterval(interval);
  }, [dashboardFilter]);

  const simulateLogs = async () => {
    try {
      await axios.post('/api/simulate');
      fetchData();
    } catch (e) {
      alert("Crie uma integração primeiro!");
    }
  };

  const exportPDF = (dataToExport: Log[]) => {
    const doc = new jsPDF() as any;
    doc.setFontSize(20);
    doc.text('Nexus API - Relatorio de Compliance', 15, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 15, 28);
    
    const tableData = dataToExport.map(l => [
      new Date(l.timestamp).toLocaleString(),
      l.integration_name,
      l.ip,
      l.method,
      l.status,
      l.auth_status,
      l.tls_version
    ]);

    autoTable(doc, {
      head: [['Timestamp', 'Serviço', 'IP', 'Metodo', 'Status', 'Auth', 'TLS']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('compliance-report.pdf');
  };

  const exportCSV = (dataToExport: Log[]) => {
    const csvData = Papa.unparse(dataToExport);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'nexus-logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <div className={cn("min-h-screen font-sans flex flex-col", isDark ? "bg-zinc-950 text-zinc-200" : "bg-zinc-50 text-zinc-900")}>
      <Navbar 
        toggleDarkMode={() => setIsDark(!isDark)} 
        isDark={isDark} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "w-64 border-r border-zinc-900 bg-zinc-950 px-4 py-8 flex flex-col gap-1 transition-all duration-300 fixed lg:static inset-y-0 left-0 z-50",
          !sidebarOpen && "lg:w-20 -translate-x-full lg:translate-x-0"
        )}>
          <div className="mb-6 px-2 flex items-center justify-between">
             <span className={cn("text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]", !sidebarOpen && "hidden")}>Infrastructure</span>
             <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-500"><X className="w-5 h-5" /></button>
          </div>
          
          <SidebarItem 
            icon={LayoutDashboard} 
            label={sidebarOpen ? "Dashboard" : ""} 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Settings} 
            label={sidebarOpen ? "Integrações" : ""} 
            active={activeTab === 'integrations'} 
            onClick={() => setActiveTab('integrations')} 
          />
          <SidebarItem 
            icon={FileText} 
            label={sidebarOpen ? "Logs de Rede" : ""} 
            active={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')} 
          />

          {user.role === 'admin' && (
            <SidebarItem 
              icon={Users} 
              label={sidebarOpen ? "Usuários" : ""} 
              active={activeTab === 'users'} 
              onClick={() => setActiveTab('users')} 
            />
          )}

          <div className="mt-auto border-t border-zinc-900 pt-6 px-2">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {sidebarOpen && <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Node: Active</span>}
             </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 lg:p-12">
          <div className="max-w-7xl mx-auto">
             <AnimatePresence mode="wait">
               <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 10 }}
                 transition={{ duration: 0.2 }}
               >
                  {activeTab === 'dashboard' && (
                    <Dashboard 
                      stats={stats} 
                      integrations={integrations} 
                      onFilterChange={(id) => setDashboardFilter(id)} 
                    />
                  )}
                  {activeTab === 'integrations' && <Integrations integrations={integrations} fetchIntegrations={fetchData} userRole={user.role} />}
                  {activeTab === 'logs' && <LogsTable logs={logs} integrations={integrations} simulateLogs={simulateLogs} exportPDF={exportPDF} exportCSV={exportCSV} />}
                  {activeTab === 'users' && user.role === 'admin' && <UserManagement />}
               </motion.div>
             </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
