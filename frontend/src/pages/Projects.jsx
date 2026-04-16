import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ProjectForm from '../components/forms/ProjectForm';
import ViewModal from '../components/common/ViewModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { buildColumnFilters, formatDate, formatCurrency } from '../utils/helpers';
import DataTable from '../components/common/DataTable';
import DataGrid from '../components/common/DataGrid';
import FilterBar from '../components/filters/FilterBar';
import BulkUpload from '../components/common/BulkUpload';
import ExportButton from '../components/common/ExportButton';
import HelpIcon from '../components/common/HelpIcon';
import ColumnSettings from '../components/common/ColumnSettings';

const STATUSES = [
  { id: 'planning', label: 'Planning', color: 'border-blue-400' },
  { id: 'active', label: 'Active', color: 'border-green-400' },
  { id: 'on_hold', label: 'On Hold', color: 'border-yellow-400' },
  { id: 'completed', label: 'Completed', color: 'border-gray-500' },
  { id: 'cancelled', label: 'Cancelled', color: 'border-red-500' },
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: 'bg-gray-50 text-gray-600 border-gray-100' },
  { id: 'medium', label: 'Medium', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'high', label: 'High', color: 'bg-orange-50 text-orange-600 border-orange-100' },
  { id: 'critical', label: 'Critical', color: 'bg-red-50 text-red-600 border-red-100' },
];

const COLUMNS = [
  {
    key: 'name', label: 'Project', type: 'text', sortable: true, render: (row) => (
      <div className="flex flex-col">
        <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-[200px]">{row.name}</span>
        {row.description && <span className="text-[10px] text-gray-400 truncate max-w-[200px]">{row.description}</span>}
      </div>
    )
  },
  {
    key: 'status', label: 'Status', type: 'text', sortable: true,
    options: STATUSES.map(s => ({ value: s.id, label: s.label })),
    render: (row) => {
      const status = STATUSES.find(s => s.id === row.status);
      return (
        <span className={`badge ${row.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' :
          row.status === 'completed' ? 'bg-gray-100 text-gray-700 border-gray-200' :
            row.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
              'bg-blue-50 text-blue-700 border-blue-100'
          }`}>
          {status?.label || row.status}
        </span>
      );
    }
  },
  {
    key: 'priority', label: 'Priority', type: 'text', sortable: true,
    options: PRIORITIES.map(p => ({ value: p.id, label: p.label })),
    render: (row) => {
      const p = PRIORITIES.find(p => p.id === row.priority);
      return <span className={`badge ${p?.color || 'bg-gray-100'}`}>{p?.label}</span>;
    }
  },
  {
    key: 'progress', label: 'Progress', sortable: true, type: 'number', render: (row) => (
      <div className="flex items-center gap-2 min-w-[80px]">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${row.progress || 0}%` }} />
        </div>
        <span className="text-[10px] font-bold text-gray-600">{row.progress || 0}%</span>
      </div>
    )
  },
  {
    key: 'budget', label: 'Budget', sortable: true, type: 'number', render: (row) => (
      <span className="font-bold text-gray-800">{row.budget ? formatCurrency(row.budget) : '—'}</span>
    )
  },
  {
    key: 'endDate', label: 'Due Date', sortable: true, type: 'date', render: (row) => {
      const isOverdue = row.endDate && new Date(row.endDate) < new Date() && row.status !== 'completed';
      return (
        <span className={`text-[11px] ${isOverdue ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
          {row.endDate ? formatDate(row.endDate) : '—'}
        </span>
      );
    }
  },
  {
    key: 'assignedTo', label: 'Team', render: (row) => (
      <div className="flex -space-x-1.5">
        {(row.assignedTo || []).slice(0, 3).map(u => (
          <div key={u._id} title={u.name} className="w-5 h-5 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center border border-white">
            {u.name?.charAt(0)}
          </div>
        ))}
        {row.assignedTo?.length > 3 && (
          <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[8px] font-bold flex items-center justify-center border border-white">
            +{row.assignedTo.length - 3}
          </div>
        )}
      </div>
    )
  },
];

const FILTER_FIELDS = [
  { key: 'status', label: 'Status', type: 'select', options: STATUSES.map(s => ({ value: s.id, label: s.label })) },
  { key: 'priority', label: 'Priority', type: 'select', options: PRIORITIES.map(p => ({ value: p.id, label: p.label })) },
];

const defaultFilters = { search: '', status: '', priority: '', page: 1, limit: 20, sort: '-createdAt' };

export default function Projects() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState(defaultFilters);
  const [colFilters, setColFilters] = useState({});
  const [columns, setColumns] = useState(COLUMNS);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('projects_viewMode') || 'table');
  const [selectedIds, setSelectedIds] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const toast = useToast();

  useEffect(() => {
    localStorage.setItem('projects_viewMode', viewMode);
  }, [viewMode]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const queryParams = { ...filters };
      if (viewMode === 'kanban') { queryParams.limit = 100; queryParams.page = 1; }
      Object.entries(queryParams).forEach(([k, v]) => { if (v) params.set(k, v); });
      buildColumnFilters(params, colFilters);
      const res = await api.get(`/projects?${params}`);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [filters, colFilters, viewMode]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setSelectedIds([]); }, [filters, colFilters, viewMode]);

  const onDragStart = (e, id) => e.dataTransfer.setData('projectId', id);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = async (e, targetStatus) => {
    const id = e.dataTransfer.getData('projectId');
    const item = data.find(p => p._id === id);
    if (!item || item.status === targetStatus) return;

    setData(prev => prev.map(p => p._id === id ? { ...p, status: targetStatus } : p));
    try {
      await api.put(`/projects/${id}`, { status: targetStatus });
      toast.success(`Moved to ${targetStatus}`);
    } catch (err) { toast.error('Failed to update project'); fetchData(); }
  };

  const groupedData = useMemo(() => {
    return STATUSES.reduce((acc, s) => {
      acc[s.id] = data.filter(p => p.status === s.id);
      return acc;
    }, {});
  }, [data]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/projects/${deleteId}`);
      toast.success('Project deleted');
      setDeleteId(null);
      fetchData();
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await api.delete('/projects', { data: { ids: selectedIds } });
      toast.success(`${selectedIds.length} projects deleted`);
      setSelectedIds([]); setBulkDeleteOpen(false); fetchData();
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  const renderCard = (p) => (
    <div key={p._id} draggable={viewMode === 'kanban'} onDragStart={(e) => onDragStart(e, p._id)}
      className="card p-2.5 shadow-sm hover:shadow-md transition-all group border-t-4 border-t-blue-500 flex flex-col h-full bg-white">
      <div className="flex justify-between items-start mb-1.5">
        <h3 className="font-bold text-gray-900 text-[11px] group-hover:text-blue-600 transition-colors truncate flex-1 leading-tight">{p.name}</h3>
        <span className={`badge shrink-0 text-[8px] font-bold ${PRIORITIES.find(pr => pr.id === p.priority)?.color}`}>
          {p.priority}
        </span>
      </div>
      <div className="flex flex-col gap-1 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-700">{p.budget ? formatCurrency(p.budget) : '$0'}</span>
          <span className="text-[9px] font-bold text-gray-400">{p.progress || 0}%</span>
        </div>
        <div className="h-1 bg-gray-50 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500" style={{ width: `${p.progress || 0}%` }} />
        </div>
      </div>
      <div className="space-y-1 mb-3 mt-auto border-t border-gray-50 pt-2">
        <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>{p.endDate ? formatDate(p.endDate) : 'No deadline'}</span>
        </div>
        <div className="flex -space-x-1.5">
          {(p.assignedTo || []).slice(0, 5).map(u => (
            <div key={u._id} className="w-5 h-5 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center border border-white">{u.name?.charAt(0)}</div>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5 pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setViewData(p)} className="btn-secondary btn-sm flex-1 text-[9px] py-1">View</button>
        <button onClick={() => { setEditItem(p); setFormOpen(true); }} className="btn-secondary btn-sm flex-1 text-[9px] py-1">Edit</button>
        <button onClick={() => setDeleteId(p._id)} className="btn-danger btn-sm px-2"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
      </div>
    </div>
  );

  const renderKanban = () => (
    <div className="flex-1 overflow-x-auto pb-4">
      <div className="flex gap-3 h-full min-w-max pr-4">
        {STATUSES.map(s => (
          <div key={s.id} className="w-64 flex flex-col bg-gray-50/50 rounded-xl border border-gray-100" onDragOver={onDragOver} onDrop={(e) => onDrop(e, s.id)}>
            <div className={`p-1.5 border-t-[3px] ${s.color} bg-white rounded-t-xl border-b border-gray-100 mb-1.5`}>
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-gray-700 uppercase text-[9px] tracking-widest">{s.label}</h3>
                <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-full font-bold">{groupedData[s.id]?.length || 0}</span>
              </div>
            </div>
            <div className="flex-1 px-2.5 overflow-y-auto min-h-0 scrollbar-hide">
              {groupedData[s.id]?.map(renderCard)}
              {groupedData[s.id]?.length === 0 && <div className="h-20 border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center text-[10px] text-gray-400 italic">Empty Lane</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const tableData = data.map(p => ({
    ...p,
    _actions: (
      <>
        <button onClick={() => setViewData(p)} className="btn-icon btn-sm text-blue-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
        <button onClick={() => { setEditItem(p); setFormOpen(true); }} className="btn-icon btn-sm"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
        <button onClick={() => setDeleteId(p._id)} className="btn-icon btn-sm text-red-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
      </>
    )
  }));

  return (
    <div className={`flex flex-col h-full min-h-0 ${viewMode !== 'kanban' ? 'space-y-2' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1 shrink-0">
        <div>
          <div className="flex items-center"><h2 className="text-xl font-bold text-gray-900 leading-tight">Projects</h2><HelpIcon module="projects" /></div>
          <p className="text-[11px] text-gray-500 font-medium">{pagination.total} active initiatives</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchData} className="btn-secondary p-2" title="Refresh">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <div className="flex bg-gray-100  rounded-lg p-1 gap-1">
            <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`} title="Board View"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg></button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`} title="Table View"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" /></svg></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`} title="Cards View"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></button>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-md transition-all border ${showFilters || filters.search || filters.status || filters.priority ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-400 hover:text-gray-600 border-gray-100 hover:border-gray-200'}`} title="Search & Filters"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
          <ColumnSettings columns={columns} onChange={setColumns} />
          <BulkUpload module="projects" onSuccess={fetchData} />
          <ExportButton module="projects" filters={filters} visibleColumns={columns.filter(c => !c.hidden).map(c => c.key)} />
          <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="btn-primary"><svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Project</button>
        </div>
      </div>

      {showFilters && <FilterBar filters={filters} onChange={setFilters} fields={FILTER_FIELDS} />}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {viewMode === 'kanban' ? renderKanban() : viewMode === 'table' ? (
          <DataTable columns={columns} onColumnsChange={setColumns} data={tableData} loading={loading} pagination={pagination}
            onPageChange={(p) => setFilters(f => ({ ...f, page: p }))}
            onLimitChange={(l) => setFilters(f => ({ ...f, limit: l, page: 1 }))}
            onSort={(field, order) => { const sortStr = order === 'desc' ? `-${field}` : field; setFilters(f => ({ ...f, sort: sortStr, page: 1 })); }}
            sortField={filters.sort?.replace('-', '') || 'createdAt'}
            sortOrder={filters.sort?.startsWith('-') ? 'desc' : 'asc'}
            selectedIds={selectedIds}
            onSelectAll={(checked) => setSelectedIds(checked ? data.map(r => r._id) : [])}
            onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
            onBulkDelete={() => setBulkDeleteOpen(true)}
            onColumnFilterChange={setColFilters}
          />
        ) : (
          <div className="flex-1 overflow-y-auto"><DataGrid data={data} loading={loading} pagination={pagination} onPageChange={(p) => setFilters(f => ({ ...f, page: p }))} onLimitChange={(l) => setFilters(f => ({ ...f, limit: l, page: 1 }))} renderCard={renderCard} /></div>
        )}
      </div>

      <ProjectForm isOpen={formOpen} onClose={() => { setFormOpen(false); setEditItem(null); }} project={editItem} onSuccess={fetchData} />
      <ViewModal isOpen={!!viewData} onClose={() => setViewData(null)} data={viewData} title="Project Details" onModel="Project" />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Project" message="Are you sure you want to delete this project?" loading={deleting} />
      <ConfirmDialog isOpen={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} onConfirm={handleBulkDelete} title="Bulk Delete" message={`Delete ${selectedIds.length} projects?`} loading={deleting} />
    </div>
  );
}
