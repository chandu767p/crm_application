import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/common/DataTable';
import DataGrid from '../components/common/DataGrid';
import FilterBar from '../components/filters/FilterBar';
import TaskForm from '../components/forms/TaskForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import BulkUpload from '../components/common/BulkUpload';
import ExportButton from '../components/common/ExportButton';
import ViewModal from '../components/common/ViewModal';
import HelpIcon from '../components/common/HelpIcon';
import ColumnSettings from '../components/common/ColumnSettings';
import { capitalize, formatDate, buildColumnFilters } from '../utils/helpers';
import { useMemo } from 'react';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-red-100 text-red-700',
};

const STAGES = [
  { id: 'pending', label: 'Pending', color: 'border-yellow-400' },
  { id: 'in_progress', label: 'In Progress', color: 'border-blue-400' },
  { id: 'completed', label: 'Completed', color: 'border-green-400' },
];

const COLUMNS = [
  {
    key: 'title', label: 'Title', type: 'text', sortable: true, render: (row) => (
      <div className="flex flex-col">
        <p className="font-medium text-gray-900 truncate max-w-[200px]">{row.title}</p>
        {row.description && <p className="text-xs text-gray-500 truncate max-w-[200px]">{row.description}</p>}
      </div>
    )
  },
  {
    key: 'status', label: 'Status', type: 'text',
    options: Object.keys(statusColors).map(s => ({ value: s, label: capitalize(s.replace('_', ' ')) })),
    render: (row) => (
      <span className={`badge ${statusColors[row.status] || 'bg-gray-100'}`}>
        {capitalize(row.status.replace('_', ' '))}
      </span>
    )
  },
  {
    key: 'priority', label: 'Priority', type: 'text',
    options: Object.keys(priorityColors).map(p => ({ value: p, label: capitalize(p) })),
    render: (row) => (
      <span className={`badge ${priorityColors[row.priority] || 'bg-gray-100'}`}>
        {capitalize(row.priority)}
      </span>
    )
  },
  {
    key: 'dueDate', label: 'Due Date', type: 'date', sortable: true, render: (row) => {
      const isOverdue = row.dueDate && new Date(row.dueDate) < new Date() && row.status !== 'completed';
      return (
        <span className={`text-sm ${isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
          {row.dueDate ? formatDate(row.dueDate) : '—'}
        </span>
      );
    }
  },
  {
    key: 'assignedTo.name', label: 'Assigned To', type: 'text', render: (row) => (
      <span className="text-gray-500 text-sm">{row.assignedTo?.name || '—'}</span>
    )
  },
];

const FILTER_FIELDS = [
  {
    key: 'status', label: 'Status', type: 'select', options: [
      { value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
    ]
  },
  {
    key: 'priority', label: 'Priority', type: 'select', options: [
      { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ]
  },
];

const defaultFilters = { search: '', status: '', priority: '', page: 1, limit: 20, sort: '-createdAt' };

export default function Tasks() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState(defaultFilters);
  const [colFilters, setColFilters] = useState({});
  const [columns, setColumns] = useState(COLUMNS);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [selectedIds, setSelectedIds] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const queryParams = { ...filters };
      if (viewMode === 'kanban') {
        queryParams.limit = 100;
        queryParams.page = 1;
      }
      Object.entries(queryParams).forEach(([k, v]) => { if (v) params.set(k, v); });
      buildColumnFilters(params, colFilters);
      const res = await api.get(`/tasks?${params}`);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, colFilters, viewMode, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setSelectedIds([]); }, [filters, colFilters, viewMode]);

  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, targetStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    const task = data.find((t) => t._id === taskId);

    if (!task || task.status === targetStatus) return;

    const updatedData = data.map((t) =>
      t._id === taskId ? { ...t, status: targetStatus } : t
    );
    setData(updatedData);

    try {
      await api.put(`/tasks/${taskId}`, { status: targetStatus });
      toast.success(`Moved to ${targetStatus.replace('_', ' ')}`);
    } catch (err) {
      toast.error('Failed to update task');
      fetchData();
    }
  };

  const groupedTasks = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage.id] = data.filter((t) => t.status === stage.id);
      return acc;
    }, {});
  }, [data]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/tasks/${deleteId}`);
      toast.success('Task deleted successfully');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await api.delete('/tasks', { data: { ids: selectedIds } });
      toast.success(`${selectedIds.length} tasks deleted successfully`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const renderKanbanCard = (task) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
    return (
      <div
        key={task._id}
        draggable
        onDragStart={(e) => onDragStart(e, task._id)}
        className="card p-2 mb-1.5 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing bg-white border-l-[3px] border-l-yellow-400 group"
      >
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold text-gray-900 text-[11px] group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight flex-1">{task.title}</h4>
          <span className={`text-[8px] font-extrabold px-1 py-0.5 rounded ml-2 shrink-0 border ${priorityColors[task.priority]}`}>{task.priority.toUpperCase()}</span>
        </div>
        {task.description && <p className="text-[10px] text-gray-400 line-clamp-1 mb-1.5 leading-tight">{task.description}</p>}
        <div className="flex flex-col gap-0.5 mb-1.5 pt-1 border-t border-gray-50/50">
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-[9px] ${isOverdue ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[9px] text-gray-400">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="truncate">{task.assignedTo?.name || 'Unassigned'}</span>
          </div>
        </div>
        <div className="flex justify-end gap-1.5 pt-1 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setViewData(task)} className="p-0.5 text-gray-300 hover:text-blue-500 transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
          <button onClick={() => { setEditTask(task); setFormOpen(true); }} className="p-0.5 text-gray-300 hover:text-gray-600 transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
          <button onClick={() => setDeleteId(task._id)} className="p-0.5 text-gray-300 hover:text-red-500 transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
        </div>
      </div>
    );
  };

  const renderKanban = () => (
    <div className="flex-1 overflow-x-auto pb-4">
      <div className="flex gap-3 h-full min-w-max pr-4">
        {STAGES.map((stage) => (
          <div
            key={stage.id}
            className="w-64 flex flex-col bg-gray-50/50 rounded-xl border border-gray-100"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, stage.id)}
          >
            <div className={`p-1.5 border-t-[3px] ${stage.color} bg-white rounded-t-xl border-b border-gray-100 mb-1.5`}>
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-gray-700 uppercase text-[9px] tracking-widest">{stage.label}</h3>
                <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {(groupedTasks[stage.id] || []).length}
                </span>
              </div>
            </div>
            <div className="flex-1 px-2.5 overflow-y-auto min-h-0 scrollbar-hide">
              {(groupedTasks[stage.id] || []).map(renderKanbanCard)}
              {(groupedTasks[stage.id] || []).length === 0 && (
                <div className="h-20 border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center text-[10px] text-gray-400 italic">
                  Empty Lane
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const tableData = data.map((row) => ({
    ...row,
    _actions: (
      <>
        <button onClick={() => setViewData(row)} className="btn-icon btn-sm text-blue-500 hover:text-blue-700" title="View">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <button onClick={() => { setEditTask(row); setFormOpen(true); }} className="btn-icon btn-sm" title="Edit">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={() => setDeleteId(row._id)} className="btn-icon btn-sm text-red-400 hover:text-red-600" title="Delete">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </>
    ),
  }));

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start relative h-full">
      <div className="flex-1 min-w-0 space-y-2 transition-all duration-300 w-full flex flex-col h-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
              <HelpIcon module="tasks" />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{pagination.total} total actionable tasks</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fetchData} className="btn-secondary p-2" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="flex bg-gray-900 rounded-lg p-1 gap-1">
              <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`} title="Kanban View">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>
              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`} title="Table View">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                </svg>
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`} title="Grid View">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md transition-all border ${showFilters || filters.search || filters.priority ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-400 hover:text-gray-600 border-gray-100 hover:border-gray-200'}`}
              title="Search & Filters"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <ColumnSettings columns={columns} onChange={setColumns} />
            <BulkUpload module="tasks" onSuccess={fetchData} />
            <ExportButton module="tasks" filters={filters} visibleColumns={columns.filter(c => !c.hidden).map(c => c.key)} />
            <button onClick={() => { setEditTask(null); setFormOpen(true); }} className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          </div>
        </div>

        {showFilters && (
          <FilterBar filters={filters} onChange={setFilters} fields={FILTER_FIELDS} />
        )}

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {viewMode === 'kanban' ? renderKanban() : viewMode === 'table' ? (
            <DataTable
              columns={columns}
              onColumnsChange={setColumns}
              data={tableData}
              loading={loading}
              pagination={pagination}
              onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              onLimitChange={(l) => setFilters((f) => ({ ...f, limit: l, page: 1 }))}
              onSort={(field, order) => {
                const sortStr = order === 'desc' ? `-${field}` : field;
                setFilters((f) => ({ ...f, sort: sortStr, page: 1 }));
              }}
              sortField={filters.sort?.replace('-', '') || 'createdAt'}
              sortOrder={filters.sort?.startsWith('-') ? 'desc' : 'asc'}
              selectedIds={selectedIds}
              onSelectAll={(checked) => setSelectedIds(checked ? data.map((r) => r._id) : [])}
              onSelectRow={(id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
              onBulkDelete={() => setBulkDeleteOpen(true)}
              onColumnFilterChange={setColFilters}
            />
          ) : (
            <DataGrid
              data={data}
              loading={loading}
              pagination={pagination}
              onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              onLimitChange={(l) => setFilters((f) => ({ ...f, limit: l, page: 1 }))}
              renderCard={(task) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
                return (
                  <div className="card p-3 shadow-md hover:shadow-lg transition-shadow h-full flex flex-col border-l-[3px] border-l-yellow-400">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-[11px] truncate leading-tight">{task.title}</p>
                      </div>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded shrink-0 border uppercase tracking-tighter ${statusColors[task.status]}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-[10px] text-gray-400 mb-2 flex-1 line-clamp-2 leading-tight">{task.description}</p>
                    )}

                    <div className="flex flex-col gap-1 mb-2 mt-auto pt-2 border-t border-gray-50/50">
                      {task.dueDate && (
                        <span className={`text-[9px] flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                          📅 {formatDate(task.dueDate)}
                        </span>
                      )}
                      <span className="text-[9px] text-gray-400 flex items-center gap-1">
                        👤 {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                      <span className={`text-[8px] font-extrabold px-1 py-0.5 rounded border uppercase tracking-tighter ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => setViewData(task)} className="text-gray-300 hover:text-blue-500 transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                        <button onClick={() => { setEditTask(task); setFormOpen(true); }} className="text-gray-300 hover:text-gray-600 transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                        <button onClick={() => setDeleteId(task._id)} className="text-gray-300 hover:text-red-500 transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          )}
        </div>
      </div>

      <ViewModal isOpen={!!viewData} onClose={() => setViewData(null)} data={viewData} title="Task Details" />
      <TaskForm isOpen={formOpen} onClose={() => { setFormOpen(false); setEditTask(null); }} task={editTask} onSuccess={fetchData} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Task" message="Are you sure you want to delete this task?" loading={deleting} />
      <ConfirmDialog isOpen={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} onConfirm={handleBulkDelete} title="Delete Tasks" message={`Delete ${selectedIds.length} tasks?`} loading={deleting} />
    </div>
  );
}
