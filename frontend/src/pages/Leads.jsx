import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/common/DataTable';
import DataGrid from '../components/common/DataGrid';
import FilterBar from '../components/filters/FilterBar';
import LeadForm from '../components/forms/LeadForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import BulkUpload from '../components/common/BulkUpload';
import ExportButton from '../components/common/ExportButton';
import LeadDetailView from '../components/leads/LeadDetailView';
import HelpIcon from '../components/common/HelpIcon';
import ColumnSettings from '../components/common/ColumnSettings';
import { formatDate, formatCurrency, statusColors, sourceColors, capitalize, buildColumnFilters } from '../utils/helpers';

const COLUMNS = [
  {
    key: 'name', label: 'Name', type: 'text', sortable: true, render: (row) => (
      <div>
        <p className="font-medium text-gray-900">{row.name}</p>
        {row.account?.name && <p className="text-xs text-gray-400">{row.account.name}</p>}
      </div>
    )
  },
  {
    key: 'email', label: 'Email', type: 'text', sortable: true, render: (row) => row.email ? (
      <a href={`mailto:${row.email}`} className="text-blue-600 hover:underline">{row.email}</a>
    ) : '—'
  },
  { key: 'phone', label: 'Phone', type: 'text', render: (row) => row.phone || '—' },
  {
    key: 'status', label: 'Status', type: 'text', sortable: true,
    options: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map(s => ({ value: s, label: capitalize(s) })),
    render: (row) => (
      <span className={`badge ${statusColors[row.status] || 'bg-gray-100 text-gray-600'}`}>{capitalize(row.status)}</span>
    )
  },
  {
    key: 'source', label: 'Source', type: 'text',
    options: ['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'event', 'other'].map(s => ({ value: s, label: capitalize(s) })),
    render: (row) => (
      <span className={`badge ${sourceColors[row.source] || 'bg-gray-100 text-gray-600'}`}>
        {capitalize(row.source)}
      </span>
    )
  },
  {
    key: 'value', label: 'Value', sortable: true, type: 'number', render: (row) => (
      <span className="font-medium text-gray-700">{formatCurrency(row.value)}</span>
    )
  },
  {
    key: 'assignedTo', label: 'Assigned To', render: (row) => (
      <span className="text-gray-500">{row.assignedTo?.name || '—'}</span>
    )
  },
  {
    key: 'createdAt', label: 'Created', sortable: true, type: 'date', render: (row) => (
      <span className="text-gray-400 text-xs">{formatDate(row.createdAt)}</span>
    )
  },
];

const FILTER_FIELDS = [
  {
    key: 'status', label: 'Status', type: 'select', options: [
      'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'
    ].map((s) => ({ value: s, label: capitalize(s) }))
  },
  {
    key: 'source', label: 'Source', type: 'select', options: [
      'website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'event', 'other'
    ].map((s) => ({ value: s, label: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }))
  },
];

const defaultFilters = { search: '', status: '', source: '', page: 1, limit: 20, sort: '-createdAt' };

export default function Leads() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState(defaultFilters);
  const [colFilters, setColFilters] = useState({});
  const [columns, setColumns] = useState(COLUMNS);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [selectedIds, setSelectedIds] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState(null);
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
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      buildColumnFilters(params, colFilters);
      const res = await api.get(`/leads?${params}`);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, colFilters]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setSelectedIds([]); }, [filters, colFilters]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/leads/${deleteId}`);
      toast.success('Lead deleted successfully');
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
      await api.delete('/leads', { data: { ids: selectedIds } });
      toast.success(`${selectedIds.length} leads deleted successfully`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleConvert = async (lead) => {
    if (lead.status === 'won') {
      toast.error('Lead is already converted (won).');
      return;
    }
    if (!window.confirm(`Are you sure you want to convert ${lead.name} to a Contact?`)) return;

    try {
      await api.post(`/leads/${lead._id}/convert`);
      toast.success('Lead successfully converted to Contact!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

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
        <button onClick={() => { setEditLead(row); setFormOpen(true); }} className="btn-icon btn-sm" title="Edit">
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
        {row.status !== 'won' && (
          <button onClick={() => handleConvert(row)} className="btn-icon btn-sm text-green-500 hover:text-green-700" title="Convert to Contact">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        )}
      </>
    ),
  }));

  return (
    <div className="flex flex-col h-full min-h-0 space-y-2">
      {viewData ? (
        <LeadDetailView
          lead={viewData}
          onBack={() => {
            setViewData(null);
            fetchData();
          }}
          onUpdate={(updatedLead) => {
            setData((prev) => prev.map((l) => (l._id === updatedLead._id ? updatedLead : l)));
            setViewData(updatedLead);
          }}
          onDelete={(lead) => {
            setDeleteId(lead._id);
            setViewData(null);
          }}
        />
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-gray-900">Leads</h2>
                <HelpIcon module="leads" />
              </div>
              <p className="text-sm text-gray-500 mt-0">{pagination.total} total leads</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={fetchData} className="btn-secondary p-2" title="Refresh">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <div className="flex bg-gray-900 rounded-lg p-1 gap-1">
                <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`} title="Table View">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                  </svg>
                </button>
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`} title="Cards View">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-md transition-all border ${showFilters || filters.search || filters.status || filters.source ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-400 hover:text-gray-600 border-gray-100 hover:border-gray-200'}`}
                title="Search & Filters"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <ColumnSettings columns={columns} onChange={setColumns} />
              <BulkUpload module="leads" onSuccess={fetchData} />
              <ExportButton module="leads" filters={filters} visibleColumns={columns.filter(c => !c.hidden).map(c => c.key)} />
              <button onClick={() => { setEditLead(null); setFormOpen(true); }} className="btn-primary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Lead
              </button>
            </div>
          </div>

          {showFilters && (
            <FilterBar filters={filters} onChange={setFilters} fields={FILTER_FIELDS} />
          )}

          {viewMode === 'table' ? (
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
              renderCard={(lead) => (
                <div className="card p-2.5 shadow-md  hover:shadow-lg transition-shadow h-full">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-xs truncate leading-tight">{lead.name}</p>
                      {lead.account?.name && <p className="text-[10px] text-gray-400 truncate">{lead.account.name}</p>}
                    </div>
                    <span className={`badge ml-2 flex-shrink-0 ${statusColors[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                      {capitalize(lead.status)}
                    </span>
                  </div>
                  {lead.email && <p className="text-[10px] text-blue-600 truncate mb-0.5">{lead.email}</p>}
                  {lead.phone && <p className="text-[10px] text-gray-500 mb-1.5">{lead.phone}</p>}
                  <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-gray-700">{formatCurrency(lead.value)}</span>
                    <span className="text-[9px] font-semibold text-gray-400 tracking-tighter uppercase">{lead.source}</span>
                  </div>
                  {lead.assignedTo && (
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">👤 {lead.assignedTo.name}</p>
                  )}
                  <div className="flex gap-1 mt-2 pt-2 border-t border-gray-100">
                    <button onClick={() => setViewData(lead)} className="btn-secondary btn-sm flex-1 justify-center py-0.5 text-[10px]">View</button>
                    {lead.status !== 'won' && (
                      <button onClick={() => handleConvert(lead)} className="btn-secondary btn-sm flex-1 justify-center py-0.5 text-[10px] text-green-600 hover:bg-green-50">Convert</button>
                    )}
                    <button onClick={() => { setEditLead(lead); setFormOpen(true); }} className="btn-secondary btn-sm flex-1 justify-center py-0.5 text-[10px]">Edit</button>
                    <button onClick={() => setDeleteId(lead._id)} className="btn-danger btn-sm px-1.5 py-0.5 justify-center">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <LeadForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditLead(null); }}
        lead={editLead}
        onSuccess={fetchData}
      />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Lead" message="Are you sure you want to delete this lead?" loading={deleting} />
      <ConfirmDialog isOpen={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} onConfirm={handleBulkDelete}
        title="Delete Selected Leads" message={`Delete ${selectedIds.length} leads?`} loading={deleting} />
    </div>
  );
}
