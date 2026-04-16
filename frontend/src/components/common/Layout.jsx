import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden" style={{ background: 'var(--bg-app)' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 min-h-0 h-[calc(100vh-60px)] overflow-hidden flex flex-col p-3 md:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
