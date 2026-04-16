import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';

const typeIcon = (type) => {
  const icons = {
    leads: '👤', deals: '💰', tasks: '✅', contacts: '📋',
    accounts: '🏢', tickets: '🎫', default: '🔔',
  };
  return icons[type] || icons.default;
};

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useSocket();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) markAllRead(); }}
        className="relative p-2 rounded-lg text-blue-200/70 hover:text-white hover:bg-white/10 transition-all"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[200] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
            {notifications.length > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold uppercase tracking-wide">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm text-gray-400 font-medium">No notifications yet</p>
                <p className="text-xs text-gray-300 mt-1">Activity will appear here in real-time</p>
              </div>
            ) : notifications.map((n) => (
              <div key={n.id} className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}>
                <div className="text-xl flex-shrink-0 mt-0.5">{typeIcon(n.module)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 capitalize">
                    {n.module} {n.action}
                  </p>
                  {n.record?.name && (
                    <p className="text-xs text-gray-500 truncate">{n.record.name}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.timestamp)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
              </div>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-[10px] text-gray-400">{notifications.length} notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
