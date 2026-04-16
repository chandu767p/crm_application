import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import { formatDate, formatDateTime, capitalize } from '../../utils/helpers';
import UnifiedTimeline from './UnifiedTimeline';
import ActivityForm from '../forms/ActivityForm';

export default function ViewModal({ isOpen, onClose, data, title = 'Details', onModel }) {
  const [width, setWidth] = useState(450);
  const [activeTab, setActiveTab] = useState('details');
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, width: 0 });

  const fetchActivities = useCallback(async () => {
    if (!data?._id || !onModel) return;
    setLoadingActivities(true);
    try {
      const res = await api.get(`/activities/timeline/${onModel}/${data._id}`);
      setActivities(res.data.data);
    } catch (err) {
      console.error('Failed to fetch activities', err);
    } finally {
      setLoadingActivities(false);
    }
  }, [data?._id, onModel]);

  useEffect(() => {
    if (isOpen && activeTab === 'activity') {
      fetchActivities();
    }
  }, [isOpen, activeTab, fetchActivities]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('details'); // Reset tab on open
    }
  }, [isOpen, data?._id]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const dx = e.clientX - resizeStart.current.x;
      let newWidth = resizeStart.current.width - dx;
      if (newWidth < 300) newWidth = 300;
      if (newWidth > 1500) newWidth = 1500;
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    isResizing.current = true;
    resizeStart.current = { x: e.clientX, width: width };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  if (!isOpen || !data) return null;

  const renderValue = (key, value) => {
    if (value === null || value === undefined || value === '') return <span className="text-gray-400">—</span>;
    if (typeof value === 'boolean') {
      return (
        <span className={`badge ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-gray-400">—</span>;
      const isObjectArray = typeof value[0] === 'object' && value[0] !== null;
      if (isObjectArray) {
        return (
          <ul className="space-y-2 mt-1">
            {value.map((item, idx) => {
              const text = item.content || item.name || item.title || item.message || JSON.stringify(item);
              const date = item.createdAt ? formatDate(item.createdAt) : null;
              return (
                <li key={idx} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-100">
                  <p className="whitespace-pre-wrap">{text}</p>
                  {date && <p className="text-xs text-gray-400 mt-1">{date}</p>}
                </li>
              );
            })}
          </ul>
        );
      }
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, idx) => (
            <span key={idx} className="badge bg-blue-50 text-blue-600">
              {String(item)}
            </span>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      const text = value.name || value.title || value.content || value.message;
      if (text) return <span className="text-gray-700 font-medium">{text}</span>;
      
      return (
        <div className="space-y-1 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="flex flex-col sm:flex-row sm:items-baseline gap-1">
              <span className="font-medium text-gray-500 text-[10px] uppercase tracking-wide min-w-[70px]">
                {capitalize(k)}:
              </span>
              <span className="text-gray-700 break-words flex-1 text-xs">
                {String(v)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
      return <span className="text-gray-700 text-xs">{formatDateTime(value)}</span>;
    }
    return <span className="text-gray-700 text-xs">{String(value)}</span>;
  };

  const displayEntries = Object.entries(data).filter(([key]) => {
    const k = key.toLowerCase();
    return !key.startsWith('_') && 
           !['password', 'id', 'assignedTo', 'owner', 'account', 'contact', 'createdat', 'updatedat', 'v', '__v'].includes(k);
  });

  const metadataEntries = Object.entries(data).filter(([key]) => {
    const k = key.toLowerCase();
    return ['createdat', 'updatedat'].includes(k);
  });

  return (
    <div 
      className="fixed inset-y-0 right-0 sm:sticky sm:top-0 bg-white shadow-2xl sm:shadow-xl border-l border-gray-200 flex flex-col z-40 transition-all duration-300 ease-in-out" 
      style={{ 
        width: window.innerWidth < 640 ? '100%' : `${width}px`, 
        height: window.innerWidth < 640 ? '100%' : 'calc(100vh - 60px)',
        top: window.innerWidth < 640 ? '0' : '60px'
      }}
    >
      {/* Resizer Handle - Hidden on mobile */}
      <div
        className="hidden sm:block absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/30 active:bg-blue-500 z-10 transition-colors"
        onMouseDown={handleMouseDown}
      />

      <div className="px-3.5 py-2.5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <div className="min-w-0 pr-2">
          <h2 className="text-sm font-semibold text-gray-900 truncate leading-tight tracking-tight">{data.name || data.title || title}</h2>
          <p className="text-[9px] text-gray-400 font-semibold tracking-widest mt-0.5">{onModel}</p>
        </div>
        <button onClick={onClose} className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-4 bg-white/50">
        <button 
          onClick={() => setActiveTab('details')}
          className={`py-2 text-[10px] font-semibold tracking-widest border-b-2 transition-all mr-6 ${
            activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Details
        </button>
        {onModel && (
          <button 
            onClick={() => setActiveTab('activity')}
            className={`py-2 text-[10px] font-semibold tracking-widest border-b-2 transition-all ${
              activeTab === 'activity' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Activity Timeline
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/10 custom-scrollbar">
        {activeTab === 'details' ? (
          <div className="space-y-4">
            {/* Quick Stats/Owner */}
            {(data.assignedTo || data.owner || data.account) && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                {data.account && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Account</p>
                    <p className="text-sm font-semibold text-blue-600 truncate">{data.account.name || 'View Account'}</p>
                  </div>
                )}
                {(data.assignedTo || data.owner) && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assigned To</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{(data.assignedTo || data.owner).name}</p>
                  </div>
                )}
              </div>
            )}

            <dl className="space-y-3 px-1">
              {displayEntries.map(([key, value]) => (
                <div key={key} className="group border-b border-gray-100/50 pb-2.5 last:border-0 last:pb-0">
                  <dt className="text-[9px] font-semibold text-gray-400 tracking-widest mb-1 group-hover:text-blue-600 transition-colors">
                    {capitalize(key.replace(/([A-Z])/g, ' $1').trim())}
                  </dt>
                  <dd className="text-xs text-gray-800 break-words font-medium">
                    {renderValue(key, value)}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Metadata Footer */}
            {metadataEntries.length > 0 && (
              <div className="mt-8 pt-4 border-t border-gray-200">
                <div className="bg-gray-100/50 rounded-lg p-2.5 space-y-2 border border-gray-200/50">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">System Metadata</p>
                  {metadataEntries.map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center px-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase">{capitalize(key)}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{formatDateTime(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Timeline</h3>
              {onModel !== 'Activity' && (
                <button 
                  onClick={() => setActivityFormOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Log Interaction
                </button>
              )}
            </div>
            
            <UnifiedTimeline activities={activities} loading={loadingActivities} />
          </div>
        )}
      </div>

      <ActivityForm 
        isOpen={activityFormOpen}
        onClose={() => setActivityFormOpen(false)}
        relatedTo={data._id}
        onModel={onModel}
        onSuccess={fetchActivities}
      />
    </div>
  );
}
