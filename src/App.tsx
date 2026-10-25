/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/PinLogin';
import { POSView } from './features/pos/POSView';
import { ProductsView } from './features/products/ProductsView';
import { SalesView } from './features/sales/SalesView';
import { InventoryView } from './features/inventory/InventoryView';
import { ReportsView } from './features/reports/ReportsView';
import { SettingsView } from './features/settings/SettingsView';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, currentUser } = usePOS();

  // Reports and settings are admin-only; leave them when switching to a cashier
  const isAdmin = currentUser?.role === 'ADMIN';
  const isAdminTab = activeTab === 'reports' || activeTab === 'settings';
  useEffect(() => {
    if (currentUser && !isAdmin && isAdminTab) setActiveTab('pos');
  }, [currentUser, isAdmin, isAdminTab, setActiveTab]);

  if (!currentUser) return <LoginScreen />;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <Navbar />
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'pos' && <POSView />}
        {activeTab === 'products' && <ProductsView />}
        {activeTab === 'sales' && <SalesView />}
        {activeTab === 'inventory' && <InventoryView />}
        {isAdmin && activeTab === 'reports' && <ReportsView />}
        {isAdmin && activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <MainLayout />
    </POSProvider>
  );
}
