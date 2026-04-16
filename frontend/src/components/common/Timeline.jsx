import React from 'react';
import { formatDate, formatDateFromNow } from '../../utils/helpers';

const icons = {
  call: {
    bg: 'bg-blue-100', text: 'text-blue-600', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    )
  },
  email: {
    bg: 'bg-purple-100', text: 'text-purple-600', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  meeting: {
    bg: 'bg-green-100', text: 'text-green-600', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  note: {
    bg: 'bg-gray-100', text: 'text-gray-600', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
};

export default function Timeline({ activities, loading }) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities?.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400">No activity history yet.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0 pb-4">
      {/* Vertical Line */}
      <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-100" />

      {activities?.map((activity, idx) => {
        const isCancelled = activity.status === 'cancelled';
        const style = icons[activity.type] || icons.note;
        return (
          <div key={activity._id} className={`relative flex gap-4 pb-8 group last:pb-2 ${isCancelled ? 'opacity-50' : ''}`}>
            <div className={`z-10 w-8 h-8 rounded-full ${isCancelled ? 'bg-gray-100 text-gray-400' : `${style.bg} ${style.text}`} flex items-center justify-center shrink-0 shadow-sm border-2 border-white`}>
              {style.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <h4 className={`text-sm font-semibold text-gray-800 truncate leading-tight ${isCancelled ? 'line-through text-gray-400' : ''}`}>
                  {activity.subject}
                </h4>
                <time className="text-[10px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100" title={formatDate(activity.activityDate)}>
                  {formatDateFromNow(activity.activityDate)}
                </time>
              </div>
              <p className={`text-xs text-gray-600 line-clamp-2 mb-2 italic ${isCancelled ? 'text-gray-400' : ''}`}>
                {activity.description || 'No description provided.'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {activity.status === 'scheduled' && (
                  <span className="text-[9px] font-semibold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded tracking-wider">Scheduled</span>
                )}
                {isCancelled && (
                  <span className="text-[9px] font-semibold bg-red-50 text-red-500 px-1.5 py-0.5 rounded  tracking-wider">Cancelled</span>
                )}
                {activity.type === 'call' && (
                  <>
                    {activity.purpose && (
                      <span className="text-[9px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded  tracking-wider border border-blue-100">
                        {activity.purpose.replace('_', ' ')}
                      </span>
                    )}
                    {activity.outcome && (
                      <span className="text-[9px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded  tracking-wider border border-gray-200">
                        {activity.outcome.replace('_', ' ')}
                      </span>
                    )}
                  </>
                )}
                <span className="text-[10px] text-gray-400 capitalize whitespace-nowrap ml-auto">
                  By {activity.createdBy?.name || 'User'}
                  {activity.duration > 0 && <span> • {activity.duration}m</span>}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
