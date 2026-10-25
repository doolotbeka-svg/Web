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
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  Users,
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
    saveStore,
    deleteStore,
    updateUserPin,
    addCashier,
    deleteCashier,
    updateCashierStore,
    renameUser,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'general' | 'stores' | 'users' | 'hardware' | 'backup'>('general');

  // Store form (add / edit)
  const emptyStoreForm = { id: '', name: '', code: '', address: '', phone: '', taxNumber: '' };
  const [storeForm, setStoreForm] = useState(emptyStoreForm);
  const [storeMessage, setStoreMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // PIN changes
  const [pinDrafts, setPinDrafts] = useState<Record<string, string>>({});
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  const [pinMessage, setPinMessage] = useState<{ userId: string; ok: boolean; text: string } | null>(null);

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeForm.name.trim()) return;
    await saveStore({ ...storeForm, id: storeForm.id || undefined });
    setStoreMessage({ ok: true, text: storeForm.id ? 'Магазин сохранён' : 'Магазин добавлен' });
    setStoreForm(emptyStoreForm);
  };

  const handleDeleteStore = async (storeId: string, name: string) => {
    if (!confirm(`Удалить магазин «${name}»? Остатки товаров в нём будут удалены, история чеков сохранится.`)) return;
    const error = await deleteStore(storeId);
    setStoreMessage(error ? { ok: false, text: error } : { ok: true, text: `Магазин «${name}» удалён` });
    if (!error && storeForm.id === storeId) setStoreForm(emptyStoreForm);
  };

  // New cashier
  const [cashierName, setCashierName] = useState('');
  const [cashierPin, setCashierPin] = useState('');
  const [cashierStore, setCashierStore] = useState('');
  const [userMessage, setUserMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleAddCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = await addCashier(cashierName, cashierPin, cashierStore);
    setUserMessage(error ? { ok: false, text: error } : { ok: true, text: `Кассир «${cashierName.trim()}» добавлен` });
    if (!error) {
      setCashierName('');
      setCashierPin('');
    }
  };

  const handleDeleteCashier = async (userId: string, name: string) => {
    if (!confirm(`Удалить кассира «${name}»? История его чеков сохранится.`)) return;
    const error = await deleteCashier(userId);
    setUserMessage(error ? { ok: false, text: error } : { ok: true, text: `Кассир «${name}» удалён` });
  };

  const handleSavePin = async (userId: string) => {
    const error = await updateUserPin(userId, pinDrafts[userId] || '');
    setPinMessage(error ? { userId, ok: false, text: error } : { userId, ok: true, text: 'ПИН-код изменён' });
    if (!error) setPinDrafts((prev) => ({ ...prev, [userId]: '' }));
  };
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
    if (confirm('Внимание! Все локальные данные (товары, чеки, остатки) будут удалены, база вернётся к начальному состоянию с пустым каталогом. Продолжить?')) {
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
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Пользователи
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
            <form
              onSubmit={handleSaveStore}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
            >
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                {storeForm.id ? <Edit2 className="w-4 h-4 text-blue-500" /> : <Plus className="w-4 h-4 text-blue-500" />}
                {storeForm.id ? 'Изменение магазина' : 'Новый магазин'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required placeholder="Название магазина" value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white sm:col-span-2" />
                <input placeholder="Адрес" value={storeForm.address} onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })} className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white" />
                <input placeholder="Телефон" value={storeForm.phone} onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })} className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white" />
                <input placeholder="ИНН" value={storeForm.taxNumber} onChange={(e) => setStoreForm({ ...storeForm, taxNumber: e.target.value })} className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white" />
                <input placeholder="Код (необязательно)" value={storeForm.code} onChange={(e) => setStoreForm({ ...storeForm, code: e.target.value })} className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono" />
              </div>
              <div className="flex justify-end gap-2">
                {storeForm.id && (
                  <button
                    type="button"
                    onClick={() => setStoreForm(emptyStoreForm)}
                    className="py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Отмена
                  </button>
                )}
                <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold">
                  {storeForm.id ? 'Сохранить' : 'Добавить магазин'}
                </button>
              </div>
            </form>

            {storeMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold border ${
                  storeMessage.ok
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-400'
                }`}
              >
                {storeMessage.text}
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Торговые точки и филиалы сети ({stores.length})
              </h4>
              <div className="space-y-2">
                {stores.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      currentStore?.id === s.id
                        ? 'bg-blue-50/70 border-blue-500 dark:bg-blue-950/40'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{s.name}</span>
                        {currentStore?.id === s.id && (
                          <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded shrink-0">
                            Активная
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {[s.address, s.phone && `Тел: ${s.phone}`, s.taxNumber && `ИНН: ${s.taxNumber}`].filter(Boolean).join(' • ') || 'Нет данных'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-mono text-xs font-bold text-slate-500 mr-1">{s.code}</span>
                      <button
                        onClick={() => {
                          setStoreForm({ id: s.id, name: s.name, code: s.code, address: s.address, phone: s.phone, taxNumber: s.taxNumber });
                          setStoreMessage(null);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        title="Изменить магазин"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStore(s.id, s.name)}
                        disabled={stores.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-30"
                        title="Удалить магазин"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Users & PIN codes */}
        {activeTab === 'users' && (
          <div className="space-y-4">
          <form
            onSubmit={handleAddCashier}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
          >
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-500" />
              Новый кассир
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                required
                placeholder="Имя кассира"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
              <input
                required
                type="password"
                inputMode="numeric"
                maxLength={8}
                placeholder="ПИН-код (4–8 цифр)"
                value={cashierPin}
                onChange={(e) => setCashierPin(e.target.value.replace(/\D/g, ''))}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono tracking-widest"
              />
              <select
                value={cashierStore}
                onChange={(e) => setCashierStore(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              >
                <option value="">Все магазины</option>
                {stores.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold">
                Добавить кассира
              </button>
            </div>
          </form>

          {userMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold border ${
                userMessage.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-400'
              }`}
            >
              {userMessage.text}
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Пользователи и ПИН-коды ({users.length})
            </h4>
            <p className="text-xs text-slate-500">
              Имя пользователя меняется прямо в списке. ПИН-код: от 4 до 8 цифр, у каждого пользователя свой.
            </p>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <input
                        value={nameDrafts[u.id] ?? u.name}
                        onChange={(e) => setNameDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                        onBlur={async () => {
                          const draft = nameDrafts[u.id];
                          if (draft !== undefined && draft !== u.name) {
                            const error = await renameUser(u.id, draft);
                            setUserMessage(error ? { ok: false, text: error } : { ok: true, text: `Имя изменено: «${draft.trim()}»` });
                          }
                          setNameDrafts((prev) => {
                            const { [u.id]: _, ...rest } = prev;
                            return rest;
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        title="Нажмите, чтобы изменить имя"
                        className="w-full font-bold text-xs bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 dark:hover:border-slate-700 rounded-lg px-1.5 py-1 -ml-1.5 text-slate-900 dark:text-white"
                      />
                      {u.role === 'CASHIER' && (
                        <select
                          value={stores.some((st) => st.id === u.storeId) ? u.storeId : ''}
                          onChange={(e) => updateCashierStore(u.id, e.target.value || undefined)}
                          className="mt-1 max-w-full text-[11px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300"
                          title="Магазин, в котором работает кассир"
                        >
                          <option value="">Все магазины</option>
                          {stores.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {u.role === 'ADMIN' ? 'Админ' : 'Кассир'}
                      </span>
                      {u.role === 'CASHIER' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCashier(u.id, u.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Удалить кассира"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSavePin(u.id);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={8}
                      placeholder="Новый ПИН-код"
                      value={pinDrafts[u.id] || ''}
                      onChange={(e) => setPinDrafts((prev) => ({ ...prev, [u.id]: e.target.value.replace(/\D/g, '') }))}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white flex-1 font-mono tracking-widest"
                    />
                    <button
                      type="submit"
                      disabled={!pinDrafts[u.id]}
                      className="py-2 px-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Сменить
                    </button>
                  </form>
                  {pinMessage?.userId === u.id && (
                    <div className={`text-xs font-semibold ${pinMessage.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {pinMessage.text}
                    </div>
                  )}
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
                <span>Сброс локальной базы данных</span>
              </div>
              <p className="text-xs text-slate-500">
                OmniPOS работает полностью автономно в вашем браузере с использованием высокопроизводительной базы данных IndexedDB (Dexie.js). Вы можете в любой момент сбросить каталог, чеки и склады к начальному состоянию (магазины и пользователи сохранятся, каталог будет пустым).
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
                <span>Сбросить локальную базу</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
