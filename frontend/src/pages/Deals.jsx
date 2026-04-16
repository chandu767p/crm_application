import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import DealForm from '../components/forms/DealForm';
import ViewModal from '../components/common/ViewModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency, formatDate, getInitials, getAvatarColor, buildColumnFilters } from '../utils/helpers';
import DataTable from '../components/common/DataTable';
import DataGrid from '../components/common/DataGrid';
import FilterBar from '../components/filters/FilterBar';
import BulkUpload from '../components/common/BulkUpload';
import ExportButton from '../components/common/ExportButton';
import HelpIcon from '../components/common/HelpIcon';
import ColumnSettings from '../components/common/ColumnSettings';
const STAGES = [
  { id: 'prospect', label: 'Prospect', color: 'border-gray-300' },
  { id: 'qualified', label: 'Qualified', color: 'border-blue-300' },
  { id: 'proposal', label: 'Proposal', color: 'border-purple-300' },
  { id: 'negotiation', label: 'Negotiation', color: 'border-orange-300' },
  { id: 'won', label: 'Won', color: 'border-green-300' },
  { id: 'lost', label: 'Lost', color: 'border-red-300' },
];

const COLUMNS = [
  {
    key: 'name', label: 'Name', type: 'text', sortable: true, render: (row) => (
      <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
        {row.name}
      </span>
    )
  },
  {
    key: 'stage', label: 'Stage', type: 'text', sortable: true,
    options: STAGES.map(s => ({ value: s.id, label: s.label })),
    render: (row) => {
      const stage = STAGES.find(s => s.id === row.stage);
      return (
        <span className={`badge ${row.stage === 'won' ? 'bg-green-100 text-green-700' :
          row.stage === 'lost' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
          {stage?.label || row.stage}
        </span>
      );
    }
  },
  {
    key: 'value', label: 'Value', sortable: true, type: 'number', render: (row) => (
      <span className="font-bold text-gray-800">{formatCurrency(row.value)}</span>
    )
  },
  {
    key: 'probability', label: 'Prob.', sortable: true, type: 'number', render: (row) => (
      <span className={`badge ${row.probability >= 80 ? 'bg-green-100 text-green-700' :
        row.probability >= 40 ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
        {row.probability}%
      </span>
    )
  },
  {
    key: 'contact', label: 'Contact', render: (row) => (
      row.contact ? (
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full ${getAvatarColor(row.contact.name)} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
            {getInitials(row.contact.name)}
          </div>
          <span className="text-sm text-gray-600 truncate">{row.contact.name}</span>
        </div>
      ) : '—'
    )
  },
  {
    key: 'expectedCloseDate', label: 'Expected Close', sortable: true, type: 'date', render: (row) => (
      <span className="text-gray-500 text-xs">
        {row.expectedCloseDate ? formatDate(row.expectedCloseDate) : '—'}
      </span>
    )
  },
  {
    key: 'assignedTo', label: 'Assigned To', render: (row) => (
      <span className="text-gray-500 text-xs">{row.assignedTo?.name || '—'}</span>
    )
  },
];

const FILTER_FIELDS = [
  { key: 'stage', label: 'Stage', type: 'select', options: STAGES.map(s => ({ value: s.id, label: s.label })) },
];

const defaultFilters = { search: '', stage: '', page: 1, limit: 20, sort: '-createdAt' };


export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState(defaultFilters);
  const [colFilters, setColFilters] = useState({});
  const [columns, setColumns] = useState(COLUMNS);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('deals_viewMode') || 'kanban'); // 'kanban', 'table', 'grid'
  const [selectedIds, setSelectedIds] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const toast = useToast();

  useEffect(() => {
    localStorage.setItem('deals_viewMode', viewMode);
  }, [viewMode]);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Adapt limit if in Kanban mode to show full board
      const queryParams = { ...filters };
      if (viewMode === 'kanban') {
        queryParams.limit = 100;
        queryParams.page = 1;
      }

      Object.entries(queryParams).forEach(([k, v]) => { if (v) params.set(k, v); });
      buildColumnFilters(params, colFilters);

      const res = await api.get(`/deals?${params}`);

      setDeals(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, colFilters, viewMode, toast]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => { setSelectedIds([]); }, [filters, colFilters, viewMode]);

  const onDragStart = (e, dealId) => {
    e.dataTransfer.setData('dealId', dealId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, targetStage) => {
    const dealId = e.dataTransfer.getData('dealId');
    const deal = deals.find((d) => d._id === dealId);

    if (!deal || deal.stage === targetStage) return;

    // Optimistic update
    const updatedDeals = deals.map((d) =>
      d._id === dealId ? { ...d, stage: targetStage } : d
    );
    setDeals(updatedDeals);

    try {
      await api.put(`/deals/${dealId}`, { stage: targetStage });
      toast.success(`Moved to ${targetStage}`);
    } catch (err) {
      toast.error('Failed to move deal');
      fetchDeals(); // Revert on failure
    }
  };

  const groupedDeals = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage.id] = deals.filter((d) => d.stage === stage.id);
      return acc;
    }, {});
  }, [deals]);

  const stageStats = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      const stageDeals = groupedDeals[stage.id] || [];
      const totalValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const weightedValue = stageDeals.reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0) / 100), 0);
      acc[stage.id] = { count: stageDeals.length, totalValue, weightedValue };
      return acc;
    }, {});
  }, [groupedDeals]);
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/deals/${deleteId}`);
      toast.success('Deal deleted successfully');
      setDeleteId(null);
      fetchDeals();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await api.delete('/deals', { data: { ids: selectedIds } });
      toast.success(`${selectedIds.length} deals deleted successfully`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      fetchDeals();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const tableData = deals.map((row) => ({
    ...row,
    _actions: (
      <>
        <button onClick={() => setViewData(row)} className="btn-icon btn-sm text-blue-500 hover:text-blue-700" title="View">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <button onClick={() => { setSelectedDeal(row); setFormOpen(true); }} className="btn-icon btn-sm" title="Edit">
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

  const renderKanban = () => (
    <div className="flex-1 overflow-x-auto pb-4">
      <div className="flex gap-3 h-full min-w-max">
        {STAGES.map((stage) => (
          <div
            key={stage.id}
            className="w-64 flex flex-col bg-gray-50 rounded-xl border border-gray-200"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, stage.id)}
          >
            {/* Stage Header */}
            <div className={`p-1.5 border-t-[3px] ${stage.color} bg-white rounded-t-xl border-b border-gray-100`}>
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="font-extrabold text-gray-700 text-[9px] tracking-widest uppercase">
                  {stage.label}
                </h3>
                <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {stageStats[stage.id].count}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-900">
                  {formatCurrency(stageStats[stage.id].totalValue)}
                </span>
                <span className="text-[8px] text-gray-400 font-medium">
                  W: {formatCurrency(stageStats[stage.id].weightedValue)}
                </span>
              </div>
            </div>

            {/* Vertical Scroll Area for Column */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
              {groupedDeals[stage.id].map((deal) => (
                <div
                  key={deal._id}
                  draggable
                  onDragStart={(e) => onDragStart(e, deal._id)}
                  className="card p-2 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-[11px] text-gray-900 group-hover:text-blue-600 transition-colors truncate flex-1 leading-tight">
                      {deal.name}
                    </p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <button onClick={() => setViewData(deal)} className="p-0.5 text-gray-300 hover:text-blue-500 transition-colors">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-gray-900">
                      {formatCurrency(deal.value)}
                    </span>
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border tracking-tighter ${deal.probability >= 80 ? 'bg-green-50 text-green-700 border-green-100' :
                      deal.probability >= 40 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-gray-50 text-gray-700 border-gray-100'
                      }`}>
                      {deal.probability}%
                    </span>
                  </div>

                  <div className="space-y-0.5 pt-1.5 border-t border-gray-50/50">
                    {deal.contact && (
                      <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-medium">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate">{deal.contact.name}</span>
                      </div>
                    )}
                    {deal.expectedCloseDate && (
                      <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(deal.expectedCloseDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {groupedDeals[stage.id].length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg h-32 flex items-center justify-center text-gray-400 text-xs italic">
                  Empty Lane
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`h-full min-h-0 flex flex-col ${viewMode !== 'kanban' ? 'space-y-2' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div>
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-gray-900">Deals Pipeline</h2>
            <HelpIcon module="deals" />
          </div>
          <p className="text-sm text-gray-500 mt-0">
            {viewMode === 'kanban' ? `Visualizing ${deals.length} active opportunities` : `${pagination.total} total deals`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchDeals} className="btn-secondary p-2" title="Refresh">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <div className="flex bg-gray-100  rounded-lg p-1 gap-1">
            <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`} title="Board View">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`} title="Table View">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
              </svg>
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`} title="Cards View">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-md transition-all border ${showFilters || filters.search || filters.stage || filters.type ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-400 hover:text-gray-600 border-gray-100 hover:border-gray-200'}`}
            title="Search & Filters"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <ColumnSettings columns={columns} onChange={setColumns} />
          <BulkUpload module="deals" onSuccess={fetchDeals} />
          <ExportButton module="deals" filters={filters} visibleColumns={columns.filter(c => !c.hidden).map(c => c.key)} />
          <button
            onClick={() => { setSelectedDeal(null); setFormOpen(true); }}
            className="btn-primary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Deal
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="shrink-0">
          <FilterBar filters={filters} onChange={setFilters} fields={FILTER_FIELDS} />
        </div>
      )}

      <div className="flex-1 flex flex-row min-h-0 overflow-hidden gap-2">
        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${viewMode !== 'kanban' ? 'space-y-2' : ''}`}>
          {loading && viewMode !== 'kanban' ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {viewMode === 'kanban' && renderKanban()}

              {viewMode === 'table' && (
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
                  onSelectAll={(checked) => setSelectedIds(checked ? deals.map((r) => r._id) : [])}
                  onSelectRow={(id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
                  onBulkDelete={() => setBulkDeleteOpen(true)}
                  onColumnFilterChange={setColFilters}
                />
              )}

              {viewMode === 'grid' && (
                <div className="flex-1 overflow-y-auto min-h-0">
                  <DataGrid
                    data={deals}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
                    onLimitChange={(l) => setFilters((f) => ({ ...f, limit: l, page: 1 }))}
                    renderCard={(deal) => (
                      <div key={deal._id} className="card p-2.5 shadow-md  hover:shadow-lg transition-shadow h-full flex flex-col group border-t-4 border-t-blue-500">
                        <div className="flex justify-between items-start mb-1.5">
                          <h3 className="font-bold text-gray-900 text-xs group-hover:text-blue-600 transition-colors truncate leading-tight">{deal.name}</h3>
                          <span className={`badge shrink-0 text-[10px] font-bold ${deal.probability >= 80 ? 'bg-green-100 text-green-700' :
                            deal.probability >= 40 ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                            {deal.probability}%
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 mb-3">
                          <span className="text-sm font-bold text-gray-800">{formatCurrency(deal.value)}</span>
                          <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">{STAGES.find(s => s.id === deal.stage)?.label}</span>
                        </div>
                        <div className="space-y-1 mb-3 mt-auto">
                          {deal.contact && (
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                              <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              <span className="truncate">{deal.contact.name}</span>
                            </div>
                          )}
                          {deal.expectedCloseDate && (
                            <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-medium italic">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span>{formatDate(deal.expectedCloseDate)}</span>
                            </div>
                          )}
                        </div>
                        <div className="pt-3 border-t border-gray-100 flex gap-2">
                          <button onClick={() => setViewData(deal)} className="btn-secondary btn-sm flex-1 justify-center">View</button>
                          <button onClick={() => { setSelectedDeal(deal); setFormOpen(true); }} className="btn-secondary btn-sm flex-1 justify-center">Edit</button>
                          <button onClick={() => setDeleteId(deal._id)} className="btn-danger btn-sm px-2 text-red"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <ViewModal
          isOpen={!!viewData}
          onClose={() => setViewData(null)}
          data={viewData}
          title="Deal Details"
          onModel="Deal"
        />
      </div>

      {/* Modals */}
      <DealForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setSelectedDeal(null); }}
        deal={selectedDeal}
        onSuccess={fetchDeals}
      />
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Deal"
        message="Are you sure you want to delete this deal? This action cannot be undone."
        loading={deleting}
      />
      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Deals"
        message={`Are you sure you want to delete ${selectedIds.length} deals?`}
        loading={deleting}
      />
    </div>
  );
}
