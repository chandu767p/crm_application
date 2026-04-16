import React from 'react';
import { useTranslation } from 'react-i18next';

const VERSIONS = [
  {
    version: 'v2.0.0',
    date: '2026-04-15',
    type: 'major',
    title: 'Advanced Feature Suite',
    changes: [
      { type: 'new', text: 'Two-Factor Authentication (TOTP / Google Authenticator)' },
      { type: 'new', text: 'Forgot Password / Email Reset Flow with Nodemailer' },
      { type: 'new', text: 'First-Login Forced Password Change' },
      { type: 'new', text: 'Employee Management Module with department tracking' },
      { type: 'new', text: 'Project Management Module with progress & budget' },
      { type: 'new', text: 'Email Templates Module with HTML editor and live preview' },
      { type: 'new', text: 'Calendar Module — month-grid view with event types' },
      { type: 'new', text: 'Saved Filters persisted to DB with per-module defaults' },
      { type: 'new', text: 'Dark / Light Theme Switcher with backend preference sync' },
      { type: 'new', text: 'Real-time Notifications via Socket.IO' },
      { type: 'new', text: 'Multi-language i18n (English, Spanish, French)' },
      { type: 'new', text: 'Activities Management enhancements: outcome & next-action date' },
    ],
  },
  {
    version: 'v1.5.0',
    date: '2026-04-13',
    type: 'minor',
    title: 'UI Standardization & Data Density',
    changes: [
      { type: 'improved', text: 'Centralized DataTable with column-level filters and drag-to-reorder' },
      { type: 'improved', text: 'Unified Search & Filter bar with toggle' },
      { type: 'improved', text: 'Dark/Blue SaaS theme applied globally' },
      { type: 'improved', text: 'Compact Kanban and Grid views in Deals/Leads' },
      { type: 'fix', text: 'CSV export headers with correct nested field resolution' },
      { type: 'fix', text: 'Z-index stacking standardized across all modals and sidebars' },
    ],
  },
  {
    version: 'v1.2.0',
    date: '2026-04-08',
    type: 'minor',
    title: 'RBAC & Soft Delete',
    changes: [
      { type: 'new', text: 'Role-Based Access Control (RBAC) via permissions array' },
      { type: 'new', text: 'Soft-delete on all core models with `active` flag' },
      { type: 'new', text: 'Bulk upload (CSV/XLSX) for Leads, Contacts, Accounts' },
      { type: 'improved', text: 'Lead source enum case-insensitive handling' },
      { type: 'fix', text: 'Bulk upload validation error for `source` field fixed' },
    ],
  },
  {
    version: 'v1.0.0',
    date: '2026-03-27',
    type: 'major',
    title: 'Initial Release',
    changes: [
      { type: 'new', text: 'Full-stack CRM: Node.js/Express + MongoDB + React 18/Vite' },
      { type: 'new', text: 'Modules: Leads, Deals, Contacts, Accounts, Users, Roles' },
      { type: 'new', text: 'Tickets & Tasks management' },
      { type: 'new', text: 'Activity & Timeline logging' },
      { type: 'new', text: 'JWT authentication with bcrypt password hashing' },
      { type: 'new', text: 'Side-panel ViewModal for record inspection' },
      { type: 'new', text: 'Custom DataTable with sort, filter, pagination' },
    ],
  },
];

const TYPE_COLORS = {
  major: 'bg-blue-600 text-white',
  minor: 'bg-green-500 text-white',
  patch: 'bg-gray-400 text-white',
};

const CHANGE_ICONS = {
  new: { icon: '✨', cls: 'text-blue-600 bg-blue-50 border-blue-100' },
  improved: { icon: '⬆️', cls: 'text-green-700 bg-green-50 border-green-100' },
  fix: { icon: '🐛', cls: 'text-orange-600 bg-orange-50 border-orange-100' },
  removed: { icon: '🗑️', cls: 'text-red-600 bg-red-50 border-red-100' },
};

export default function VersionHistory() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full min-h-0 space-y-2 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('versionHistory')}</h2>
          <p className="text-sm text-gray-500">Do Systems CRM — Release Notes</p>
        </div>
        <div className="flex items-center gap-3">
          {Object.entries(CHANGE_ICONS).map(([k, v]) => (
            <span key={k} className={`badge border ${v.cls} gap-1`}>
              <span>{v.icon}</span> {k.charAt(0).toUpperCase() + k.slice(1)}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[130px] top-0 bottom-0 w-px bg-gray-200" />
        <div className="space-y-8 pb-8">
          {VERSIONS.map((v, i) => (
            <div key={v.version} className="relative flex gap-6">
              {/* Date + version */}
              <div className="w-[118px] flex-shrink-0 text-right pt-1">
                <p className="text-xs text-gray-400 font-medium">{new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <span className={`inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-full tracking-tight ${TYPE_COLORS[v.type]}`}>{v.type.toUpperCase()}</span>
              </div>

              {/* Circle on timeline */}
              <div className="relative flex-shrink-0">
                <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md mt-1 ${i === 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              </div>

              {/* Card */}
              <div className="flex-1 card border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-800 text-sm">{v.version}</span>
                    {i === 0 && <span className="badge bg-blue-600 text-white border-blue-700 text-[9px]">LATEST</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-600">{v.title}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {v.changes.map((c, ci) => {
                    const meta = CHANGE_ICONS[c.type] || CHANGE_ICONS.new;
                    return (
                      <div key={ci} className={`flex items-start gap-2 text-[11px] rounded-lg px-2.5 py-2 border ${meta.cls}`}>
                        <span className="flex-shrink-0">{meta.icon}</span>
                        <span className="font-medium leading-tight">{c.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap teaser */}
      <div className="card border border-dashed border-blue-200 bg-blue-50/40">
        <h3 className="text-sm font-bold text-blue-700 mb-2">🚀 Upcoming Roadmap</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {['Redis caching layer', 'AI-powered lead scoring', 'WhatsApp integration', 'Mobile app (React Native)', 'Zapier/webhook integrations', 'Custom dashboard widgets'].map(item => (
            <div key={item} className="text-xs text-blue-600 bg-white border border-blue-100 rounded-lg px-3 py-2 font-medium">
              📌 {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
