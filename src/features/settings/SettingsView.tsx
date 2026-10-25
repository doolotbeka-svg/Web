import React, { useState } from 'react';
import {
  Settings,
  Store as StoreIcon,
  Globe,
  DollarSign,
  Volume2,
  Printer,
  Moon,
  Sun,
  Shield,
  RotateCcw,
  CheckCircle,
  Barcode,
  History,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { sound } from '../../lib/sound';

export const SettingsView: React.FC = () => {
  const {
    currentStore,
    stores,
    users,
    currentUser,
    settings,
    updateSettings,
    setLanguage,
    setCurrency,
    resetDatabase,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'general' | 'stores' | 'hardware' | 'backup'>('general');
  const [resetDone, setResetDone] = useState(false);
  const [testBarcode, setTestBarcode] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  const CURRENCIES = [
    { code: 'RUB', symbol: '₽', label: 'Российский рубль (RUB)' },
    { code: 'USD', symbol: '$', label: 'Доллар США (USD)' },
    { code: 'EUR', symbol: '€', label: 'Евро (EUR)' },
    { code: 'KZT', symbol: '₸', label: 'Казахстанский тенге (KZT)' },
    { code: 'KGS', symbol: 'сом', label: 'Кыргызский сом (KGS)' },
    { code: 'UZS', symbol: 'сум', label: 'Узбекский сум (UZS)' },
  ];

  const handleTestScan = () => {
    if (testBarcode.trim()) {
      sound.playScanBeep();
      setTestResult(`Успешно прочитан код: [${testBarcode.trim()}]`);
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  const handleResetData = async () => {
    if (confirm('Внимание! Все локальные данные (чеки, остатки) будут сброшены к начальному демонстрационному каталогу. Продолжить?')) {
      await resetDatabase();
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Top Header */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Настройки системы OmniPOS</h3>
            <span className="text-[11px] text-slate-400">Параметры кассы, принтера, валюты и складов</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'general'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Основные
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'hardware'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Оборудование
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'stores'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Магазины
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'backup'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            База & Сброс
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
        
        {/* TAB 1: General */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            
            {/* Currency */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>Основная валюта расчётов</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                      settings.currency === c.code
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{c.code} ({c.symbol})</span>
                    {settings.currency === c.code && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Language & Theme */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Тема оформления интерфейса</h4>
                  <p className="text-[11px] text-slate-400">Оптимизирована для ярких торговых залов и ночных смен</p>
                </div>
                <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => updateSettings({ theme: 'light' })}
                    className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      settings.theme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Светлая</span>
                  </button>
                  <button
                    onClick={() => updateSettings({ theme: 'dark' })}
                    className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      settings.theme === 'dark' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-blue-400" />
                    <span>Тёмная</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Звуковое сопровождение (Web Audio API)</h4>
                  <p className="text-[11px] text-slate-400">Звук сканера, колокольчик кассы и сигналы ошибок</p>
                </div>
                <button
                  onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    settings.soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {settings.soundEnabled ? 'Включено' : 'Выключено'}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Hardware */}
        {activeTab === 'hardware' && (
          <div className="space-y-4">
            
            {/* Thermal Printer Settings */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Printer className="w-4 h-4 text-blue-500" />
                <span>Термопринтер чеков & ESC/POS</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateSettings({ printerWidth: '80mm' })}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    settings.printerWidth === '80mm'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs">Стандартный рулон 80 мм</span>
                  <span className="text-[10px] opacity-75">Широкая термолента (42-48 символов в строке)</span>
                </button>

                <button
                  onClick={() => updateSettings({ printerWidth: '58mm' })}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    settings.printerWidth === '58mm'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs">Узкий рулон 58 мм</span>
                  <span className="text-[10px] opacity-75">Компактная лента (32 символа в строке)</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Автоматическая печать чека после оплаты</h4>
                  <p className="text-[11px] text-slate-400">Открывает диалог печати сразу после подтверждения транзакции</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoPrintReceipt}
                  onChange={(e) => updateSettings({ autoPrintReceipt: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Импульс открытия денежного ящика (ESC p)</h4>
                  <p className="text-[11px] text-slate-400">Посылает сигнал 24V на RJ-11 порт принтера при оплате наличными</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.openCashDrawerOnSale}
                  onChange={(e) => updateSettings({ openCashDrawerOnSale: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </div>
            </div>

            {/* Barcode scanner test area */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Barcode className="w-4 h-4 text-indigo-500" />
                <span>Тестирование и калибровка сканера штрихкодов</span>
              </div>
              <p className="text-xs text-slate-500">
                Подключите ваш USB или Bluetooth сканер штрихкодов. При считывании код должен появиться ниже и издать звуковой сигнал.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Отсканируйте любой штрихкод сюда..."
                  value={testBarcode}
                  onChange={(e) => setTestBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTestScan()}
                  className="flex-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                />
                <button
                  type="button"
                  onClick={handleTestScan}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Проверить скан
                </button>
              </div>

              {testResult && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-700">
                  {testResult}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: Stores */}
        {activeTab === 'stores' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Торговые точки и филиалы сети ({stores.length})
              </h4>
              <div className="space-y-2">
                {stores.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      currentStore?.id === s.id
                        ? 'bg-blue-50/70 border-blue-500 dark:bg-blue-950/40'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{s.name}</span>
                        {currentStore?.id === s.id && (
                          <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded">
                            Активная
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {s.address} • Тел: {s.phone} • ИНН: {s.taxNumber}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-500">{s.code}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Reset Database */}
        {activeTab === 'backup' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Сброс и восстановление демонстрационных данных</span>
              </div>
              <p className="text-xs text-slate-500">
                OmniPOS работает полностью автономно в вашем браузере с использованием высокопроизводительной базы данных IndexedDB (Dexie.js). Вы можете в любой момент сбросить каталог, чеки и склады к исходному идеальному состоянию.
              </p>

              {resetDone && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-700">
                  ✓ База данных успешно инициализирована заново!
                </div>
              )}

              <button
                onClick={handleResetData}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Сбросить локальную базу к демо-состоянию</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
