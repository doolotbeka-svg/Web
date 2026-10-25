import React, { useState, useEffect, useRef } from 'react';
import {
  Store as StoreIcon,
  User as UserIcon,
  ShoppingCart,
  Package,
  Receipt,
  Boxes,
  BarChart3,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Barcode,
  PauseCircle,
  Maximize,
  Minimize,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ShiftModal } from '../features/pos/ShiftModal';

export const Navbar: React.FC = () => {
  const {
    stores,
    currentStore,
    users,
    currentUser,
    currentShift,
    heldCarts,
    activeTab,
    setActiveTab,
    switchStore,
    switchUser,
    settings,
    toggleSound,
    toggleTheme,
    isOffline,
    isSyncing,
    addToCartByBarcode,
    restoreHeldCart,
    deleteHeldCart,
  } = usePOS();

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHeldMenuOpen, setIsHeldMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanFlash, setScanFlash] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Global hardware barcode scanner catcher
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in standard inputs or textareas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Fast typing typical of hardware laser/CCD barcode scanners (< 40ms)
      const now = Date.now();
      if (now - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          const success = addToCartByBarcode(buffer);
          if (success) {
            setScanFlash(true);
            setTimeout(() => setScanFlash(false), 600);
          }
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addToCartByBarcode]);

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const ok = addToCartByBarcode(barcodeInput.trim());
    if (ok) {
      setScanFlash(true);
      setTimeout(() => setScanFlash(false), 600);
      setBarcodeInput('');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Role permissions check
  const isAdminOrManager = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shrink-0 sticky top-0 z-40 shadow-md">
      <div className="px-3 lg:px-4 py-2 flex items-center justify-between gap-2 lg:gap-4 flex-wrap">
        
        {/* Left: Brand + Branch Selector */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-lg tracking-wider text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="font-bold tracking-tight text-base text-white">OmniPOS</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">Pro</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">v2.4 • Offline-First</span>
            </div>
          </div>

          {/* Branch Picker */}
          <div className="relative">
            <button
              onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-medium text-slate-200 transition-colors"
            >
              <StoreIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="max-w-[140px] truncate">{currentStore?.name.split('«')[1]?.replace('»', '') || currentStore?.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isStoreMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Выберите точку продаж
                </div>
                {stores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      switchStore(s.id);
                      setIsStoreMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex flex-col gap-0.5 transition-colors ${
                      currentStore?.id === s.id ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{s.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">{s.code}</span>
                    </div>
                    <span className="text-[10px] opacity-75 truncate">{s.address}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-800/70 p-1 rounded-xl border border-slate-700/60 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'pos'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Касса (F1)</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'products'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Товары</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'sales'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Чеки</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Склад</span>
          </button>

          {isAdminOrManager && (
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Отчёты</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>
        </nav>

        {/* Right side controls: Barcode Quick Search + Shift pill + User switch + Offline/Audio */}
        <div className="flex items-center gap-2">
          
          {/* Quick Barcode Scanner Input */}
          <form onSubmit={handleManualScan} className="relative hidden md:flex items-center">
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Штрихкод / Скан..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className={`w-36 lg:w-44 bg-slate-800/90 text-xs border pl-7 pr-7 py-1.5 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                scanFlash ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200' : 'border-slate-700'
              }`}
            />
            <Barcode className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
            {barcodeInput && (
              <button
                type="submit"
                className="absolute right-1 text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-1.5 py-0.5 rounded font-medium"
              >
                ↵
              </button>
            )}
          </form>

          {/* Held Carts Badge Button */}
          {heldCarts.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsHeldMenuOpen(!isHeldMenuOpen)}
                className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-1.5 rounded-lg text-xs font-semibold animate-pulse"
                title="Отложенные чеки"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>{heldCarts.length}</span>
              </button>

              {isHeldMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Отложенные чеки
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {heldCarts.map((h) => (
                      <div
                        key={h.id}
                        className="p-2 bg-slate-800 hover:bg-slate-750 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200">{h.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {h.items.length} поз. • {h.items.reduce((s, i) => s + i.totalPrice, 0).toFixed(0)} ₽
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              restoreHeldCart(h.id);
                              setIsHeldMenuOpen(false);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-[11px] font-medium"
                          >
                            Вернуть
                          </button>
                          <button
                            onClick={() => deleteHeldCart(h.id)}
                            className="text-red-400 hover:text-red-300 px-1 py-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shift status pill */}
          <button
            onClick={() => setIsShiftModalOpen(true)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
              currentShift
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                : 'bg-rose-950/60 text-rose-300 border-rose-800/80 hover:bg-rose-900/60'
            }`}
            title="Кассовая смена (X/Z отчеты, инкассация)"
          >
            <span className={`w-2 h-2 rounded-full ${currentShift ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {currentShift ? 'Смена открыта' : 'Смена закрыта'}
            </span>
          </button>

          {/* User / Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg text-slate-200"
            >
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-[10px]">
                {currentUser?.name.charAt(0) || 'U'}
              </div>
              <span className="max-w-[100px] truncate hidden sm:inline">
                {currentUser?.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono px-1 py-0.2 bg-slate-700/60 rounded">
                {currentUser?.role === 'ADMIN' ? 'Админ' : currentUser?.role === 'MANAGER' ? 'Управ' : 'Кассир'}
              </span>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Сменить профиль</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      currentUser?.id === u.id ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="truncate">{u.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">ПИН: {u.pinCode}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-black/20">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Offline / Sync Indicator */}
          <div
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1.5 rounded-lg border ${
              isOffline
                ? 'bg-amber-950/50 text-amber-400 border-amber-800/60'
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
            }`}
            title={isOffline ? 'Работа без интернета: чеки сохраняются в IndexedDB' : 'Синхронизировано'}
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            ) : isOffline ? (
              <WifiOff className="w-3.5 h-3.5" />
            ) : (
              <Wifi className="w-3.5 h-3.5" />
            )}
            <span className="hidden xl:inline">{isOffline ? 'Офлайн' : 'Онлайн'}</span>
          </div>

          {/* Quick Audio Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title={settings.soundEnabled ? 'Звук включен' : 'Звук выключен'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Fullscreen toggle for POS kiosks */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors hidden sm:block"
            title="Полноэкранный режим терминала"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Shift Modal */}
      {isShiftModalOpen && <ShiftModal onClose={() => setIsShiftModalOpen(false)} />}
    </header>
  );
};
