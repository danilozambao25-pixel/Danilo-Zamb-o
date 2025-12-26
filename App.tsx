
import React, { useState, useEffect } from 'react';
import { UserRole, BusRoute, UserProfile, LatLng, IncidentType, DriverProfile } from './types';
import BusMap from './components/BusMap';
import QRCodeGenerator from './components/QRCodeGenerator';
import { generateIncidentSummary } from './services/geminiService';
import { fetchBestRoute } from './services/routingService';

// Constante para o caminho do logo - você pode substituir por um caminho local ou URL definitiva
const APP_LOGO_URL = "https://i.postimg.cc/8P6S6Q6h/meu-onibus-logo.png"; 

const INITIAL_ROUTES: BusRoute[] = [
  {
    id: 'route-1',
    name: 'Linha Azul - Centro / Vila Olimpia',
    companyId: 'comp-1',
    companyName: 'TransExpress',
    points: [{ lat: -23.59, lng: -46.68 }, { lat: -23.61, lng: -46.70 }],
    geometry: [{ lat: -23.59, lng: -46.68 }, { lat: -23.595, lng: -46.685 }, { lat: -23.61, lng: -46.70 }],
    status: 'NORMAL',
    qrCodeData: 'meuonibus://route/1',
    isOffRoute: false
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'LOGIN' | 'DASHBOARD'>('LOGIN');
  const [routes, setRoutes] = useState<BusRoute[]>(INITIAL_ROUTES);
  const [drivers, setDrivers] = useState<DriverProfile[]>([
    { id: 'drv-1', name: 'Carlos Oliveira', email: 'carlos@bus.com', companyId: 'comp-1' }
  ]);
  
  const [selectedRouteId, setSelectedRouteId] = useState<string>(INITIAL_ROUTES[0].id);
  const [busLocation, setBusLocation] = useState<LatLng | undefined>(INITIAL_ROUTES[0].points[0]);
  const [nextPoint, setNextPoint] = useState<LatLng | undefined>(INITIAL_ROUTES[0].points[1]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRouteRunning, setIsRouteRunning] = useState(false);
  
  const [newRouteName, setNewRouteName] = useState('');
  const [newPoints, setNewPoints] = useState<LatLng[]>([]);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverEmail, setNewDriverEmail] = useState('');

  const activeRoute = routes.find(r => r.id === selectedRouteId);

  useEffect(() => {
    if (currentView === 'DASHBOARD' && activeRoute && isRouteRunning && !isCreating) {
      const path = activeRoute.geometry || activeRoute.points;
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % path.length;
        setBusLocation(path[index]);
        setNextPoint(path[(index + 1) % path.length]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentView, activeRoute, isCreating, isRouteRunning]);

  const handleLogin = (role: UserRole) => {
    const mockUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: role === UserRole.COMPANY ? 'Empresa TransExpress' : (role === UserRole.DRIVER ? 'Motorista Carlos' : 'Passageiro João'),
      email: 'user@example.com',
      role: role,
      favoriteRoutes: role === UserRole.USER ? [INITIAL_ROUTES[0].id] : [],
      companyId: 'comp-1'
    };
    setUser(mockUser);
    setCurrentView('DASHBOARD');
  };

  const saveNewRoute = async () => {
    if (!newRouteName || newPoints.length < 2) return alert("Preencha o nome e marque pontos.");
    setIsOptimizing(true);
    const geometry = await fetchBestRoute(newPoints);
    const routeId = isEditing ? selectedRouteId : `route-${Date.now()}`;
    const newRoute: BusRoute = {
      id: routeId,
      name: newRouteName,
      companyId: user?.companyId || 'comp-1',
      companyName: user?.name || 'Empresa',
      points: newPoints,
      geometry,
      status: 'NORMAL',
      qrCodeData: `meuonibus://route/${routeId}`,
      isOffRoute: false
    };
    if (isEditing) setRoutes(routes.map(r => r.id === routeId ? newRoute : r));
    else setRoutes([...routes, newRoute]);
    
    setSelectedRouteId(routeId);
    setIsOptimizing(false);
    setIsCreating(false);
    setIsEditing(false);
    setNewPoints([]);
    setNewRouteName('');
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName || !newDriverEmail) return;
    const driver: DriverProfile = { id: `drv-${Date.now()}`, name: newDriverName, email: newDriverEmail, companyId: user?.companyId || 'comp-1' };
    setDrivers([...drivers, driver]);
    setNewDriverName(''); setNewDriverEmail('');
  };

  const startEdit = (route: BusRoute) => {
    setNewRouteName(route.name);
    setNewPoints(route.points);
    setIsEditing(true);
    setIsCreating(true);
  };

  const reportIncident = async (type: string, description: string) => {
    const summary = await generateIncidentSummary(type, description);
    setAlertMessage(summary || "Ocorreu um incidente na linha. Por favor, verifique o mapa para atualizações em tempo real.");
    if (selectedRouteId) {
      setRoutes(prev => prev.map(r => 
        r.id === selectedRouteId ? { ...r, status: 'DELAYED' } : r
      ));
    }
  };

  if (currentView === 'LOGIN') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-600/10 rounded-full blur-[120px]"></div>

        <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700 relative z-10">
          <div className="mb-6 group">
            <div className="relative inline-block">
               {/* Brilho atrás do logo */}
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full group-hover:bg-blue-500/30 transition-all duration-500"></div>
              <img 
                src={APP_LOGO_URL} 
                alt="Meu Ônibus Logo" 
                className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-10 drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  // Fallback caso a imagem não carregue
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.querySelector('.fallback-logo')?.classList.remove('hidden');
                }}
              />
              <div className="fallback-logo hidden bg-blue-600/20 p-8 rounded-[2.5rem] inline-block ring-1 ring-blue-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="text-blue-500 w-24 h-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v9c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
              </div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tight">
            <span className="text-blue-500">Meu</span> <span className="text-green-600">Ônibus</span>
          </h1>
          <p className="text-slate-400 font-medium tracking-wide">Ecossistema de transporte inteligente</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl relative z-10">
          {[
            { role: UserRole.COMPANY, title: 'Empresa', desc: 'Gestão de frotas e motoristas', color: 'blue' },
            { role: UserRole.DRIVER, title: 'Motorista', desc: 'Controle de rotas e incidentes', color: 'emerald' },
            { role: UserRole.USER, title: 'Passageiro', desc: 'Acompanhamento em tempo real', color: 'indigo' }
          ].map((item) => (
            <button 
              key={item.role}
              onClick={() => handleLogin(item.role)}
              className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2.5rem] text-left hover:border-slate-600 hover:bg-slate-800 transition-all group flex flex-col justify-between h-full shadow-xl"
            >
              <div>
                <div className={`w-12 h-12 bg-${item.color}-500/10 rounded-2xl flex items-center justify-center text-${item.color}-500 mb-6 group-hover:scale-110 transition-transform shadow-inner`}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-white font-bold text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Acessar <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-12 text-slate-600 text-sm animate-pulse">Toque para selecionar seu perfil e entrar</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="bg-slate-900/70 backdrop-blur-xl border-b border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-[1001] shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => setCurrentView('DASHBOARD')}>
            <img src={APP_LOGO_URL} alt="Logo" className="w-12 h-12 object-contain drop-shadow-lg" />
            <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full scale-150 -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter leading-none">
              <span className="text-blue-500">Meu</span> <span className="text-green-600">Ônibus</span>
            </h2>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mt-1">Painel do {user?.role === UserRole.COMPANY ? 'Gestor' : (user?.role === UserRole.DRIVER ? 'Motorista' : 'Passageiro')}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <span className="block text-sm font-bold text-slate-200">{user?.name}</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{user?.email}</span>
          </div>
          <button onClick={() => setCurrentView('LOGIN')} className="p-3 bg-slate-800 border border-slate-700 rounded-2xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-screen-2xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-4 overflow-hidden shadow-2xl relative group">
               <div className="absolute top-8 left-8 z-[1001] bg-slate-900/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-700 flex items-center gap-3 shadow-2xl">
                 <div className={`w-3 h-3 rounded-full ${isRouteRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'} shadow-[0_0_15px_rgba(16,185,129,0.5)]`}></div>
                 <span className="text-xs font-black uppercase tracking-widest text-slate-200">
                   {isCreating ? 'Mapeando' : (isRouteRunning ? 'Em Tempo Real' : 'Monitoramento')}
                 </span>
               </div>
               <BusMap 
                route={activeRoute} 
                currentLocation={busLocation} 
                isDrawingMode={isCreating}
                isOptimizing={isOptimizing}
                onMapClick={(lat, lng) => setNewPoints([...newPoints, { lat, lng }])}
                previewPoints={newPoints}
                nextPoint={nextPoint}
              />
            </div>

            {user?.role === UserRole.USER && (
               <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                 <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                   <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                   </div>
                   Linhas Favoritas
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {routes.filter(r => user.favoriteRoutes.includes(r.id)).map(r => (
                     <div key={r.id} className="bg-slate-800/40 p-6 rounded-[2rem] border border-slate-800 flex justify-between items-center group hover:bg-slate-800/60 transition-all">
                       <div>
                         <span className="block font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{r.name}</span>
                         <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{r.companyName}</span>
                       </div>
                       <button onClick={() => { setSelectedRouteId(r.id); }} className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-5 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-blue-600 hover:text-white transition-all">Ativar</button>
                     </div>
                   ))}
                   {user.favoriteRoutes.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-950/50 rounded-[2rem] border border-dashed border-slate-800">
                      <p className="text-slate-500 font-medium italic">Você ainda não possui rotas favoritas.</p>
                      <p className="text-[10px] text-slate-600 uppercase font-black mt-2">Favorite uma linha para acesso rápido</p>
                    </div>
                   )}
                 </div>
               </div>
            )}

            {user?.role === UserRole.COMPANY && !isCreating && (
               <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                 <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/><path d="M6.5 18H20"/></svg>
                      </div>
                      Gestão de Frotas
                    </h3>
                    <button onClick={() => { setIsCreating(true); setIsEditing(false); setNewPoints([]); setNewRouteName(''); }} className="bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg> Nova Rota
                    </button>
                 </div>
                 <div className="space-y-4">
                    {routes.map(r => (
                      <div key={r.id} className="bg-slate-800/20 border border-slate-800 p-6 rounded-[2rem] flex items-center justify-between group hover:border-slate-700 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-110 transition-transform">
                             <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-5"/></svg>
                          </div>
                          <div>
                            <span className="block font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{r.name}</span>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{r.points.length} Pontos</span>
                              <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                              <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Ativa</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <button onClick={() => startEdit(r)} className="p-4 bg-slate-800 border border-slate-700 rounded-2xl text-slate-400 hover:text-white hover:border-slate-500 transition-all active:scale-90">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                           </button>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            {isCreating ? (
              <div className="bg-slate-900 border border-amber-500/30 rounded-[2.5rem] p-8 shadow-2xl sticky top-28 animate-in slide-in-from-right-10 duration-500">
                <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-white">
                  <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </div>
                  {isEditing ? 'Configurar Rota' : 'Novo Traçado'}
                </h3>
                <div className="space-y-6 mb-10">
                   <div className="group">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3 group-focus-within:text-amber-500 transition-colors">Identificação da Linha</label>
                      <input 
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-[1.5rem] p-5 text-white outline-none focus:border-amber-500 transition-all font-bold placeholder:text-slate-600"
                        placeholder="Ex: Fretado Comercial - Matriz"
                        value={newRouteName}
                        onChange={e => setNewRouteName(e.target.value)}
                      />
                   </div>
                   <div className="bg-amber-500/5 p-6 rounded-[2rem] border border-amber-500/10">
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        <strong className="text-amber-500 uppercase text-[10px] block mb-1 tracking-widest">Guia Rápido:</strong> 
                        Selecione pelo menos 2 pontos principais. Nossa inteligência de mapas calculará o trajeto seguindo as ruas.
                      </p>
                   </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={saveNewRoute} className="w-full bg-amber-500 text-slate-950 font-black py-5 rounded-[1.5rem] hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95 text-sm uppercase tracking-widest">Publicar Rota</button>
                  <button onClick={() => { setIsCreating(false); setIsEditing(false); setNewPoints([]); }} className="w-full bg-slate-800 text-slate-300 font-black py-5 rounded-[1.5rem] hover:bg-slate-700 transition-all text-sm uppercase tracking-widest">Descartar</button>
                </div>
              </div>
            ) : user?.role === UserRole.COMPANY ? (
              <div className="space-y-8 sticky top-28">
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                   <h3 className="text-2xl font-black mb-8 text-white flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                      </div>
                      Motoristas
                   </h3>
                   <form onSubmit={handleAddDriver} className="space-y-4">
                      <input className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-blue-500 font-medium transition-all" placeholder="Nome do motorista" value={newDriverName} onChange={e => setNewDriverName(e.target.value)} />
                      <input className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-blue-500 font-medium transition-all" placeholder="E-mail de acesso" value={newDriverEmail} onChange={e => setNewDriverEmail(e.target.value)} />
                      <button type="submit" className="w-full bg-slate-800 border border-slate-700 text-white font-black py-4 rounded-2xl hover:bg-blue-600 hover:border-blue-500 transition-all uppercase text-xs tracking-widest active:scale-95 shadow-lg">Cadastrar Equipe</button>
                   </form>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Equipe Registrada ({drivers.length})</h3>
                   <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {drivers.map(d => (
                        <div key={d.id} className="flex items-center gap-4 bg-slate-800/20 p-4 rounded-2xl border border-slate-800/50 group hover:border-emerald-500/30 transition-all">
                          <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 font-black shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-all">{d.name[0]}</div>
                          <div>
                            <span className="block font-bold text-sm text-white">{d.name}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{d.email}</span>
                          </div>
                        </div>
                      ))}
                      {drivers.length === 0 && <p className="text-slate-600 text-center py-4 text-xs italic">Nenhum motorista cadastrado.</p>}
                   </div>
                </div>
              </div>
            ) : user?.role === UserRole.DRIVER ? (
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 sticky top-28 shadow-2xl animate-in fade-in duration-500">
                <h3 className="text-2xl font-black mb-10 text-white border-b border-slate-800 pb-6 flex items-center justify-between">
                  Logística Ativa
                  <div className={`w-3 h-3 rounded-full ${isRouteRunning ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse' : 'bg-slate-700'}`}></div>
                </h3>
                
                <div className="space-y-8">
                   <div className="bg-slate-800/30 p-6 rounded-[2rem] border border-slate-800">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Selecione o Itinerário</label>
                      <select 
                        disabled={isRouteRunning}
                        className="w-full bg-slate-900 border-2 border-slate-700 rounded-[1.2rem] p-4 text-white outline-none focus:border-blue-500 disabled:opacity-50 font-bold transition-all appearance-none cursor-pointer"
                        value={selectedRouteId}
                        onChange={e => { setSelectedRouteId(e.target.value); setBusLocation(routes.find(r => r.id === e.target.value)?.points[0]); }}
                      >
                        {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                   </div>

                   {!isRouteRunning ? (
                     <button onClick={() => setIsRouteRunning(true)} className="w-full bg-emerald-600 text-white font-black py-6 rounded-[2rem] hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-4 active:scale-95 uppercase tracking-widest">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 3l14 9-14 9V3z"/></svg> Iniciar Viagem
                     </button>
                   ) : (
                     <div className="space-y-6 animate-in slide-in-from-bottom-6">
                        <button onClick={() => setIsRouteRunning(false)} className="w-full bg-red-600 text-white font-black py-6 rounded-[2rem] hover:bg-red-500 transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-4 active:scale-95 uppercase tracking-widest">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="6" y="6" width="12" height="12"/></svg> Encerrar Viagem
                        </button>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <button onClick={() => reportIncident('ACCIDENT', 'Acidente na pista')} className="flex flex-col items-center gap-3 bg-slate-800/60 p-7 rounded-[2rem] border border-slate-700 hover:border-red-500/50 hover:bg-red-500/5 transition-all group">
                              <svg xmlns="http://www.w3.org/2000/svg" className="text-red-500 group-hover:scale-110 transition-transform" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Acidente</span>
                           </button>
                           <button onClick={() => reportIncident('TRAFFIC', 'Trânsito muito lento')} className="flex flex-col items-center gap-3 bg-slate-800/60 p-7 rounded-[2rem] border border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group">
                              <svg xmlns="http://www.w3.org/2000/svg" className="text-amber-500 group-hover:scale-110 transition-transform" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trânsito</span>
                           </button>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 sticky top-28 shadow-2xl">
                 <h3 className="text-2xl font-black mb-10 text-white flex items-center justify-between">
                   Itinerários
                   <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                   </div>
                 </h3>
                 <div className="space-y-6">
                    <div className="bg-slate-800/30 p-6 rounded-[2rem] border border-slate-800">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-5">Selecione sua Linha</label>
                       <div className="space-y-3">
                          {routes.map(r => (
                            <button 
                              key={r.id} 
                              onClick={() => setSelectedRouteId(r.id)}
                              className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${selectedRouteId === r.id ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-600/20' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                            >
                               <span className={`font-bold text-sm ${selectedRouteId === r.id ? 'text-white' : 'text-slate-300'}`}>{r.name}</span>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); /* Logic to toggle favorite */ }}
                                 className={`${user?.favoriteRoutes.includes(r.id) ? 'text-amber-400 shadow-amber-400/20 shadow-xl' : 'text-slate-700 group-hover:text-slate-500'} hover:scale-125 transition-all`}
                               >
                                 <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                               </button>
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="bg-indigo-600/5 border border-indigo-500/10 p-7 rounded-[2.5rem] flex items-center gap-6 shadow-inner">
                       <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                       </div>
                       <div>
                          <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Status da Operação</span>
                          <span className="text-xl font-bold text-white tracking-tight">{isRouteRunning ? 'Em Trânsito' : 'Em Garagem'}</span>
                       </div>
                    </div>
                 </div>
              </div>
            )}
            
            {alertMessage && (
              <div className="bg-amber-500 text-slate-950 p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-500 border border-amber-400/30 relative overflow-hidden">
                {/* Ícone de aviso de fundo */}
                <div className="absolute right-[-20px] bottom-[-20px] text-slate-950/5 opacity-10">
                   <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                </div>
                
                <div className="flex items-center gap-5 mb-5 relative z-10">
                   <div className="bg-slate-950/10 p-3 rounded-2xl shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                   </div>
                   <h4 className="font-black uppercase tracking-widest text-sm">Alerta de Operação</h4>
                </div>
                <p className="font-bold text-lg leading-relaxed mb-6 relative z-10">{alertMessage}</p>
                <button onClick={() => setAlertMessage(null)} className="w-full text-xs font-black uppercase bg-slate-950 text-white py-4 rounded-2xl hover:bg-slate-900 transition-all shadow-xl active:scale-95 relative z-10">Entendi, manter acompanhamento</button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="border-t border-slate-900 py-12 px-10 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
        <div className="flex items-center gap-4">
          <img src={APP_LOGO_URL} alt="Mini Logo" className="w-8 h-8 grayscale contrast-125" />
          <p className="text-sm font-bold tracking-tight">© 2024 <span className="text-blue-500">Meu</span> <span className="text-green-600">Ônibus</span> - Mobilidade Urbana Inteligente</p>
        </div>
        <div className="flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em]">
           <a href="#" className="hover:text-blue-400 transition-colors">Termos de Uso</a>
           <a href="#" className="hover:text-green-500 transition-colors">Canal de Ajuda</a>
           <a href="#" className="hover:text-white transition-colors">Portal da Empresa</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
