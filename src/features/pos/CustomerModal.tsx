import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Search,
  UserPlus,
  Coins,
  Phone,
  CreditCard,
  Percent,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { sound } from '../../lib/sound';
import type { Customer } from '../../types';

interface CustomerModalProps {
  onClose: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ onClose }) => {
  const { customers, selectedCustomer, setSelectedCustomer, saveCustomer, setOrderDiscountPercent } = usePOS();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // New customer form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('+7 ');
  const [newCard, setNewCard] = useState('');
  const [newDiscount, setNewDiscount] = useState('5');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.cardNumber && c.cardNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (cust: Customer) => {
    setSelectedCustomer(cust);
    if (cust.discountPercent > 0) {
      setOrderDiscountPercent(cust.discountPercent);
    }
    sound.playKeypadClick();
    onClose();
  };

  const handleRemove = () => {
    setSelectedCustomer(null);
    setOrderDiscountPercent(0);
    sound.playKeypadClick();
    onClose();
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const created = await saveCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      cardNumber: newCard.trim() || `VIP-${Math.floor(1000 + Math.random() * 9000)}`,
      bonusPoints: 100, // welcome bonus
      discountPercent: parseFloat(newDiscount) || 0,
      totalSpent: 0,
    });

    handleSelect(created);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-sm">Программа лояльности & Клиент</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currently attached customer status */}
        {selectedCustomer && (
          <div className="bg-blue-50 dark:bg-blue-950/40 p-4 border-b border-blue-200 dark:border-blue-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-xs text-blue-950 dark:text-blue-200">{selectedCustomer.name}</div>
                <div className="text-[11px] text-blue-700 dark:text-blue-400">
                  {selectedCustomer.phone} • {selectedCustomer.bonusPoints} бонусов • Скидка {selectedCustomer.discountPercent}%
                </div>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="text-xs bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-800 hover:bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg font-bold"
            >
              Отвязать
            </button>
          </div>
        )}

        <div className="p-4 overflow-y-auto space-y-4">
          
          {!isCreating ? (
            <>
              {/* Search input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Поиск по имени, телефону или номеру карты..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Новый</span>
                </button>
              </div>

              {/* Customers list */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Покупатели не найдены
                  </div>
                ) : (
                  filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedCustomer?.id === c.id
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">{c.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{c.phone}</span>
                            {c.cardNumber && <span>• {c.cardNumber}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Coins className="w-3 h-3" />
                            <span>{c.bonusPoints} б.</span>
                          </div>
                          {c.discountPercent > 0 && (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              -{c.discountPercent}% скидка
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-blue-600">Выбрать</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Quick Customer Creation Form */
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  Быстрая регистрация покупателя
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Вернуться к списку
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  ФИО покупателя:
                </label>
                <input
                  type="text"
                  placeholder="Иван Петров"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Номер телефона:
                </label>
                <input
                  type="text"
                  placeholder="+7 (999) 000-00-00"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  required
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Номер карты (штрихкод):
                  </label>
                  <input
                    type="text"
                    placeholder="VIP-5544"
                    value={newCard}
                    onChange={(e) => setNewCard(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Скидка постоянная (%):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                🎁 Новому клиенту автоматически будет начислено 100 приветственных бонусов!
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Зарегистрировать и привязать
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
