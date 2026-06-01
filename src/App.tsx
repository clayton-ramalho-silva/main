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
  UserPlus,
  Key,
  Copy,
  Check
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

const SidebarItem = ({ icon: Icon, label, active, onClick, isDark }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-sm font-medium",
      active 
        ? (isDark 
            ? "bg-zinc-100 text-zinc-950 font-semibold" 
            : "bg-zinc-900 text-white font-semibold") 
        : (isDark 
            ? "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200" 
            : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900")
    )}
  >
    <Icon className={cn("w-5 h-5 transition-colors", 
      active 
        ? (isDark ? "text-zinc-950" : "text-white") 
        : (isDark ? "text-zinc-500 group-hover:text-zinc-300" : "text-zinc-400 group-hover:text-zinc-700")
    )} />
    <span>{label}</span>
  </button>
);

const Navbar = ({ toggleDarkMode, isDark, toggleSidebar, user, onLogout }: any) => (
  <nav className={cn(
    "h-16 border-b sticky top-0 z-40 flex items-center justify-between px-6 backdrop-blur-md transition-colors duration-200",
    isDark ? "border-zinc-950 bg-zinc-950/80 text-white" : "border-zinc-300 bg-white/80 text-zinc-900"
  )}>
    <div className="flex items-center gap-4">
      <button onClick={toggleSidebar} className={cn("lg:hidden p-2 rounded-lg", isDark ? "text-zinc-400 hover:bg-zinc-900" : "text-zinc-600 hover:bg-zinc-150")}>
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex items-center gap-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm", isDark ? "bg-zinc-100 text-zinc-950" : "bg-zinc-900 text-white")}>
          <Zap className="w-4 h-4" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">
          Nexus <span className={isDark ? "text-zinc-400 font-normal" : "text-zinc-500 font-normal"}>API</span>
        </h1>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button 
        onClick={toggleDarkMode}
        className={cn(
          "p-2 rounded-xl border transition-colors",
          isDark 
            ? "border-zinc-900 bg-zinc-900/50 text-zinc-400 hover:text-white" 
            : "border-zinc-300 bg-zinc-50 text-zinc-600 hover:text-black hover:bg-zinc-100"
        )}
      >
        {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
      </button>
      <div className={cn("h-6 w-px mx-1", isDark ? "bg-zinc-900" : "bg-zinc-300")} />
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium">{user?.name}</p>
          <p className={cn("text-[9px] uppercase tracking-wider", isDark ? "text-zinc-500" : "text-zinc-400")}>{user?.role}</p>
        </div>
        <button 
          onClick={onLogout}
          className={cn(
            "w-9 h-9 rounded-xl border flex items-center justify-center transition-all group",
            isDark 
              ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-zinc-700" 
              : "bg-zinc-50 border-zinc-300 text-zinc-500 hover:text-rose-600 hover:border-zinc-400"
          )}
          title="Sair"
        >
           <LogOut className="w-4 h-4 transition-transform group-hover:scale-105" />
        </button>
      </div>
    </div>
  </nav>
);

const Dashboard = ({ stats, integrations, onFilterChange, isDark }: { stats: Stats | null, integrations: Integration[], onFilterChange: (id: number | 'all') => void, isDark: boolean }) => {
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>Dashboard Executivo</h2>
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-600")}>Resumo operacional e métricas de desempenho.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>Filtrar por</label>
          <select 
            className={cn(
              "text-sm rounded-xl px-4 py-2 focus:outline-none transition-colors min-w-[200px] border",
              isDark 
                ? "bg-zinc-900 border-zinc-805 text-zinc-300 focus:border-zinc-700" 
                : "bg-white border-zinc-300 text-zinc-800 focus:border-zinc-400"
            )}
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
        <div className={cn("p-6 rounded-2xl border transition-colors overflow-hidden relative group", isDark ? "bg-zinc-900 border-zinc-850" : "bg-white border-zinc-300 shadow-sm")}>
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Activity className={cn("w-16 h-16", isDark ? "text-white" : "text-zinc-900")} />
          </div>
          <p className={cn("text-sm font-medium mb-1", isDark ? "text-zinc-500" : "text-zinc-500")}>Volume Total</p>
          <h3 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>{stats.summary.totalVolume}</h3>
          <p className={cn("text-xs mt-2 flex items-center gap-1", isDark ? "text-zinc-400" : "text-zinc-650")}>
              <ChevronRight className="w-3 h-3" /> Logs processados
          </p>
        </div>
        <div className={cn("p-6 rounded-2xl border transition-colors overflow-hidden relative group", isDark ? "bg-zinc-900 border-zinc-850" : "bg-white border-zinc-300 shadow-sm")}>
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <AlertTriangle className={cn("w-16 h-16", isDark ? "text-white" : "text-zinc-900")} />
          </div>
          <p className={cn("text-sm font-medium mb-1", isDark ? "text-zinc-500" : "text-zinc-500")}>Taxa de Erro</p>
          <h3 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>{stats.summary.errorRate}%</h3>
          <div className={cn("h-1.5 w-full mt-3 rounded-full overflow-hidden", isDark ? "bg-zinc-800" : "bg-zinc-100")}>
              <div className={cn("h-full rounded-full transition-all duration-300", isDark ? "bg-zinc-400" : "bg-zinc-800")} style={{ width: `${stats.summary.errorRate}%` }} />
          </div>
        </div>
        <div className={cn("p-6 rounded-2xl border transition-colors overflow-hidden relative group", isDark ? "bg-zinc-900 border-zinc-850" : "bg-white border-zinc-300 shadow-sm")}>
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ShieldCheck className={cn("w-16 h-16", isDark ? "text-white" : "text-zinc-900")} />
          </div>
          <p className={cn("text-sm font-medium mb-1", isDark ? "text-zinc-500" : "text-zinc-500")}>Falhas Auth</p>
          <h3 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>{stats.summary.authFailures}</h3>
          <p className={cn("text-xs mt-2 uppercase tracking-widest font-bold", isDark ? "text-zinc-500" : "text-zinc-450")}>Tentativas negadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cn("p-6 rounded-2xl border transition-colors h-[400px]", isDark ? "bg-zinc-900 border-zinc-850" : "bg-white border-zinc-300 shadow-sm")}>
          <h4 className={cn("text-sm font-semibold mb-6 flex items-center gap-2", isDark ? "text-zinc-100" : "text-zinc-800")}>
            <Activity className="w-4 h-4 text-zinc-500" /> Tráfego 24h
          </h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#cbd5e1"} vertical={false} />
                <XAxis dataKey="hour" stroke={isDark ? "#71717a" : "#52525b"} fontSize={11} />
                <YAxis stroke={isDark ? "#71717a" : "#52525b"} fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#18181b' : '#ffffff', 
                    borderColor: isDark ? '#27272a' : '#cbd5e1', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}
                  itemStyle={{ color: isDark ? '#ffffff' : '#000000' }}
                />
                <Line type="monotone" dataKey="count" stroke={isDark ? "#d4d4d8" : "#18181b"} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn("p-6 rounded-2xl border transition-colors h-[400px]", isDark ? "bg-zinc-900 border-zinc-850" : "bg-white border-zinc-300 shadow-sm")}>
          <h4 className={cn("text-sm font-semibold mb-6 flex items-center gap-2", isDark ? "text-zinc-100" : "text-zinc-800")}>
            <Database className="w-4 h-4 text-zinc-500" /> Métodos HTTP
          </h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.methods}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#cbd5e1"} vertical={false} />
                <XAxis dataKey="method" stroke={isDark ? "#71717a" : "#52525b"} fontSize={11} />
                <YAxis stroke={isDark ? "#71717a" : "#52525b"} fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#18181b' : '#ffffff', 
                    borderColor: isDark ? '#27272a' : '#cbd5e1', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}
                  itemStyle={{ color: isDark ? '#ffffff' : '#000500' }}
                />
                <Bar dataKey="count" fill={isDark ? "#a1a1aa" : "#333333"} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const Integrations = ({ integrations, fetchIntegrations, userRole, isDark }: { integrations: Integration[], fetchIntegrations: () => void, userRole: string, isDark: boolean }) => {
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

  const onSubmit = async (e: React.FormEvent) => {
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
          <h2 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>Integrações API</h2>
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-600")}>Gerencie múltiplos fluxos de dados e endpoints.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingIntegration(null);
              setShowModal(true);
            }}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm",
              isDark 
                ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200" 
                : "bg-zinc-900 text-white hover:bg-zinc-800"
            )}
          >
            <Plus className="w-5 h-5" /> Nova Integração
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {integrations.map((int) => (
          <div key={int.id} className={cn("p-6 rounded-2xl border transition-colors group", isDark ? "bg-zinc-900 border-zinc-850 hover:border-zinc-700" : "bg-white border-zinc-300 hover:border-zinc-400 shadow-sm")}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center transition-colors", isDark ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-zinc-100 border-zinc-300 text-zinc-500")}>
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-zinc-900")}>{int.name}</h3>
                  <p className="text-xs text-zinc-500">Criado em {new Date(int.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleEdit(int)}
                    className={cn("p-2 rounded-lg transition-colors", isDark ? "text-zinc-500 hover:text-white hover:bg-zinc-800" : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100")}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(int.id)}
                    className={cn("p-2 rounded-lg transition-colors", isDark ? "text-zinc-500 hover:text-rose-450 hover:bg-rose-500/10" : "text-zinc-500 hover:text-rose-650 hover:bg-rose-50")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className={cn("text-[10px] uppercase tracking-wider font-semibold mb-1", isDark ? "text-zinc-500" : "text-zinc-400")}>Origem</p>
                <p className={cn("text-sm font-mono flex items-center gap-2", isDark ? "text-zinc-300" : "text-zinc-705")}>
                  <Globe className={cn("w-3.5 h-3.5", isDark ? "text-zinc-650" : "text-zinc-400")} /> {int.origin}
                </p>
              </div>
              <div>
                <p className={cn("text-[10px] uppercase tracking-wider font-semibold mb-1", isDark ? "text-zinc-500" : "text-zinc-400")}>Destino</p>
                <p className={cn("text-sm font-mono flex items-center gap-2", isDark ? "text-zinc-300" : "text-zinc-705")}>
                  <ChevronRight className={cn("w-3.5 h-3.5", isDark ? "text-zinc-650" : "text-zinc-400")} /> {int.destination}
                </p>
              </div>
              <div className="col-span-2">
                <p className={cn("text-[10px] uppercase tracking-wider font-semibold mb-1.5", isDark ? "text-zinc-500" : "text-zinc-400")}>Configurações</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] border transition-colors", isDark ? "bg-zinc-800 text-zinc-400 border-zinc-750" : "bg-zinc-100 text-zinc-650 border-zinc-300")}>{int.protocol}:{int.port}</span>
                  {int.tls_version && (
                    <span className={cn("px-2 py-0.5 rounded text-[10px] border transition-colors", isDark ? "bg-zinc-800 text-zinc-400 border-zinc-750" : "bg-zinc-100 text-zinc-650 border-zinc-300")}>{int.tls_version}</span>
                  )}
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] border transition-colors",
                    int.access_type === 'Public' 
                      ? (isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-250") 
                      : (isDark ? "bg-zinc-800 text-zinc-305 border-zinc-700" : "bg-zinc-100 text-zinc-700 border-zinc-300")
                  )}>{int.access_type}</span>
                </div>
              </div>
              {int.observations && (
                <div className={cn("col-span-2 mt-2 pt-4 border-t", isDark ? "border-zinc-850" : "border-zinc-300")}>
                  <p className={cn("text-[10px] uppercase tracking-wider font-semibold mb-1", isDark ? "text-zinc-500" : "text-zinc-400")}>Observações</p>
                  <p className={cn("text-xs italic", isDark ? "text-zinc-450" : "text-zinc-550")}>"{int.observations}"</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {integrations.length === 0 && (
          <div className={cn("col-span-full py-20 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-colors", isDark ? "border-zinc-800 text-zinc-500" : "border-zinc-300 text-zinc-400")}>
            <Database className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Nenhuma integração cadastrada.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn("w-full max-w-lg border rounded-2xl shadow-2xl overflow-hidden transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200")}
            >
              <div className={cn("px-6 py-4 border-b flex items-center justify-between transition-colors", isDark ? "border-zinc-800" : "border-zinc-100")}>
                <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-zinc-900")}>{editingIntegration ? 'Editar Integração' : 'Nova Integração'}</h3>
                <button onClick={closeModal} className={cn("transition-colors", isDark ? "text-zinc-500 hover:text-white" : "text-zinc-400 hover:text-zinc-900")}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={onSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-450">Nome do Serviço</label>
                  <input 
                    required
                    className={cn(
                      "w-full rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all border",
                      isDark 
                        ? "bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-zinc-600 focus:border-zinc-650" 
                        : "bg-zinc-50 border-zinc-205 text-zinc-800 focus:ring-zinc-300 focus:border-zinc-350"
                    )}
                    placeholder="Ex: ERP Sync, Webhook Receiver"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-455">IP/Host Origem</label>
                    <input 
                      required
                      className={cn(
                        "w-full rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all border",
                        isDark 
                          ? "bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-zinc-600 focus:border-zinc-650" 
                          : "bg-zinc-50 border-zinc-205 text-zinc-800 focus:ring-zinc-300 focus:border-zinc-350"
                      )}
                      value={formData.origin}
                      onChange={e => setFormData({...formData, origin: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-455">IP/Host Destino</label>
                    <input 
                      required
                      className={cn(
                        "w-full rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all border",
                        isDark 
                          ? "bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-zinc-600 focus:border-zinc-650" 
                          : "bg-zinc-50 border-zinc-205 text-zinc-800 focus:ring-zinc-300 focus:border-zinc-350"
                      )}
                      value={formData.destination}
                      onChange={e => setFormData({...formData, destination: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-455">Porta</label>
                    <input 
                      type="text"
                      required
                      className={cn(
                        "w-full rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all border",
                        isDark 
                          ? "bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-zinc-600 focus:border-zinc-650" 
                          : "bg-zinc-50 border-zinc-205 text-zinc-800 focus:ring-zinc-300 focus:border-zinc-350"
                      )}
                      value={formData.port}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({...formData, port: val === '' ? 0 : parseInt(val)});
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-450 border-0 h-[17px]">Protocolo</label>
                    <select 
                      className={cn(
                        "w-full rounded-xl px-2 py-2.5 outline-none transition-colors border",
                        isDark ? "bg-zinc-800 border-zinc-700 text-zinc-200" : "bg-zinc-50 border-zinc-200 text-zinc-800"
                      )}
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
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-450 border-0 h-[17px]">Acesso</label>
                    <select 
                      className={cn(
                        "w-full rounded-xl px-2 py-2.5 outline-none transition-colors border",
                        isDark ? "bg-zinc-800 border-zinc-700 text-zinc-200" : "bg-zinc-50 border-zinc-200 text-zinc-800"
                      )}
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
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-450">Inspeção SSL/TLS</label>
                  <input 
                    className={cn(
                      "w-full rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all border",
                      isDark 
                        ? "bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-zinc-600 focus:border-zinc-650" 
                        : "bg-zinc-50 border-zinc-205 text-zinc-800 focus:ring-zinc-300 focus:border-zinc-350"
                    )}
                    placeholder="Ex: TLS 1.2, TLS 1.3 ou Inspeção Ativa"
                    value={formData.tls_version}
                    onChange={e => setFormData({...formData, tls_version: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-450">Observações</label>
                  <textarea 
                    className={cn(
                      "w-full rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all border min-h-[80px]",
                      isDark 
                        ? "bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-zinc-600 focus:border-zinc-650" 
                        : "bg-zinc-50 border-zinc-205 text-zinc-800 focus:ring-zinc-300 focus:border-zinc-350"
                    )}
                    placeholder="Notas adicionais sobre esta integração..."
                    value={formData.observations}
                    onChange={e => setFormData({...formData, observations: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  className={cn(
                    "w-full font-bold py-3 rounded-xl transition-all shadow-sm mt-4",
                    isDark 
                      ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-950" 
                      : "bg-zinc-900 hover:bg-zinc-800 text-white"
                  )}
                >
                  {editingIntegration ? 'Salvar Alterações' : 'Criar Integração'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn("w-full max-w-sm border rounded-2xl shadow-2xl overflow-hidden p-6 text-center transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200")}
            >
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className={cn("text-lg font-bold mb-2", isDark ? "text-white" : "text-zinc-900")}>Confirmar Exclusão</h3>
              <p className={cn("text-sm mb-6", isDark ? "text-zinc-450" : "text-zinc-500")}>Tem certeza que deseja excluir esta integração? Todos os logs relacionados serão mantidos no histórico, mas a integração deixará de existir.</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className={cn("px-4 py-2.5 rounded-xl font-medium transition-colors border", isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200")}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors shadow-sm"
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

const LogsTable = ({ logs, integrations, simulateLogs, exportPDF, exportCSV, isDark }: { logs: Log[], integrations: Integration[], simulateLogs: () => void, exportPDF: (data: Log[]) => void, exportCSV: (data: Log[]) => void, isDark: boolean }) => {
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
          <h2 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>Logs de Tráfego</h2>
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-600")}>Monitoramento detalhado de cada requisição.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select 
            className={cn(
              "text-sm rounded-xl px-4 py-2 focus:outline-none transition-colors border",
              isDark 
                ? "bg-zinc-900 border-zinc-805 text-zinc-300 focus:border-zinc-700" 
                : "bg-white border-zinc-200 text-zinc-800 focus:border-zinc-300"
            )}
            value={filterIntegration}
            onChange={(e) => setFilterIntegration(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          >
            <option value="all">Todas as Integrações</option>
            {integrations.map(int => (
              <option key={int.id} value={int.id}>{int.name}</option>
            ))}
          </select>
          <div className={cn("h-6 w-px mx-1 hidden sm:block", isDark ? "bg-zinc-800" : "bg-zinc-200")} />
          <button 
            onClick={simulateLogs}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
              isDark 
                ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700" 
                : "bg-white border-zinc-205 text-zinc-800 hover:bg-zinc-100 hover:border-zinc-250"
            )}
          >
            <RefreshCw className="w-4 h-4" /> Simular Fluxo
          </button>
          <div className={cn("h-6 w-px mx-1 hidden sm:block", isDark ? "bg-zinc-800" : "bg-zinc-200")} />
          <button 
            onClick={() => exportCSV(filteredLogs)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
              isDark 
                ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700" 
                : "bg-white border-zinc-205 text-zinc-800 hover:bg-zinc-100 hover:border-zinc-250"
            )}
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button 
            onClick={() => exportPDF(filteredLogs)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
              isDark 
                ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200" 
                : "bg-zinc-900 text-white hover:bg-zinc-800"
            )}
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className={cn("overflow-hidden border rounded-2xl transition-colors", isDark ? "bg-zinc-900 border-zinc-850" : "bg-white border-zinc-200 shadow-sm")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={cn("border-b transition-colors", isDark ? "border-zinc-800 bg-zinc-950/20" : "border-zinc-100 bg-zinc-50")}>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">TS / Service</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Origem / Geo</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Info / TLS</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y transition-colors", isDark ? "divide-zinc-800" : "divide-zinc-105")}>
              {currentLogs.map((log) => (
                <tr key={log.id} className={cn("transition-colors", isDark ? "hover:bg-zinc-800/20" : "hover:bg-zinc-50")}>
                  <td className="px-6 py-4">
                    <p className={cn("text-xs font-semibold", isDark ? "text-white" : "text-zinc-900")}>{log.integration_name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className={cn("text-xs font-mono", isDark ? "text-zinc-300" : "text-zinc-700")}>{log.ip}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" /> {log.geo}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded border transition-colors",
                      log.method === 'GET' ? (isDark ? "bg-zinc-800 border-zinc-750 text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-750") : 
                      log.method === 'POST' ? (isDark ? "bg-zinc-800 border-zinc-750 text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-750") : 
                      (isDark ? "bg-zinc-800 border-zinc-750 text-zinc-350" : "bg-zinc-105 border-zinc-200 text-zinc-800")
                    )}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-xs font-bold",
                      log.status < 300 ? (isDark ? "text-emerald-400" : "text-emerald-600") : 
                      log.status < 500 ? (isDark ? "text-amber-400" : "text-amber-600") : (isDark ? "text-rose-450" : "text-rose-600")
                    )}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-md border transition-colors",
                        log.auth_status === 'success' 
                          ? (isDark ? "bg-zinc-805 text-zinc-400 border-zinc-750" : "bg-zinc-100 text-zinc-650 border-zinc-200") 
                          : (isDark ? "bg-rose-500/10 text-rose-450 border-rose-500/20" : "bg-rose-50 text-rose-650 border-rose-200")
                      )}>
                        Auth: {log.auth_status}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">{log.tls_version}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-zinc-500 text-sm">
                    Nenhum log encontrado. Clique em "Simular Fluxo".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logs.length > 0 && (
          <div className={cn("px-6 py-4 border-t flex items-center justify-between transition-colors", isDark ? "border-zinc-850 bg-zinc-950/20" : "border-zinc-150 bg-zinc-50")}>
            <p className="text-xs text-zinc-500">
              Mostrando <span className={cn("font-medium", isDark ? "text-zinc-300" : "text-zinc-800")}>{startIndex + 1}</span> a <span className={cn("font-medium", isDark ? "text-zinc-300" : "text-zinc-800")}>{Math.min(startIndex + itemsPerPage, logs.length)}</span> de <span className={cn("font-medium", isDark ? "text-zinc-300" : "text-zinc-800")}>{logs.length}</span> logs
            </p>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  "p-2 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed",
                  isDark 
                    ? "border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800" 
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                    if (Math.abs(page - currentPage) === 2) return <span key={page} className="text-zinc-500 px-1">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-semibold transition-all",
                        currentPage === page 
                          ? (isDark ? "bg-zinc-100 text-zinc-950" : "bg-zinc-900 text-white font-bold") 
                          : (isDark ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800" : "text-zinc-500 hover:text-zinc-905 hover:bg-zinc-150")
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
                className={cn(
                  "p-2 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed",
                  isDark 
                    ? "border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800" 
                    : "border-zinc-200 text-zinc-650 hover:bg-zinc-100 hover:text-zinc-950"
                )}
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

interface ApiKey {
  id: number;
  key_value: string;
  name: string;
  integration_id: number;
  integration_name: string;
  created_at: string;
}

const KeyManagement = ({ isDark, integrations, onLogAdded }: { isDark: boolean, integrations: Integration[], onLogAdded?: () => void }) => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const [codeTab, setCodeTab] = useState<'js' | 'php'>('js');
  const [formData, setFormData] = useState({
    name: '',
    integration_id: ''
  });

  // Simulator States
  const [testKey, setTestKey] = useState("");
  const [testIp, setTestIp] = useState("186.230.12.98");
  const [testGeo, setTestGeo] = useState("São Paulo, Brazil");
  const [testMethod, setTestMethod] = useState("POST");
  const [testStatus, setTestStatus] = useState("201");
  const [testAuthStatus, setTestAuthStatus] = useState("success");
  const [testTlsVersion, setTestTlsVersion] = useState("TLS 1.3");
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await axios.get('/api/api-keys');
      setKeys(res.data);
    } catch (e) {
      console.error("Erro ao carregar chaves", e);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  useEffect(() => {
    if (keys.length > 0 && !testKey) {
      setTestKey(keys[0].key_value);
    }
  }, [keys, testKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.integration_id) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/api-keys', {
        name: formData.name,
        integration_id: parseInt(formData.integration_id)
      });
      setNewKey(res.data.key_value);
      fetchKeys();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao criar chave de API");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Revogar esta chave impedirá imediatamente qualquer sistema externo de registrar logs de rede associados. Deseja continuar?")) {
      try {
        await axios.delete(`/api/api-keys/${id}`);
        fetchKeys();
      } catch (e) {
        alert("Erro ao excluir chave");
      }
    }
  };

  const handleCopy = (text: string, id: number | string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestSend = async () => {
    if (!testKey) {
      alert("Selecione ou digite uma chave de API para rodar o teste.");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await axios.post("/api/logs/register", {
        ip: testIp,
        geo: testGeo,
        method: testMethod,
        status: parseInt(testStatus),
        auth_status: testAuthStatus,
        tls_version: testTlsVersion
      }, {
        headers: {
          "X-API-Key": testKey
        }
      });
      setTestResult({
        success: true,
        status: res.status,
        data: res.data
      });
      if (onLogAdded) {
        onLogAdded();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        status: err.response?.status || 500,
        data: err.response?.data || { error: err.message }
      });
    } finally {
      setTesting(false);
    }
  };

  const baseUrl = window.location.origin;

  const codeJs = `// Exemplo de integração em JavaScript (Node.js/Fetch)
fetch("${baseUrl}/api/logs/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "${keys[0]?.key_value || 'nexus_key_sua_chave_aqui'}"
  },
  body: JSON.stringify({
    ip: "186.230.12.98",
    geo: "São Paulo, Brazil",
    method: "POST",
    status: 201,
    auth_status: "success",
    tls_version: "TLS 1.3"
  })
})
  .then(res => res.json())
  .then(data => console.log("Retorno central:", data))
  .catch(err => console.error("Falha no transporte:", err));`;

  const codePhp = `<?php
// Exemplo de integração em PHP (cURL)
$api_url = "${baseUrl}/api/logs/register";
$api_key = "${keys[0]?.key_value || 'nexus_key_sua_chave_aqui'}";

$payload = [
    "ip" => "186.230.12.98",
    "geo" => "São Paulo, Brazil",
    "method" => "POST",
    "status" => 201,
    "auth_status" => "success",
    "tls_version" => "TLS 1.3"
];

$ch = curl_init($api_url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "X-API-Key: " . $api_key
    ]
]);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo "Erro Curl: " . curl_error($ch);
} else {
    echo "Servidor respondeu: " . $response;
}
curl_close($ch);
?>`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>Chaves de Acesso API</h2>
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-650")}>
            Crie, gerencie e revogue chaves para que sistemas externos gravem logs nesta plataforma.
          </p>
        </div>
        <button 
          onClick={() => {
            setFormData({ name: '', integration_id: integrations[0]?.id?.toString() || '' });
            setNewKey(null);
            setShowModal(true);
          }}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm self-start sm:self-auto",
            isDark 
              ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200" 
              : "bg-zinc-900 text-white hover:bg-zinc-800"
          )}
        >
          <Plus className="w-5 h-5" /> Nova Chave
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* API Keys List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className={cn("text-sm font-semibold uppercase tracking-wider", isDark ? "text-zinc-400" : "text-zinc-500")}>Minhas Chaves Ativas</h3>
          
          {keys.length === 0 ? (
            <div className={cn("border border-dashed p-10 rounded-2xl text-center flex flex-col items-center justify-center transition-colors", isDark ? "border-zinc-800" : "border-zinc-300 bg-white shadow-sm")}>
              <Key className={cn("w-10 h-10 mb-3 opacity-20", isDark ? "text-white" : "text-zinc-900")} />
              <p className={cn("text-sm mb-4", isDark ? "text-zinc-500" : "text-zinc-650")}>Você ainda não possui nenhuma chave de API registrada.</p>
              <button 
                onClick={() => {
                  setFormData({ name: '', integration_id: integrations[0]?.id?.toString() || '' });
                  setNewKey(null);
                  setShowModal(true);
                }}
                className={cn(
                  "text-xs font-semibold px-4 py-2 rounded-xl transition-all border",
                  isDark 
                    ? "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 text-zinc-300" 
                    : "border-zinc-300 hover:border-zinc-400 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                )}
              >
                Criar primeira chave
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {keys.map(k => (
                <div 
                  key={k.id} 
                  className={cn(
                    "p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                    isDark ? "bg-zinc-900 border-zinc-850 hover:border-zinc-800" : "bg-white border-zinc-300 shadow-sm hover:border-zinc-400"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("font-bold text-base", isDark ? "text-white" : "text-zinc-900")}>
                        {k.name}
                      </span>
                      <span className={cn(
                        "text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border",
                        isDark ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-zinc-100 border-zinc-300 text-zinc-500"
                      )}>
                        {k.integration_name || "Desconhecido"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <code className={cn(
                        "text-xs font-mono px-2.5 py-1 rounded select-all transition-colors",
                        isDark ? "bg-zinc-950 text-zinc-400" : "bg-zinc-100 text-zinc-700"
                      )}>
                        {k.key_value.substring(0, 14)}••••••••••••••••
                      </code>
                      <button 
                        onClick={() => handleCopy(k.key_value, k.id)}
                        className={cn(
                          "p-1.5 rounded transition-colors",
                          isDark ? "hover:bg-zinc-800 text-zinc-500 hover:text-white" : "hover:bg-zinc-100 text-zinc-500 hover:text-black"
                        )}
                        title="Copiar API Key"
                      >
                        {copiedId === k.id ? <Check className="w-4.5 h-4.5 text-emerald-500" /> : <Copy className="w-4.5 h-4.5" />}
                      </button>
                    </div>

                    <p className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-zinc-400")}>
                      Criada em: {new Date(k.created_at).toLocaleString()}
                    </p>
                  </div>

                  <button 
                    onClick={() => handleDelete(k.id)}
                    className={cn(
                      "p-2.5 rounded-xl border flex items-center justify-center transition-colors group self-start sm:self-auto",
                      isDark 
                        ? "border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5" 
                        : "border-zinc-300 hover:border-zinc-400 text-zinc-500 hover:text-rose-600 hover:bg-rose-50"
                    )}
                    title="Revogar chave"
                  >
                    <Trash2 className="w-4.5 h-4.5 transition-transform group-hover:scale-105" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Integration Instructions & Code Examples */}
        <div className="space-y-4">
          <h3 className={cn("text-sm font-semibold uppercase tracking-wider", isDark ? "text-zinc-400" : "text-zinc-500")}>Como Integrar</h3>
          
          <div className={cn("p-6 rounded-2xl border space-y-4 text-start font-sans", isDark ? "bg-zinc-900 border-zinc-850" : "bg-white border-zinc-300 shadow-sm")}>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-zinc-500" />
              <h4 className={cn("text-sm font-bold", isDark ? "text-white" : "text-zinc-900")}>Envio de Logs Externos</h4>
            </div>
            
            <p className={cn("text-xs leading-relaxed", isDark ? "text-zinc-400" : "text-zinc-650")}>
              Qualquer microsserviço ou servidor externo pode enviar registros usando o endpoint global listado abaixo. Lembre-se de anexar a API Key no cabeçalho.
            </p>

            <div className="space-y-2">
              <span className={cn("text-[10px] font-bold uppercase tracking-wider text-zinc-400", isDark ? "text-zinc-500" : "text-zinc-455")}>Método e URL:</span>
              <div className={cn("font-mono text-xs p-3 rounded-lg border flex items-center gap-2 select-all", isDark ? "bg-zinc-950 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-800")}>
                <span className="font-bold text-emerald-500">POST</span>
                <span className="truncate">{baseUrl}/api/logs/register</span>
              </div>
            </div>

            {/* Code switcher tabs */}
            <div className="space-y-3">
              <div className="flex border-b border-zinc-700/50">
                <button 
                  onClick={() => setCodeTab('js')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors",
                    codeTab === 'js'
                      ? (isDark ? "border-white text-white" : "border-zinc-900 text-zinc-900")
                      : "border-transparent text-zinc-500 hover:text-zinc-400"
                  )}
                >
                  Node.js / JS
                </button>
                <button 
                  onClick={() => setCodeTab('php')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors",
                    codeTab === 'php'
                      ? (isDark ? "border-white text-white" : "border-zinc-900 text-zinc-900")
                      : "border-transparent text-zinc-500 hover:text-zinc-400"
                  )}
                >
                  PHP
                </button>
              </div>

              <div className="relative group">
                <pre className={cn(
                  "font-mono text-[10px] p-4 rounded-xl overflow-x-auto max-h-[280px] leading-relaxed border select-all",
                  isDark ? "bg-zinc-950 border-zinc-850 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-805"
                )}>
                  {codeTab === 'js' ? codeJs : codePhp}
                </pre>
                <button 
                  onClick={() => handleCopy(codeTab === 'js' ? codeJs : codePhp, 'code')}
                  className={cn(
                    "absolute top-2 right-2 p-1.5 rounded border opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/40 text-zinc-400 hover:text-white border-zinc-700/30"
                  )}
                  title="Copiar código"
                >
                  {copiedId === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* 🛠️ Playground Simulador Card (Bypass SSO) */}
          <div className={cn("p-6 rounded-2xl border space-y-4 text-start font-sans", isDark ? "bg-zinc-900 border-zinc-850" : "bg-white border-zinc-300 shadow-sm")}>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />
              <h4 className={cn("text-sm font-bold", isDark ? "text-white" : "text-zinc-900")}>Simulador Instantâneo (Bypass SSO)</h4>
            </div>

            <p className={cn("text-xs leading-relaxed", isDark ? "text-zinc-400" : "text-zinc-650")}>
              Como seu workspace de desenvolvimento requer login do Google, requisições feitas por ferramentas externas como o <strong>Thunder Client</strong> ou servidores de teste recebem o redirecionamento Single Sign-On (Login Page).
            </p>
            <p className={cn("text-xs leading-relaxed font-semibold", isDark ? "text-indigo-400" : "text-indigo-600")}>
              Utilize o formulário abaixo para enviar requisições reais contendo sua API Key diretamente através do navegador autenticado!
            </p>

            <div className="space-y-4 pt-2 border-t border-zinc-800/40">
              {/* Key selection */}
              <div>
                <label className={cn("text-[10px] font-bold uppercase tracking-wider block mb-1", isDark ? "text-zinc-450" : "text-zinc-550")}>Chave de API do Envio</label>
                <select
                  className={cn(
                    "w-full rounded-lg px-3 py-2 outline-none border text-xs font-mono",
                    isDark 
                      ? "bg-zinc-950 border-zinc-850 text-zinc-200" 
                      : "bg-zinc-50 border-zinc-250 text-zinc-800"
                  )}
                  value={testKey}
                  onChange={e => setTestKey(e.target.value)}
                >
                  <option value="">-- Selecione uma chave --</option>
                  {keys.map(k => (
                    <option key={k.id} value={k.key_value}>
                      {k.name} ({k.key_value.substring(0, 10)}...)
                    </option>
                  ))}
                </select>
              </div>

              {/* Advanced payload inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cn("text-[10px] font-bold uppercase block mb-1", isDark ? "text-zinc-455" : "text-zinc-500")}>Região / Cidade</label>
                  <input
                    type="text"
                    className={cn("w-full rounded-lg px-3 py-1.5 border text-xs", isDark ? "bg-zinc-950 border-zinc-800 text-zinc-350" : "bg-zinc-50 border-zinc-200 text-zinc-800")}
                    value={testGeo}
                    onChange={e => setTestGeo(e.target.value)}
                  />
                </div>
                <div>
                  <label className={cn("text-[10px] font-bold uppercase block mb-1", isDark ? "text-zinc-455" : "text-zinc-500")}>IP Externo</label>
                  <input
                    type="text"
                    className={cn("w-full rounded-lg px-3 py-1.5 border text-xs font-mono", isDark ? "bg-zinc-950 border-zinc-800 text-zinc-350" : "bg-zinc-50 border-zinc-200 text-zinc-800")}
                    value={testIp}
                    onChange={e => setTestIp(e.target.value)}
                  />
                </div>
                <div>
                  <label className={cn("text-[10px] font-bold uppercase block mb-1", isDark ? "text-zinc-455" : "text-zinc-500")}>Método</label>
                  <select
                    className={cn("w-full rounded-lg px-3 py-1.5 border text-xs", isDark ? "bg-zinc-950 border-zinc-800 text-zinc-350" : "bg-zinc-50 border-zinc-200 text-zinc-800")}
                    value={testMethod}
                    onChange={e => setTestMethod(e.target.value)}
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div>
                  <label className={cn("text-[10px] font-bold uppercase block mb-1", isDark ? "text-zinc-455" : "text-zinc-500")}>Código Log</label>
                  <select
                    className={cn("w-full rounded-lg px-3 py-1.5 border text-xs", isDark ? "bg-zinc-950 border-zinc-800 text-zinc-350" : "bg-zinc-50 border-zinc-200 text-zinc-800")}
                    value={testStatus}
                    onChange={e => setTestStatus(e.target.value)}
                  >
                    <option value="201">201 (Created)</option>
                    <option value="200">200 (OK)</option>
                    <option value="400">400 (Bad Request)</option>
                    <option value="401">401 (Unauthorized)</option>
                    <option value="403">403 (Forbidden)</option>
                    <option value="500">500 (Server Error)</option>
                  </select>
                </div>
              </div>

              {/* Instant Sim Action button */}
              <button
                onClick={handleTestSend}
                disabled={testing || !testKey}
                className={cn(
                  "w-full text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm",
                  isDark
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-zinc-800 disabled:text-zinc-650"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-zinc-100 disabled:text-zinc-400"
                )}
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {testing ? "Executando Requisição..." : "Testar e Gravar Log no Banco"}
              </button>

              {/* Simulation Result display */}
              {testResult && (
                <div className="space-y-1.5 pt-2 border-t border-zinc-800/40">
                  <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-zinc-500" : "text-zinc-600")}>Resposta do Servidor:</span>
                  {testResult.success ? (
                    <div className={cn("p-3 rounded-xl border font-mono text-[10px] space-y-1 select-all leading-normal", isDark ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-800")}>
                      <span className="font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> STATUS: {testResult.status}</span>
                      <pre className="overflow-x-auto font-mono mt-1 whitespace-pre">{JSON.stringify(testResult.data, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className={cn("p-3 rounded-xl border font-mono text-[10px] space-y-1 select-all leading-normal", isDark ? "bg-rose-950/20 border-rose-500/10 text-rose-450" : "bg-rose-50 border-rose-250 text-rose-805")}>
                      <span className="font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> STATUS: {testResult.status}</span>
                      <pre className="overflow-x-auto font-mono mt-1 whitespace-pre">{JSON.stringify(testResult.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Nova Chave Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }} 
              className={cn("w-full max-w-md border rounded-2xl shadow-2xl p-6 transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-300")}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={cn("text-xl font-bold", isDark ? "text-white" : "text-zinc-900")}>Gerar Nova API Key</h3>
                <button onClick={() => { setShowModal(false); setNewKey(null); }} className={cn("transition-colors", isDark ? "text-zinc-500 hover:text-white" : "text-zinc-400 hover:text-zinc-950")}><X className="w-6 h-6" /></button>
              </div>

              {!newKey ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={cn("text-xs font-bold uppercase mb-1.5 block", isDark ? "text-zinc-400" : "text-zinc-500")}>Identificador de Uso (Nome)</label>
                    <input 
                      required 
                      className={cn(
                        "w-full rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all border",
                        isDark 
                          ? "bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-zinc-650 focus:border-zinc-650" 
                          : "bg-zinc-50 border-zinc-250 text-zinc-800 focus:ring-zinc-300 focus:border-zinc-350"
                      )}
                      placeholder="Ex: API Backend, Servidor Python..."
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className={cn("text-xs font-bold uppercase mb-1.5 block", isDark ? "text-zinc-400" : "text-zinc-500")}>Integração Associada</label>
                    <select 
                      required
                      className={cn(
                        "w-full rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all border text-sm",
                        isDark 
                          ? "bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-zinc-650 focus:border-zinc-650" 
                          : "bg-zinc-50 border-zinc-250 text-zinc-800 focus:ring-zinc-300 focus:border-zinc-350"
                      )}
                      value={formData.integration_id} 
                      onChange={e => setFormData({...formData, integration_id: e.target.value})}
                    >
                      <option value="" disabled>Selecione uma integração...</option>
                      {integrations.map(int => (
                        <option key={int.id} value={int.id}>{int.name}</option>
                      ))}
                    </select>
                    {integrations.length === 0 && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">Nota: Crie uma integração na aba Integrações primeiro!</p>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={loading || integrations.length === 0} 
                    className={cn(
                      "w-full font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 text-sm",
                      isDark 
                        ? "bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950" 
                        : "bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white"
                    )}
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Gerar Token de Acesso"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className={cn("p-4 rounded-xl border border-dashed text-center space-y-2", isDark ? "bg-zinc-950/40 border-zinc-850" : "bg-emerald-50/20 border-emerald-500/20")}>
                    <p className={cn("text-xs font-bold text-emerald-500 uppercase flex items-center justify-center gap-1.5")}>
                      <ShieldCheck className="w-4.5 h-4.5" /> Chave gerada com sucesso!
                    </p>
                    <p className={cn("text-[11px] leading-relaxed", isDark ? "text-zinc-400" : "text-zinc-600")}>
                      Por motivos de segurança, você só pode visualizar este segredo agora. Guarde-o em um local protegido.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className={cn("text-[10px] font-bold uppercase text-zinc-400")}>Token de API</span>
                    <div className={cn("p-3 rounded-xl border font-mono text-xs flex items-center justify-between gap-3 select-all", isDark ? "bg-zinc-950 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-300 text-zinc-850")}>
                      <span className="break-all font-semibold font-mono">{newKey}</span>
                      <button 
                        onClick={() => handleCopy(newKey, 'newkey')}
                        className={cn(
                          "p-2 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                        )}
                        title="Copiar Chave"
                      >
                        {copiedId === 'newkey' ? <Check className="w-4.5 h-4.5 text-emerald-500" /> : <Copy className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setShowModal(false); setNewKey(null); }}
                    className={cn(
                      "w-full font-semibold py-2.5 rounded-xl transition-all text-sm mt-2 border",
                      isDark 
                        ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white" 
                        : "border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
                    )}
                  >
                    Entendido e Guardado
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UserManagement = ({ isDark }: { isDark: boolean }) => {
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
          <h2 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>Gestão de Acesso</h2>
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-600")}>Controle quem pode acessar o dashboard.</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setShowModal(true); }}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm",
            isDark 
              ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200" 
              : "bg-zinc-900 text-white hover:bg-zinc-800"
          )}
        >
          <UserPlus className="w-5 h-5" /> Novo Usuário
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => (
          <div key={u.id} className={cn("p-6 rounded-2xl border flex flex-col items-start gap-4 transition-colors", isDark ? "bg-zinc-900 border-zinc-850" : "bg-white border-zinc-200 shadow-sm")}>
            <div className="flex items-center justify-between w-full">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold border transition-colors", isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-600")}>
                {u.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditingUser(u); setShowModal(true); }} className={cn("p-2 rounded-lg transition-colors", isDark ? "text-zinc-500 hover:text-white hover:bg-zinc-800" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100")}>
                  <Pencil className="w-4 h-4" />
                </button>
                {u.username !== 'admin' && (
                  <button onClick={() => handleDelete(u.id)} className={cn("p-2 rounded-lg transition-colors", isDark ? "text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10" : "text-zinc-500 hover:text-rose-600 hover:bg-rose-50")}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-zinc-900")}>{u.name}</h3>
              <p className={cn("text-sm italic", isDark ? "text-zinc-500" : "text-zinc-400")}>@{u.username}</p>
            </div>
            <div className="flex items-center justify-between w-full mt-2">
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest transition-colors",
                u.role === 'admin' 
                  ? (isDark ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-700 border-rose-200") 
                  : (isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-100 text-zinc-700 border-zinc-200")
              )}>
                {u.role}
              </span>
              <span className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-zinc-400")}>{new Date(u.created_at || '').toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }} 
              className={cn("w-full max-w-md border rounded-2xl shadow-2xl p-6 transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200")}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={cn("text-xl font-bold", isDark ? "text-white" : "text-zinc-900")}>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <button onClick={() => setShowModal(false)} className={cn("transition-colors", isDark ? "text-zinc-500 hover:text-white" : "text-zinc-400 hover:text-zinc-950")}><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-405 uppercase mb-1 block">Nome Completo</label>
                  <input 
                    required 
                    className={cn(
                      "w-full rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all border",
                      isDark 
                        ? "bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-zinc-650 focus:border-zinc-650" 
                        : "bg-zinc-50 border-zinc-205 text-zinc-800 focus:ring-zinc-300 focus:border-zinc-350"
                    )}
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-405 uppercase mb-1 block">Usuário (Login)</label>
                  <input 
                    required 
                    className={cn(
                      "w-full rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all border",
                      isDark 
                        ? "bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-zinc-650 focus:border-zinc-650" 
                        : "bg-zinc-50 border-zinc-205 text-zinc-800 focus:ring-zinc-300 focus:border-zinc-350"
                    )}
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                    disabled={editingUser?.username === 'admin'} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-405 uppercase mb-1 block">Senha {editingUser && '(deixe em branco para não alterar)'}</label>
                  <input 
                    type="password" 
                    required={!editingUser} 
                    className={cn(
                      "w-full rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all border",
                      isDark 
                        ? "bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-zinc-650 focus:border-zinc-650" 
                        : "bg-zinc-50 border-zinc-205 text-zinc-800 focus:ring-zinc-300 focus:border-zinc-350"
                    )}
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-450 uppercase mb-1 block">Papel (Role)</label>
                  <select 
                    className={cn(
                      "w-full rounded-xl px-4 py-2.5 outline-none border",
                      isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-800"
                    )}
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value as any})} 
                    disabled={editingUser?.username === 'admin'}
                  >
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className={cn(
                    "w-full font-bold py-3 rounded-xl transition-all shadow-sm mt-2",
                    isDark 
                      ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-950" 
                      : "bg-zinc-900 hover:bg-zinc-800 text-white"
                  )}
                >
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

const Login = ({ onLoginSuccess, isDark, toggleDarkMode }: { onLoginSuccess: (user: User) => void, isDark: boolean, toggleDarkMode: () => void }) => {
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
    <div className={cn("min-h-screen flex items-center justify-center p-4 relative font-sans transition-colors duration-200", isDark ? "bg-zinc-950" : "bg-zinc-50")}>
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-400 rounded-full blur-[140px]" />
      </div>

      <div className="absolute top-6 right-6">
        <button 
          onClick={toggleDarkMode}
          className={cn(
            "p-2.5 rounded-xl border transition-colors",
            isDark 
              ? "border-zinc-900 bg-zinc-900/50 text-zinc-400 hover:text-white" 
              : "border-zinc-300 bg-white text-zinc-650 hover:text-black hover:bg-zinc-100 shadow-sm"
          )}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className={cn(
          "w-full max-w-sm border rounded-2xl p-8 relative z-10 shadow-xl transition-colors duration-200",
          isDark 
            ? "bg-zinc-950 border-zinc-900" 
            : "bg-white border-zinc-300 shadow-lg text-zinc-900"
        )}
      >
        <div className="flex flex-col items-start mb-8">
          <div className={cn(
            "w-12 h-12 rounded-full border flex items-center justify-center mb-4 shadow-sm transition-colors duration-200",
            isDark 
              ? "bg-white border-zinc-850 text-zinc-950" 
              : "bg-zinc-900 border-zinc-800 text-white"
          )}>
            <Zap className="w-6 h-6" />
          </div>
          <h1 className={cn("text-2xl font-bold tracking-tight font-sans transition-colors duration-200", isDark ? "text-white" : "text-zinc-900")}>Nexus <span className="text-zinc-400 font-medium font-mono text-xl">API</span></h1>
          <p className={cn("text-xs mt-1 transition-colors duration-200", isDark ? "text-zinc-500" : "text-zinc-600")}>Painel Central de Infraestrutura</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className={cn("text-[10px] font-bold uppercase tracking-widest block transition-colors duration-200", isDark ? "text-zinc-500" : "text-zinc-600")}>Usuário</label>
            <input 
              required 
              className={cn(
                "w-full rounded-xl px-4 py-3 outline-none transition-colors duration-200 text-sm font-mono border",
                isDark 
                  ? "bg-zinc-950 border-zinc-900 text-white placeholder-zinc-800 focus:border-zinc-700" 
                  : "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400"
              )}
              placeholder="admin / client" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          </div>
          <div className="space-y-1.5">
            <label className={cn("text-[10px] font-bold uppercase tracking-widest block transition-colors duration-200", isDark ? "text-zinc-500" : "text-zinc-600")}>Senha</label>
            <input 
              type="password" 
              required 
              className={cn(
                "w-full rounded-xl px-4 py-3 outline-none transition-colors duration-200 text-sm font-mono border",
                isDark 
                  ? "bg-zinc-950 border-zinc-900 text-white placeholder-zinc-800 focus:border-zinc-700" 
                  : "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400"
              )}
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>

          {error && (
            <p className={cn(
              "text-xs font-mono font-medium py-2 px-3 rounded-lg border transition-colors duration-200",
              isDark 
                ? "text-rose-400 bg-rose-500/5 border-rose-500/10" 
                : "text-rose-600 bg-rose-50 border-rose-200"
            )}>
              {error}
            </p>
          )}

          <button 
            disabled={loading} 
            className={cn(
              "w-full font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 text-sm",
              isDark 
                ? "bg-white hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-500 text-zinc-950" 
                : "bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white"
            )}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Acessar Dashboard"}
          </button>
        </form>

        <div className={cn("mt-8 pt-6 border-t text-start transition-colors duration-200", isDark ? "border-zinc-900" : "border-zinc-200")}>
          <p className={cn("text-[9px] font-mono tracking-wider uppercase transition-colors duration-200", isDark ? "text-zinc-600" : "text-zinc-500")}>Enterprise Protocol v4.5</p>
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
  const [isDark, setIsDark] = useState(false);
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
    return <Login onLoginSuccess={handleLogin} isDark={isDark} toggleDarkMode={() => setIsDark(!isDark)} />;
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
          "w-64 border-r px-4 py-8 flex flex-col gap-1 transition-all duration-300 fixed lg:static inset-y-0 left-0 z-50 transition-colors",
          isDark ? "border-zinc-900 bg-zinc-950 text-zinc-200" : "border-zinc-200 bg-white text-zinc-900",
          !sidebarOpen && "lg:w-20 -translate-x-full lg:translate-x-0"
        )}>
          <div className="mb-6 px-2 flex items-center justify-between">
             <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em] transition-colors", isDark ? "text-zinc-500" : "text-zinc-400", !sidebarOpen && "hidden")}>Infrastructure</span>
             <button onClick={() => setSidebarOpen(false)} className={cn("lg:hidden transition-colors", isDark ? "text-zinc-500" : "text-zinc-400")}><X className="w-5 h-5" /></button>
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
            icon={Key} 
            label={sidebarOpen ? "Chaves de API" : ""} 
            active={activeTab === 'apiKeys'} 
            onClick={() => setActiveTab('apiKeys')} 
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

          <div className={cn("mt-auto border-t pt-6 px-2 transition-colors", isDark ? "border-zinc-900" : "border-zinc-200")}>
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {sidebarOpen && <span className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>Global Node: Active</span>}
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
                      isDark={isDark}
                    />
                  )}
                  {activeTab === 'integrations' && (
                    <Integrations 
                      integrations={integrations} 
                      fetchIntegrations={fetchData} 
                      userRole={user.role} 
                      isDark={isDark} 
                    />
                  )}
                  {activeTab === 'apiKeys' && (
                    <KeyManagement 
                      isDark={isDark} 
                      integrations={integrations}
                      onLogAdded={fetchData}
                    />
                  )}
                  {activeTab === 'logs' && (
                    <LogsTable 
                      logs={logs} 
                      integrations={integrations} 
                      simulateLogs={simulateLogs} 
                      exportPDF={exportPDF} 
                      exportCSV={exportCSV} 
                      isDark={isDark} 
                    />
                  )}
                  {activeTab === 'users' && user.role === 'admin' && (
                    <UserManagement 
                      isDark={isDark} 
                    />
                  )}
               </motion.div>
             </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
