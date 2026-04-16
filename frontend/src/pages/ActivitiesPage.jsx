import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDateTime, formatDateFromNow, capitalize, buildColumnFilters, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ViewModal from '../components/common/ViewModal';
import ActivityForm from '../components/forms/ActivityForm';
import DataTable from '../components/common/DataTable';
import BulkUpload from '../components/common/BulkUpload';
import ExportButton from '../components/common/ExportButton';
import HelpIcon from '../components/common/HelpIcon';
import ColumnSettings from '../components/common/ColumnSettings';
import FilterBar from '../components/filters/FilterBar';

export default function ActivitiesPage({ type }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [deleteId, setDeleteId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [statusTab, setStatusTab] = useState(''); // '' (All), 'completed', or 'scheduled'
  const [formOpen, setFormOpen] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('-activityDate');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    purpose: '',
    outcome: '',
  });
  const [colFilters, setColFilters] = useState({});
  const [columns, setColumns] = useState([]);
  const toast = useToast();

  const PURPOSES = ['discovery', 'follow_up', 'negotiation', 'support', 'demo', 'other'];
  const OUTCOMES = ['answered', 'no_answer', 'busy', 'left_voicemail', 'scheduled_follow_up', 'closed', 'refused'];

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', limit);
      params.set('sort', sortField);
      params.set('search', searchQuery);
      
      const isInteraction = ['call', 'email', 'meeting'].includes(type);
      const endpoint = isInteraction ? '/customer-activities' : '/activities';
      
      if (isInteraction) params.set('type', type);
      if (statusTab) params.set('status', statusTab);
      
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      buildColumnFilters(params, colFilters);

      const res = await api.get(`${endpoint}?${params}`);
      setActivities(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [type, statusTab, page, limit, searchQuery, sortField, filters, colFilters, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActivities();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchActivities]);

  // Sync columns when type changes
  useEffect(() => {
    const isInteraction = ['call', 'email', 'meeting', 'note'].includes(type);

    const baseColumns = [
      {
        key: 'subject', label: 'Subject', type: 'text', sortable: true, render: (row) => (
          <button
            onClick={() => handleView(row)}
            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left truncate max-w-[200px]"
          >
            {row.subject}
          </button>
        )
      },
      {
        key: 'relatedTo', label: 'Related To', type: 'text', render: (row) => row.relatedTo ? (
          <div className="flex flex-col">
            <span className="font-medium text-gray-800">
              {row.relatedTo.name || row.relatedTo.title || row.relatedTo.subject}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase">{row.onModel}</span>
          </div>
        ) : (
          <span className="text-gray-400 italic">Global / Deleted</span>
        )
      }
    ];

    if (type === 'call') {
      baseColumns.push({
        key: 'purpose', label: 'Purpose', type: 'text', 
        options: PURPOSES.map(p => ({ value: p, label: capitalize(p.replace('_', ' ')) })),
        render: (row) => (
          <span className={`badge ${row.purpose === 'discovery' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
            {row.purpose ? capitalize(row.purpose.replace('_', ' ')) : '—'}
          </span>
        )
      });
      baseColumns.push({
        key: 'outcome', label: 'Outcome', type: 'text', 
        options: OUTCOMES.map(o => ({ value: o, label: capitalize(o.replace('_', ' ')) })),
        render: (row) => (
          row.outcome ? (
            <span className={`badge ${['answered', 'closed'].includes(row.outcome) ? 'bg-green-100 text-green-700 font-bold' : 'bg-gray-100 text-gray-600'}`}>
              {capitalize(row.outcome.replace('_', ' '))}
            </span>
          ) : '—'
        )
      });
    }

    if (type === 'system') {
      baseColumns.push({
        key: 'action', label: 'Action', type: 'text', render: (row) => (
          <span className={`badge px-2 py-0.5 text-[10px] uppercase font-bold ${
            row.action === 'created' || row.action === 'login' ? 'bg-green-100 text-green-700' : 
            row.action === 'deleted' || row.action === 'failed_login' ? 'bg-red-100 text-red-700' : 
            row.action === 'viewed' ? 'bg-indigo-100 text-indigo-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {row.action?.replace('_', ' ')}
          </span>
        )
      });
      baseColumns.push({
        key: 'description', label: 'Details', type: 'text', render: (row) => (
          <span className="text-xs text-gray-600 truncate max-w-[200px]" title={row.description}>
            {row.description || '—'}
          </span>
        )
      });
      baseColumns.push({
        key: 'requestMethod', label: 'Method', type: 'text', render: (row) => (
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono ${
            row.requestMethod === 'GET' ? 'text-blue-600 bg-blue-50' :
            row.requestMethod === 'POST' ? 'text-green-600 bg-green-50' :
            row.requestMethod === 'PUT' ? 'text-orange-600 bg-orange-50' :
            row.requestMethod === 'DELETE' ? 'text-red-600 bg-red-50' :
            'text-gray-400'
          }`}>
            {row.requestMethod || '—'}
          </span>
        )
      });
      baseColumns.push({
        key: 'requestUrl', label: 'Path', type: 'text', render: (row) => (
          <span className="text-[10px] text-gray-400 font-mono truncate max-w-[150px]" title={row.requestUrl}>
            {row.requestUrl || '—'}
          </span>
        )
      });
    }

    baseColumns.push({
      key: 'activityDate', label: statusTab === 'scheduled' ? 'Scheduled For' : 'Date', sortable: true, type: 'date', render: (row) => (
        <div className="flex flex-col">
          <span className="text-gray-700 text-xs font-medium">{formatDateFromNow(row.activityDate)}</span>
          <span className="text-[10px] text-gray-400">{formatDateTime(row.activityDate)}</span>
        </div>
      )
    });

    if (isInteraction) {
      baseColumns.push({
        key: 'status', label: 'Status', type: 'text', 
        options: [
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ],
        render: (row) => (
          <span className={`badge shrink-0 py-0.5 text-[10px] font-bold ${row.status === 'scheduled' ? 'bg-orange-100 text-orange-600' : row.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-green-100 text-green-600'}`}>
            {capitalize(row.status || 'system')}
          </span>
        )
      });
    }

    baseColumns.push({
      key: 'createdBy', label: 'Done By', type: 'text', render: (row) => (
        <span className="text-xs font-semibold text-gray-700">{row.createdBy?.name || 'System'}</span>
      )
    });

    setColumns(baseColumns);
  }, [type, statusTab]);

  const getEndpoint = useCallback(() => {
    return ['call', 'email', 'meeting'].includes(type) ? '/customer-activities' : '/activities';
  }, [type]);

  const handleDelete = async () => {
    try {
      await api.delete(`${getEndpoint()}/${deleteId}`);
      toast.success('Activity deleted successfully');
      setDeleteId(null);
      fetchActivities();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const updateStatus = async (activityId, newStatus) => {
    try {
      await api.put(`${getEndpoint()}/${activityId}`, { status: newStatus });
      toast.success(`Activity marked as ${newStatus}`);
      fetchActivities();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleView = async (activity) => {
    try {
      const res = await api.get(`${getEndpoint()}/${activity._id}`);
      setViewData(res.data.data);
    } catch (err) {
      toast.error('Failed to load activity details');
    }
  };

  const getIcon = () => {
    if (type === 'call') return '📞';
    if (type === 'email') return '✉️';
    if (type === 'meeting') return '🤝';
    return '📝';
  };

  const FILTER_FIELDS = [
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'scheduled', label: 'Scheduled' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' }
    ]},
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date' },
    ...(type === 'call' ? [
      { key: 'purpose', label: 'Purpose', type: 'select', options: PURPOSES.map(p => ({ value: p, label: capitalize(p.replace('_', ' ')) })) },
      { key: 'outcome', label: 'Outcome', type: 'select', options: OUTCOMES.map(o => ({ value: o, label: capitalize(o.replace('_', ' ')) })) }
    ] : [])
  ];


  const tableData = activities.map(activity => ({
    ...activity,
    _actions: (
      <div className="flex items-center justify-end gap-1">
        {activity.status === 'scheduled' && (
          <>
            <button onClick={() => updateStatus(activity._id, 'completed')} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors" title="Mark as Completed">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
            <button onClick={() => updateStatus(activity._id, 'cancelled')} className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors" title="Cancel Activity">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </>
        )}
        <button onClick={() => { setEditActivity(activity); setFormOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button onClick={() => setDeleteId(activity._id)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Log">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    )
  }));


  return (
    <div className="flex flex-col h-full min-h-0 space-y-2">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-lg">
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{capitalize(type)}s</h2>
              <HelpIcon module="activities" />
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">Manage your {type} interactions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchActivities} className="btn-secondary py-1.5 px-2" title="Refresh">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`p-2 rounded-md transition-all border ${showFilters || searchQuery ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-400 hover:text-gray-600 border-gray-100'}`}
            title="Search & Filters"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <ColumnSettings columns={columns} onChange={setColumns} />
          <BulkUpload module="activities" onSuccess={fetchActivities} />
          <ExportButton module="activities" filters={{ ...filters, type }} visibleColumns={columns.filter(c => !c.hidden).map(c => c.key)} />
          <button
            onClick={() => { setEditActivity(null); setFormOpen(true); }}
            className="btn-primary py-1.5 px-3 text-sm"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log {capitalize(type)}
          </button>
        </div>
      </div>

      {showFilters && (
        <FilterBar 
          filters={{ search: searchQuery, ...filters }} 
          onChange={(f) => { setSearchQuery(f.search || ''); setFilters(prev => ({ ...prev, ...f, search: undefined })); setPage(1); }} 
          fields={FILTER_FIELDS} 
        />
      )}

      <div className="flex border-b border-gray-200 shrink-0">
        <button
          onClick={() => { setStatusTab(''); setPage(1); }}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${statusTab === '' ? 'border-primary-600 text-primary-600 bg-gray-50' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
        >
          All Activities
        </button>
        <button
          onClick={() => { setStatusTab('completed'); setPage(1); }}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${statusTab === 'completed' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
        >
          Past History
        </button>
        <button
          onClick={() => { setStatusTab('scheduled'); setPage(1); }}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${statusTab === 'scheduled' ? 'border-orange-500 text-orange-600 bg-orange-50/30' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
        >
          Scheduled
          {statusTab === 'scheduled' && pagination.total > 0 && (
            <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[10px]">{pagination.total}</span>
          )}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between py-1 shrink-0 px-1">
        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
          <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Sort:</span>
          <select
            className="bg-transparent font-bold text-gray-900 focus:outline-none cursor-pointer"
            value={sortField}
            onChange={(e) => { setSortField(e.target.value); setPage(1); }}
          >
            <option value="-activityDate">Newest First</option>
            <option value="activityDate">Oldest First</option>
            <option value="subject">Subject (A-Z)</option>
          </select>
        </div>
        <div className="text-[10px] text-gray-400 font-semibold tracking-tight">
          Total: <span className="text-gray-900">{pagination.total}</span> activities
        </div>
      </div>

      <div className="flex-1 flex flex-row min-h-0 overflow-hidden gap-2">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <DataTable
            columns={columns}
            onColumnsChange={setColumns}
            data={tableData}
            loading={loading}
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            onSort={(field, order) => {
              const sortStr = order === 'desc' ? `-${field}` : field;
              setSortField(sortStr);
              setPage(1);
            }}
            sortField={sortField.replace('-', '')}
            sortOrder={sortField.startsWith('-') ? 'desc' : 'asc'}
            onColumnFilterChange={setColFilters}
          />
        </div>

        <ViewModal
          isOpen={!!viewData}
          onClose={() => setViewData(null)}
          data={viewData}
          title={`${capitalize(type)} Details`}
          onModel="Activity"
        />
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={`Delete ${capitalize(type)} Log`}
        message="Are you sure you want to delete this activity log? This action cannot be undone."
      />

      <ActivityForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditActivity(null); }}
        activity={editActivity}
        initialType={type}
        onSuccess={fetchActivities}
      />
    </div>
  );
}
