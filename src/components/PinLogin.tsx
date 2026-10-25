import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { usePOS } from '../context/POSContext';

interface PinFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// PIN entry for one user; used by the login screen and the user switcher
export const PinForm: React.FC<PinFormProps> = ({ userId, onSuccess, onCancel }) => {
  const { users, switchUser } = usePOS();
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const user = users.find((u) => u.id === userId);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (await switchUser(userId, pinInput)) {
          onSuccess();
        } else {
          setPinError(true);
          setPinInput('');
        }
      }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xs shadow-2xl p-5 space-y-4 text-slate-900 dark:text-white"
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-bold text-sm flex items-center gap-2 min-w-0">
          <Lock className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="truncate">{user?.name || 'Вход'}</span>
        </h4>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1 shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        maxLength={8}
        value={pinInput}
        onChange={(e) => {
          setPinInput(e.target.value.replace(/\D/g, ''));
          setPinError(false);
        }}
        placeholder="ПИН-код"
        className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5"
      />
      {pinError && (
        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 text-center">Неверный ПИН-код</div>
      )}
      <button
        type="submit"
        disabled={!pinInput}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold"
      >
        Войти
      </button>
    </form>
  );
};

// Shown while nobody is signed in
export const LoginScreen: React.FC = () => {
  const { users, stores } = usePOS();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900 p-4">
      {selectedUserId ? (
        <PinForm userId={selectedUserId} onSuccess={() => setSelectedUserId(null)} onCancel={() => setSelectedUserId(null)} />
      ) : (
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center">
            <div className="text-2xl font-black text-white">OmniPOS</div>
            <div className="text-xs text-slate-400 mt-1">Выберите пользователя для входа</div>
          </div>
          {users.length === 0 ? (
            <div className="text-center text-xs text-slate-500">Загрузка...</div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className="w-full text-left px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm text-white flex items-center justify-between gap-3 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{u.name}</span>
                    {u.role === 'CASHIER' && stores.some((st) => st.id === u.storeId) && (
                      <span className="block text-[11px] text-slate-400 truncate">
                        {stores.find((st) => st.id === u.storeId)?.name}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-black/30 text-slate-300 shrink-0">
                    {u.role === 'ADMIN' ? 'Админ' : 'Кассир'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
