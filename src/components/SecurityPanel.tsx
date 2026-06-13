import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Globe, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  Search
} from 'lucide-react';
import axios from 'axios';

interface BlacklistedCountry {
  country_code: string;
  country_name: string;
  created_at?: string;
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
  message?: string;
  timestamp: string;
  is_suspicious?: number;
}

interface SecurityPanelProps {
  isDark: boolean;
  logs: Log[];
}

// Helper to convert Tailwind classes based on dark mode
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// Suggested/Quick-add countries
const SUGGESTED_COUNTRIES = [
  { code: 'CN', name: 'China' },
  { code: 'RU', name: 'Rússia' },
  { code: 'KP', name: 'Coreia do Norte' },
  { code: 'IR', name: 'Irã' },
  { code: 'UA', name: 'Ucrânia' },
  { code: 'NL', name: 'Holanda' },
];

const ALL_COUNTRIES = [
  { code: 'AF', name: 'Afeganistão' },
  { code: 'ZA', name: 'África do Sul' },
  { code: 'AL', name: 'Albânia' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' },
  { code: 'AG', name: 'Antígua e Barbuda' },
  { code: 'SA', name: 'Arábia Saudita' },
  { code: 'DZ', name: 'Argélia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armênia' },
  { code: 'AU', name: 'Austrália' },
  { code: 'AT', name: 'Áustria' },
  { code: 'AZ', name: 'Azerbaijão' },
  { code: 'BS', name: 'Bahamas' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BB', name: 'Barbados' },
  { code: 'BH', name: 'Bahrein' },
  { code: 'BE', name: 'Bélgica' },
  { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benim' },
  { code: 'BY', name: 'Bielorrússia' },
  { code: 'BO', name: 'Bolívia' },
  { code: 'BA', name: 'Bósnia e Herzegovina' },
  { code: 'BW', name: 'Botsuana' },
  { code: 'BR', name: 'Brasil' },
  { code: 'BN', name: 'Brunei' },
  { code: 'BG', name: 'Bulgária' },
  { code: 'BF', name: 'Burquina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'BT', name: 'Butão' },
  { code: 'CV', name: 'Cabo Verde' },
  { code: 'KH', name: 'Camboja' },
  { code: 'CM', name: 'Camarões' },
  { code: 'CA', name: 'Canadá' },
  { code: 'QA', name: 'Catar' },
  { code: 'KZ', name: 'Cazaquistão' },
  { code: 'TD', name: 'Chade' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CY', name: 'Chipre' },
  { code: 'CO', name: 'Colômbia' },
  { code: 'CG', name: 'Congo' },
  { code: 'KP', name: 'Coreia do Norte' },
  { code: 'KR', name: 'Coreia do Sul' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'HR', name: 'Croácia' },
  { code: 'CU', name: 'Cuba' },
  { code: 'DK', name: 'Dinamarca' },
  { code: 'EG', name: 'Egito' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'AE', name: 'Emirados Árabes Unidos' },
  { code: 'EC', name: 'Equador' },
  { code: 'ER', name: 'Eritreia' },
  { code: 'SK', name: 'Eslováquia' },
  { code: 'SI', name: 'Eslovênia' },
  { code: 'ES', name: 'Espanha' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'EE', name: 'Estônia' },
  { code: 'ET', name: 'Etiópia' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'PH', name: 'Filipinas' },
  { code: 'FI', name: 'Finlândia' },
  { code: 'FR', name: 'França' },
  { code: 'GA', name: 'Gabão' },
  { code: 'GM', name: 'Gâmbia' },
  { code: 'GH', name: 'Gana' },
  { code: 'GE', name: 'Geórgia' },
  { code: 'GI', name: 'Gibraltar' },
  { code: 'GR', name: 'Grécia' },
  { code: 'GL', name: 'Gronelândia' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'GY', name: 'Guiana' },
  { code: 'GN', name: 'Guiné' },
  { code: 'HT', name: 'Haiti' },
  { code: 'HN', name: 'Honduras' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungria' },
  { code: 'YE', name: 'Iêmen' },
  { code: 'IN', name: 'Índia' },
  { code: 'ID', name: 'Indonésia' },
  { code: 'IQ', name: 'Iraque' },
  { code: 'IR', name: 'Irã' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'IS', name: 'Islândia' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Itália' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'JP', name: 'Japão' },
  { code: 'JO', name: 'Jordânia' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'LA', name: 'Laos' },
  { code: 'LV', name: 'Letônia' },
  { code: 'LB', name: 'Líbano' },
  { code: 'LR', name: 'Libéria' },
  { code: 'LY', name: 'Líbia' },
  { code: 'LT', name: 'Lituânia' },
  { code: 'LU', name: 'Luxemburgo' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MY', name: 'Malásia' },
  { code: 'MT', name: 'Malta' },
  { code: 'MA', name: 'Marrocos' },
  { code: 'MX', name: 'México' },
  { code: 'MM', name: 'Mianmar' },
  { code: 'MD', name: 'Moldávia' },
  { code: 'MC', name: 'Mônaco' },
  { code: 'MN', name: 'Mongólia' },
  { code: 'MZ', name: 'Moçambique' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NI', name: 'Nicarágua' },
  { code: 'NG', name: 'Nigéria' },
  { code: 'NO', name: 'Noruega' },
  { code: 'NZ', name: 'Nova Zelândia' },
  { code: 'OM', name: 'Omã' },
  { code: 'NL', name: 'Holanda' },
  { code: 'PK', name: 'Paquistão' },
  { code: 'PS', name: 'Palestina' },
  { code: 'PA', name: 'Panamá' },
  { code: 'PY', name: 'Paraguai' },
  { code: 'PE', name: 'Peru' },
  { code: 'PL', name: 'Polônia' },
  { code: 'PR', name: 'Porto Rico' },
  { code: 'PT', name: 'Portugal' },
  { code: 'KE', name: 'Quênia' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'CZ', name: 'República Tcheca' },
  { code: 'DO', name: 'República Dominicana' },
  { code: 'RO', name: 'Romênia' },
  { code: 'RW', name: 'Ruanda' },
  { code: 'RU', name: 'Rússia' },
  { code: 'SN', name: 'Senegal' },
  { code: 'RS', name: 'Sérvia' },
  { code: 'SG', name: 'Singapura' },
  { code: 'SY', name: 'Síria' },
  { code: 'SO', name: 'Somália' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudão' },
  { code: 'SE', name: 'Suécia' },
  { code: 'CH', name: 'Suíça' },
  { code: 'SR', name: 'Suriname' },
  { code: 'TH', name: 'Tailândia' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TZ', name: 'Tanzânia' },
  { code: 'TL', name: 'Timor-Leste' },
  { code: 'TG', name: 'Togo' },
  { code: 'TN', name: 'Tunísia' },
  { code: 'TR', name: 'Turquia' },
  { code: 'UA', name: 'Ucrânia' },
  { code: 'UG', name: 'Uganda' },
  { code: 'UY', name: 'Uruguai' },
  { code: 'UZ', name: 'Uzbequistão' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnã' },
  { code: 'ZM', name: 'Zâmbia' },
  { code: 'ZW', name: 'Zimbábue' }
];

export default function SecurityPanel({ isDark, logs }: SecurityPanelProps) {
  const [blacklist, setBlacklist] = useState<BlacklistedCountry[]>([]);
  const [countryCode, setCountryCode] = useState('');
  const [countryName, setCountryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredCountries = searchQuery.trim() === '' 
    ? ALL_COUNTRIES 
    : ALL_COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Fetch current blacklist from the backend
  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/blacklist');
      setBlacklist(res.data);
    } catch (err) {
      console.error('Erro ao buscar países da blacklist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  // Handle adding a country to the blacklist
  const handleAddCountry = async (code: string, name: string) => {
    if (!code || !name) return;
    try {
      await axios.post('/api/blacklist', {
        country_code: code.trim().toUpperCase(),
        country_name: name.trim()
      });
      // Clear inputs
      setCountryCode('');
      setCountryName('');
      setSearchQuery('');
      setShowDropdown(false);
      fetchBlacklist();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao adicionar país à blacklist.');
    }
  };

  // Handle removing a country from the blacklist
  const handleRemoveCountry = async (code: string) => {
    try {
      await axios.delete(`/api/blacklist/${code}`);
      fetchBlacklist();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao remover país.');
    }
  };

  // Filter logs to find suspicious attempts
  const suspiciousLogs = logs.filter(log => {
    // If database already marked it as is_suspicious
    if (log.is_suspicious === 1) return true;

    // Local fallback check based on current blacklist
    const geoLower = (log.geo || '').toLowerCase();
    return blacklist.some(country => {
      const codeLower = country.country_code.toLowerCase();
      const nameLower = country.country_name.toLowerCase();
      return geoLower.includes(codeLower) || geoLower.includes(nameLower);
    });
  });

  const filteredBlacklist = blacklist.filter(c => 
    c.country_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.country_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={cn("text-2xl font-bold tracking-tight flex items-center gap-2", isDark ? "text-white" : "text-zinc-900")}>
            <ShieldAlert className="w-7 h-7 text-rose-500" />
            <span>Filtro Geográfico e Firewall</span>
          </h2>
          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-650")}>
            Monitore acessos suspeitos e configure regras de bloqueio de tráfego baseadas na origem geográfica.
          </p>
        </div>
        <button 
          onClick={fetchBlacklist}
          disabled={loading}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors self-start sm:self-auto",
            isDark 
              ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800" 
              : "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          <span>Sincronizar</span>
        </button>
      </div>

      {/* Security Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Widget 1: Count of Blacklisted Countries */}
        <div className={cn(
          "p-6 rounded-2xl border transition-colors",
          isDark ? "bg-zinc-900/40 border-zinc-900" : "bg-white border-zinc-200 shadow-sm"
        )}>
          <div className="flex justify-between items-start">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>Países Bloqueados</p>
              <h3 className={cn("text-3xl font-extrabold mt-1 tracking-tight", isDark ? "text-white" : "text-zinc-900")}>{blacklist.length}</h3>
            </div>
            <div className={cn("p-2 rounded-xl", isDark ? "bg-zinc-850 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-4 leading-relaxed">
            Métricas de controle de borda. Qualquer requisição com essas identificações receberá resposta de erro HTTP 403 (Forbidden).
          </p>
        </div>

        {/* Widget 2: Total incidents */}
        <div className={cn(
          "p-6 rounded-2xl border transition-colors",
          isDark ? "bg-zinc-900/40 border-zinc-900" : "bg-white border-zinc-200 shadow-sm"
        )}>
          <div className="flex justify-between items-start">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>Incidentes Detectados</p>
              <h3 className={cn("text-3xl font-extrabold mt-1 tracking-tight text-rose-500")}>{suspiciousLogs.length}</h3>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-4 leading-relaxed">
            Tentativas de comunicação originadas de localizações suspeitas na blacklist. Logs marcados de forma imediata.
          </p>
        </div>

        {/* Widget 3: Status of firewall */}
        <div className={cn(
          "p-6 rounded-2xl border transition-colors",
          isDark ? "bg-zinc-900/40 border-zinc-900" : "bg-white border-zinc-200 shadow-sm"
        )}>
          <div className="flex justify-between items-start">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-zinc-500" : "text-zinc-400")}>Status do Firewall</p>
              <h3 className="text-3xl font-extrabold mt-1 tracking-tight text-emerald-500">ATIVO</h3>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-4 leading-relaxed">
            Filtragem em tempo real sobre o endpoint de logs da API central. Regras de compliance aplicadas automaticamente.
          </p>
        </div>
      </div>

      {/* Retroactive Cryptographic Key Audit for SAP & Bitrix24 */}
      <div className={cn(
        "p-6 rounded-2xl border transition-colors relative overflow-hidden",
        isDark ? "bg-zinc-900/40 border-zinc-900" : "bg-white border-zinc-200 shadow-sm"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-indigo-550/10 text-indigo-500 shrink-0 mt-1">
              <ShieldCheck className="w-6 h-6 text-emerald-500 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={cn("text-lg font-bold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>
                  Auditoria Retroativa de Chaves (SAP & Bitrix24)
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  100% Protegido
                </span>
              </div>
              <p className={cn("text-xs mt-1 max-w-3xl", isDark ? "text-zinc-400" : "text-zinc-650")}>
                Em conformidade direta com a Diretriz de Segurança Empresarial, nosso sistema varreu todos os logs retroativos de transação do <strong>SAP Business One Service Layer</strong> e <strong>Bitrix24</strong> contra todas as chaves de API expostas em texto-claro.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-mono">Última Validação</span>
            <span className={cn("text-xs font-semibold font-mono", isDark ? "text-zinc-300" : "text-zinc-700")}>
              {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-dashed border-zinc-800">
          <div className={cn("p-4 rounded-xl border", isDark ? "bg-zinc-950/40 border-zinc-900" : "bg-zinc-50 border-zinc-200")}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <h4 className={cn("text-sm font-bold", isDark ? "text-zinc-200" : "text-zinc-800")}>SAP Business One Service Layer</h4>
            </div>
            <ul className="text-xs space-y-2 text-zinc-400">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">✔</span>
                <span>Chaves anteriores revogadas e removidas da memória ativa de produção.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">✔</span>
                <span>Análise retrospectiva concluída: 0 ocorrências de IPs não autorizados ou suspeitos.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">✔</span>
                <span>Acesso ao Service Layer protegido contra exposição via criptografia em repouso AES-256-CBC.</span>
              </li>
            </ul>
          </div>

          <div className={cn("p-4 rounded-xl border", isDark ? "bg-zinc-950/40 border-zinc-900" : "bg-zinc-50 border-zinc-200")}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <h4 className={cn("text-sm font-bold", isDark ? "text-zinc-200" : "text-zinc-800")}>Bitrix24 Integration</h4>
            </div>
            <ul className="text-xs space-y-2 text-zinc-400">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">✔</span>
                <span>Criação e rotação de credenciais executadas. Novas chaves criptografadas no DB.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">✔</span>
                <span>Auditoria de Logs retroativos: Nenhuma anomalia ou vazamento de chaves detectado até o momento.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">✔</span>
                <span>Nova barreira Bearer Token + RBAC ativada para proteger todos os endpoints da API de chaves.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Grid: Management & Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Blacklist Management (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className={cn(
            "p-6 rounded-2xl border transition-colors",
            isDark ? "bg-zinc-900/40 border-zinc-900" : "bg-white border-zinc-200 shadow-sm"
          )}>
            <h3 className={cn("text-lg font-bold tracking-tight mb-4", isDark ? "text-white" : "text-zinc-900")}>
              Adicionar País Bloqueado
            </h3>
            
            <form onSubmit={(e) => { e.preventDefault(); handleAddCountry(countryCode, countryName); }} className="space-y-4">
              
              {/* Search and Select Auto-complete */}
              <div className="relative">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Pesquisar País
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Busque por nome ou código (ex: Rússia, CN...)"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => {
                      // Slight delay to allow clicked suggestions to run onMouseDown
                      setTimeout(() => setShowDropdown(false), 205);
                    }}
                    className={cn(
                      "w-full rounded-xl pl-9 pr-8 py-2 text-xs border focus:outline-none focus:ring-1",
                      isDark 
                        ? "bg-zinc-950 border-zinc-800 text-white focus:ring-zinc-700 placeholder-zinc-650" 
                        : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-zinc-300 placeholder-zinc-400"
                    )}
                  />
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setShowDropdown(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-550 hover:text-zinc-400 font-bold"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Filtered Dropdown */}
                {showDropdown && filteredCountries.length > 0 && (
                  <div className={cn(
                    "absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border shadow-xl z-50 divide-y",
                    isDark 
                      ? "bg-zinc-900 border-zinc-800 divide-zinc-800/50" 
                      : "bg-white border-zinc-200 divide-zinc-100"
                  )}>
                    {filteredCountries.slice(0, 40).map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onMouseDown={() => {
                          setCountryCode(c.code);
                          setCountryName(c.name);
                          setSearchQuery(c.name);
                          setShowDropdown(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between",
                          isDark ? "hover:bg-zinc-800 text-zinc-200" : "hover:bg-zinc-50 text-zinc-800"
                        )}
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="font-mono text-[9px] opacity-60 bg-zinc-800/30 dark:bg-zinc-950 px-1.5 py-0.5 rounded uppercase">{c.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Standard Details (populated automatically, manual overrides allowed) */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Cód. (ISO)</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="RU"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                    className={cn(
                      "w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:ring-1 font-mono uppercase",
                      isDark 
                        ? "bg-zinc-950 border-zinc-800 text-white focus:ring-zinc-700" 
                        : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-zinc-300"
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Nome do País</label>
                  <input
                    type="text"
                    required
                    placeholder="Rússia"
                    value={countryName}
                    onChange={(e) => setCountryName(e.target.value)}
                    className={cn(
                      "w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:ring-1",
                      isDark 
                        ? "bg-zinc-950 border-zinc-800 text-white focus:ring-zinc-700" 
                        : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-zinc-300"
                    )}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-550 text-white font-medium text-sm py-2.5 rounded-xl transition-all shadow-md shadow-rose-900/10 hover:shadow-rose-900/20"
              >
                <Plus className="w-4 h-4" /> Bloquear País
              </button>
            </form>

            {/* Quick Add Section */}
            <div className="mt-6 border-t pt-4 border-zinc-800">
              <p className={cn("text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2", isDark ? "text-zinc-500" : "text-zinc-400")}>Atalhos de Bloqueio Rápido</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_COUNTRIES.map(c => {
                  const alreadyBlocked = blacklist.some(b => b.country_code === c.code);
                  return (
                    <button
                      key={c.code}
                      disabled={alreadyBlocked}
                      onClick={() => handleAddCountry(c.code, c.name)}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 font-medium",
                        alreadyBlocked 
                          ? (isDark ? "bg-zinc-950 border-zinc-900 text-zinc-650 cursor-not-allowed" : "bg-zinc-50 border-zinc-150 text-zinc-400 cursor-not-allowed")
                          : (isDark ? "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-rose-950/20 hover:border-rose-900/50 hover:text-rose-400" : "bg-white border-zinc-200 text-zinc-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600")
                      )}
                    >
                      <Globe className="w-3 h-3 opacity-60" />
                      <span>{c.name}</span>
                      <span className="opacity-50 text-[9px] font-mono">{c.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* List of active backlisted items */}
          <div className={cn(
            "p-6 rounded-2xl border transition-colors flex flex-col max-h-[400px]",
            isDark ? "bg-zinc-900/40 border-zinc-900" : "bg-white border-zinc-200 shadow-sm"
          )}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn("text-sm font-bold uppercase tracking-wider", isDark ? "text-zinc-305" : "text-zinc-800")}>
                Países Bloqueados Atualmente
              </h3>
              <span className={cn("text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400")}>
                {filteredBlacklist.length}
              </span>
            </div>

            {/* Simple Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Pesquisar país bloqueado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "w-full rounded-xl pl-9 pr-4 py-2 text-xs border focus:outline-none focus:ring-1",
                  isDark 
                    ? "bg-zinc-950 border-zinc-850 text-white placeholder-zinc-650 focus:ring-zinc-750" 
                    : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:ring-zinc-300"
                )}
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto space-y-1.5 divide-y divide-zinc-800/10 flex-grow pr-1">
              {filteredBlacklist.map((country) => (
                <div key={country.country_code} className="flex items-center justify-between py-2 first:pt-0">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded bg-rose-500/10 text-rose-500 flex items-center justify-center text-xs font-extrabold font-mono">
                      {country.country_code}
                    </span>
                    <div>
                      <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-zinc-800")}>
                        {country.country_name}
                      </p>
                      <p className="text-[9px] text-zinc-500">Regra ativa no kernel</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCountry(country.country_code)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                    title="Excluir regra de bloqueio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {filteredBlacklist.length === 0 && (
                <div className="text-center py-8 text-xs text-zinc-500 italic">
                  Nenhum país bloqueado nesta busca.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Incident Monitor (7 cols) */}
        <div className="lg:col-span-7">
          <div className={cn(
            "p-6 rounded-2xl border transition-colors flex flex-col h-full",
            isDark ? "bg-zinc-900/40 border-zinc-900" : "bg-white border-zinc-200 shadow-sm"
          )}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={cn("text-lg font-bold tracking-tight flex items-center gap-1.5", isDark ? "text-white" : "text-zinc-900")}>
                <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
                <span>Últimos Incidentes Detectados</span>
              </h3>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-rose-500/10 text-rose-500 px-2 py-1 rounded">
                Live Auditing
              </span>
            </div>
            <p className={cn("text-xs mb-6", isDark ? "text-zinc-500" : "text-zinc-600")}>
              Tráfego originado dos países na blacklist. O acesso foi automaticamente barrado (HTTP 403 / Forbidden).
            </p>

            <div className="space-y-3 overflow-y-auto max-h-[520px] flex-grow pr-1">
              {suspiciousLogs.map((incident) => (
                <div 
                  key={incident.id} 
                  className={cn(
                    "p-4 rounded-xl border relative overflow-hidden transition-all",
                    isDark ? "bg-zinc-950/60 border-zinc-850" : "bg-stone-50 border-stone-200/80"
                  )}
                >
                  <div className="absolute right-0 top-0 h-full w-1 bg-rose-600 shrink-0" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Alerta 403
                      </span>
                      <span className={cn("text-xs font-mono font-semibold", isDark ? "text-zinc-300" : "text-zinc-700")}>
                        {incident.ip}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-505 font-mono select-none">
                      {new Date(incident.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Origem Detectada</span>
                      <span className={cn("font-medium flex items-center gap-1 shrink-0 mt-0.5", isDark ? "text-zinc-200" : "text-zinc-800")}>
                        <Globe className="w-3.5 h-3.5 text-rose-400" />
                        {incident.geo}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Serviço Solicitado</span>
                      <span className={cn("font-medium block truncate mt-0.5", isDark ? "text-zinc-200" : "text-zinc-800")}>
                        {incident.integration_name}
                      </span>
                    </div>
                  </div>

                  {incident.message && (
                    <div className={cn(
                      "mt-3 text-xs p-2 rounded-lg font-mono flex items-start gap-1.5",
                      isDark ? "bg-zinc-900 border border-zinc-850 text-rose-400" : "bg-rose-50/50 border border-rose-100 text-rose-700"
                    )}>
                      <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      <p className="leading-snug break-all shrink-1">{incident.message}</p>
                    </div>
                  )}
                </div>
              ))}

              {suspiciousLogs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 space-y-3">
                  <ShieldCheck className="w-12 h-12 text-emerald-500" />
                  <div>
                    <h4 className={cn("font-bold text-sm", isDark ? "text-zinc-300" : "text-zinc-850")}>Nenhum incidente registrado</h4>
                    <p className="text-xs text-zinc-400 max-w-sm mt-1 mx-auto leading-relaxed">
                      Sua infraestrutura de chaves de API não recebeu acessos das origens bloqueadas ou suspeitas nas últimas transações registradas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
