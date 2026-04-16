import React from 'react';
import { formatDateFromNow, getInitials, getAvatarColor, capitalize } from '../../utils/helpers';

const ACTION_CONFIG = {
  created: { icon: '🟢', color: 'bg-green-50 text-green-600 border-green-100', label: 'Created' },
  updated: { icon: '✏️', color: 'bg-blue-50 text-blue-600 border-blue-100', label: 'Updated' },
  deleted: { icon: '🔴', color: 'bg-red-50 text-red-600 border-red-100', label: 'Deleted' },
  note_added: { icon: '📝', color: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Note Added' },
  note_updated: { icon: '📝', color: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Note Updated' },
  note_deleted: { icon: '🗑️', color: 'bg-gray-50 text-gray-600 border-gray-100', label: 'Note Deleted' },
  status_changed: { icon: '🔄', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', label: 'Status Changed' },
  system: { icon: '⚙️', color: 'bg-gray-50 text-gray-500 border-gray-100', label: 'System' },
};

const ActivityItem = ({ activity, isLast }) => {
  const config = ACTION_CONFIG[activity.action] || ACTION_CONFIG.system;
  const performer = activity.createdBy?.name || 'System';

  const renderContent = () => {
    if (activity.action === 'updated' && activity.field) {
      return (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold text-gray-400 tracking-wider font-mono bg-white px-1.5 py-0.5 rounded border border-gray-100 line-through opacity-60">
            {String(activity.oldValue || 'None')}
          </span>
          <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span className="text-[10px] font-black text-blue-600 tracking-wider font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shadow-sm">
            {String(activity.newValue || 'None')}
          </span>
        </div>
      );
    }

    if (activity.description) {
      return <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed italic">{activity.description}</p>;
    }

    return null;
  };

  return (
    <div className="relative pl-8 pb-5 group">
      {/* Vertical Line */}
      {!isLast && (
        <div className="absolute left-[11px] top-[24px] bottom-0 w-[2px] bg-gradient-to-b from-gray-100 via-gray-100 to-transparent"></div>
      )}

      {/* Action Icon / Dot */}
      <div className={`absolute left-0 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] z-10 transition-transform group-hover:scale-110 bg-white ${config.color}`}>
        {config.icon}
      </div>

      <div className="bg-white/40 p-2.5 rounded-xl border border-transparent group-hover:border-gray-100 group-hover:bg-white group-hover: transition-all duration-300">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-900">{performer}</span>
            <span className="text-[10px] font-medium text-gray-400 capitalize">{activity.action.replace('_', ' ')}</span>
            {activity.field && (
              <span className="text-[10px] font-black text-indigo-500 tracking-tight bg-indigo-50 px-1.5 py-0.5 rounded">
                {activity.field}
              </span>
            )}
          </div>
          <span className="text-[9px] font-black text-gray-400 tracking-widest bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
            {formatDateFromNow(activity.createdAt)}
          </span>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default function UnifiedTimeline({ activities, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse flex gap-4 pl-8 relative pb-5">
            <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-1/4" />
              <div className="h-4 bg-gray-50 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
        <div className="text-2xl mb-2 opacity-50">⏳</div>
        <p className="text-[10px] font-black text-gray-400 tracking-widest">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="max-h-[500px] overflow-y-auto pr-4 custom-scrollbar px-1 py-1">
      {activities.map((activity, index) => (
        <ActivityItem
          key={activity._id}
          activity={activity}
          isLast={index === activities.length - 1}
        />
      ))}
    </div>
  );
}
