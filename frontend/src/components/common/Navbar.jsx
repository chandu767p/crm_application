import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NotificationBell from './NotificationBell';

const PAGE_KEYS = {
  '/dashboard': 'dashboard', '/leads': 'leads', '/contacts': 'contacts',
  '/users': 'users', '/accounts': 'accounts', '/roles': 'roles',
  '/calls': 'calls', '/meetings': 'meetings', '/tasks': 'tasks',
  '/emails': 'emails', '/deals': 'deals', '/tickets': 'tickets',
  '/projects': 'projects', '/calendar': 'calendar',
  '/email-templates': 'emailTemplates', '/version-history': 'versionHistory',
};

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const { t } = useTranslation();
  const key = PAGE_KEYS[location.pathname] || 'dashboard';

  return (
    <header
      className="h-[52px] border-b flex items-center px-4 gap-3 flex-shrink-0 sticky top-0 z-30"
      style={{ background: 'var(--bg-navbar)', borderColor: 'var(--border-color)' }}
    >
      <button onClick={onMenuClick} className="lg:hidden p-1.5 rounded-lg transition-colors" style={{ color: 'var(--navbar-text)' }} aria-label="Open menu">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <h1 className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--navbar-text)' }}>
        {t(key)}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-[10px] font-medium tracking-widest hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
          {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}
        </span>
        <NotificationBell />
      </div>
    </header>
  );
}
