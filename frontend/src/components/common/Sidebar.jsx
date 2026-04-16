import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getInitials, getAvatarColor } from '../../utils/helpers';

const LANGUAGES = [
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
];

const navGroups = [
  {
    category: 'general',
    items: [
      { path: '/dashboard', label: 'dashboard', screen: 'dashboard', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>) },
    ]
  },
  {
    category: 'sales',
    items: [
      { path: '/leads', label: 'leads', screen: 'leads', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>) },
      { path: '/deals', label: 'deals', screen: 'deals', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
      { path: '/accounts', label: 'accounts', screen: 'accounts', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>) },
      { path: '/contacts', label: 'contacts', screen: 'contacts', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>) },
    ]
  },
  {
    category: 'productivity',
    items: [
      { path: '/tasks', label: 'tasks', screen: 'tasks', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>) },
      { path: '/projects', label: 'projects', screen: 'projects', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>) },
      { path: '/calendar', label: 'calendar', screen: 'calendar', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>) },
    ]
  },
  {
    category: 'communication',
    items: [
      { path: '/calls', label: 'calls', screen: 'calls', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>) },
      { path: '/emails', label: 'emails', screen: 'emails', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>) },
      { path: '/meetings', label: 'meetings', screen: 'meetings', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>) },
      { path: '/email-templates', label: 'emailTemplates', screen: 'email-templates', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>) },
    ]
  },
  {
    category: 'support',
    items: [
      { path: '/tickets', label: 'tickets', screen: 'tickets', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>) },
    ]
  },
  {
    category: 'administration',
    items: [
      { path: '/audit-logs', label: 'auditLogs', screen: 'activities', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>) },
      { path: '/users', label: 'users', screen: 'users', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>) },
      { path: '/roles', label: 'roles', screen: 'roles', icon: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>) },
    ]
  }
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const userRole = user?.role;
  let userPermissions = [];
  if (userRole?.permissions) {
    userPermissions = userRole.permissions;
    if (userPermissions.includes('activities')) {
      userPermissions = Array.from(new Set([...userPermissions, 'calls', 'emails', 'meetings']));
    }
    // Grant access to new modules for admin-level roles
    if (userPermissions.includes('users')) {
      userPermissions = Array.from(new Set([...userPermissions, 'projects', 'calendar', 'email-templates']));
    }
  } else if (!userRole) {
    userPermissions = ['dashboard'];
  }

  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => userPermissions.includes(item.screen))
  })).filter(group => group.items.length > 0);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-56 flex flex-col transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto shadow-2xl lg:shadow-none border-r`}
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--sidebar-border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-500/20">DS</div>
          <div>
            <div className="font-semibold text-xs leading-none tracking-widest" style={{ color: 'var(--navbar-text)' }}>Do Systems</div>
            <div className="text-blue-400/60 text-[9px] font-medium tracking-tighter mt-1">CRM Platform</div>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden" style={{ color: 'var(--sidebar-text)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredGroups.map((group, gIdx) => (
            <div key={group.category} className="space-y-0">
              {group.category !== 'general' && (
                <div className="px-2 py-1 mt-1 text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-80 flex items-center gap-1.5">
                  <span>{group.category}</span>
                  <div className="h-[1px] flex-1 bg-gray-200/10"></div>
                </div>
              )}
              <div className="space-y-0">
                {group.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className="flex items-center gap-2 px-2 py-1 rounded-md text-[9.5px] font-semibold tracking-wider transition-all duration-150 group"
                    style={({ isActive }) => ({
                      background: isActive ? 'var(--sidebar-active)' : 'transparent',
                      color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                    })}
                  >
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity transform scale-90 origin-left">
                      {React.cloneElement(item.icon, { className: "w-3.5 h-3.5" })}
                    </span>
                    <span style={{ color: 'inherit' }}>{t(item.label)}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {/* Misc Group */}
          <div className="space-y-0 pt-1">
            <div className="px-2 py-1 text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-80 flex items-center gap-1.5">
              <span>System</span>
              <div className="h-[1px] flex-1 bg-gray-200/10"></div>
            </div>
            <NavLink
              to="/settings"
              onClick={onClose}
              className="flex items-center gap-2 px-2 py-1 rounded-md text-[9.5px] font-bold tracking-wider transition-all duration-150 group"
              style={({ isActive }) => ({
                background: isActive ? 'var(--sidebar-active)' : 'transparent',
                color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
              })}
            >
              <span className="opacity-70 group-hover:opacity-100 transition-opacity transform scale-90 origin-left">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              {t('settings')}
            </NavLink>
            <NavLink
              to="/version-history"
              onClick={onClose}
              className="flex items-center gap-2 px-2 py-1 rounded-md text-[9.5px] font-bold tracking-wider transition-all duration-150 group"
              style={({ isActive }) => ({
                background: isActive ? 'var(--sidebar-active)' : 'transparent',
                color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
              })}
            >
              <span className="opacity-70 group-hover:opacity-100 transition-opacity transform scale-90 origin-left">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              {t('versionHistory')}
            </NavLink>
          </div>
        </nav>

        {/* Footer: theme + language + user */}
        <div className="px-2 py-2 border-t space-y-1.5" style={{ borderColor: 'var(--sidebar-border)' }}>
          {/* Controls row */}
          <div className="flex items-center gap-1.5 px-0.5">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              className="flex items-center justify-center w-6 h-6 rounded-md transition-all border shrink-0"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--sidebar-border)' }}
            >
              {theme === 'dark' ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>

            {/* Language selector */}
            <div className="flex gap-0.5 flex-1 p-0.5 rounded-md border" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--sidebar-border)' }}>
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => i18n.changeLanguage(lang.code)}
                  title={lang.label}
                  className={`flex-1 text-[8px] font-bold py-1 rounded transition-all
                    ${i18n.language === lang.code ? 'bg-blue-600 text-white' : 'text-blue-200/50 hover:text-white hover:bg-white/10'}`}>
                  {lang.flag}
                </button>
              ))}
            </div>
          </div>

          {/* User */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer border shadow-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)' }}>
            <div className={`w-7 h-7 rounded-full ${getAvatarColor(user?.name)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold truncate leading-none mb-0.5" style={{ color: 'var(--navbar-text)' }}>{user?.name}</p>
              <p className="text-[8px] truncate capitalize font-normal opacity-60" style={{ color: 'var(--sidebar-text)' }}>{typeof userRole === 'string' ? userRole : userRole?.name}</p>
            </div>
            <button onClick={handleLogout} title="Logout" className="transition-colors opacity-50 hover:opacity-100" style={{ color: 'var(--sidebar-text)' }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
