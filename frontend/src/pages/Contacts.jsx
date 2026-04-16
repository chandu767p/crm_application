import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/common/DataTable';
import DataGrid from '../components/common/DataGrid';
import FilterBar from '../components/filters/FilterBar';
import ContactForm from '../components/forms/ContactForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import BulkUpload from '../components/common/BulkUpload';
import ExportButton from '../components/common/ExportButton';
import ViewModal from '../components/common/ViewModal';
import HelpIcon from '../components/common/HelpIcon';
import ColumnSettings from '../components/common/ColumnSettings';
import { formatDate, getInitials, getAvatarColor, buildColumnFilters } from '../utils/helpers';

const COLUMNS = [
  {
    key: 'name', label: 'Name', type: 'text', sortable: true, render: (row) => (
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full ${getAvatarColor(row.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {getInitials(row.name)}
        </div>
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          {row.jobTitle && <p className="text-xs text-gray-400">{row.jobTitle}</p>}
        </div>
      </div>
    )
  },
  {
    key: 'email', label: 'Email', type: 'text', sortable: true, render: (row) => row.email ? (
      <a href={`mailto:${row.email}`} className="text-blue-600 hover:underline text-sm">{row.email}</a>
    ) : '—'
  },
  { key: 'phone', label: 'Phone', type: 'text', render: (row) => row.phone || '—' },
  {
    key: 'account', label: 'Account', type: 'text', sortable: true, render: (row) => (
      <span className="font-medium text-gray-700">{row.account?.name || '—'}</span>
    )
  },
  {
    key: 'assignedTo.name', label: 'Assigned To', type: 'text', render: (row) => (
      <span className="text-gray-500 text-sm">{row.assignedTo?.name || '—'}</span>
    )
  },
  {
    key: 'createdAt', label: 'Created', type: 'date', sortable: true, render: (row) => (
      <span className="text-gray-400 text-xs">{formatDate(row.createdAt)}</span>
    )
  },
];

const FILTER_FIELDS = [
  {
    key: 'active', label: 'Status', type: 'select', options: [
      { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' },
    ]
  },
  { key: 'tags', label: 'Tags', type: 'text', placeholder: 'Filter by tag...' },
];

const defaultFilters = { search: '', active: '', tags: '', page: 1, limit: 20, sort: '-createdAt' };

export default function Contacts() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState(defaultFilters);
  const [colFilters, setColFilters] = useState({});
  const [columns, setColumns] = useState(COLUMNS);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [selectedIds, setSelectedIds] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editContact, setEditContact] = useState(null);
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
      const res = await api.get(`/contacts?${params}`);
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
      await api.delete(`/contacts/${deleteId}`);
      toast.success('Contact deleted successfully');
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
      await api.delete('/contacts', { data: { ids: selectedIds } });
      toast.success(`${selectedIds.length} contacts deleted successfully`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
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
        <button onClick={() => { setEditContact(row); setFormOpen(true); }} className="btn-icon btn-sm" title="Edit">
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
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-2 transition-all duration-300 w-full flex flex-col h-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-900">Contacts</h2>
              <HelpIcon module="contacts" />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{pagination.total} total contacts</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fetchData} className="btn-secondary p-2" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                </svg>
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md transition-all border ${showFilters || filters.search || filters.account ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-400 hover:text-gray-600 border-gray-100 hover:border-gray-200'}`}
              title="Search & Filters"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <ColumnSettings columns={columns} onChange={setColumns} />
            <BulkUpload module="contacts" onSuccess={fetchData} />
            <ExportButton module="contacts" filters={filters} visibleColumns={columns.filter(c => !c.hidden).map(c => c.key)} />
            <button onClick={() => { setEditContact(null); setFormOpen(true); }} className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Contact
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
            renderCard={(contact) => (
              <div className="card p-2.5 shadow-md  hover:shadow-lg transition-shadow h-full flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full ${getAvatarColor(contact.name)} flex items-center justify-center text-xs text-white font-bold flex-shrink-0`}>
                    {getInitials(contact.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-xs truncate leading-tight">{contact.name}</p>
                    {contact.jobTitle && <p className="text-[10px] text-gray-400 truncate tracking-tight">{contact.jobTitle}</p>}
                  </div>
                </div>
                {contact.account?.name && (
                  <p className="text-xs font-medium text-gray-600 mb-0.5 truncate uppercase tracking-tighter">🏢 {contact.account.name}</p>
                )}
                {contact.email && (
                  <p className="text-[10px] text-blue-600 truncate mb-0.5">{contact.email}</p>
                )}
                {contact.phone && (
                  <p className="text-[10px] text-gray-500 mb-1.5">{contact.phone}</p>
                )}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {contact.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="badge bg-blue-50 text-blue-600">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-2 border-t border-gray-100 flex gap-2">
                  <button onClick={() => setViewData(contact)} className="btn-secondary btn-sm flex-1 justify-center">View</button>
                  <button onClick={() => { setEditContact(contact); setFormOpen(true); }} className="btn-secondary btn-sm flex-1 justify-center">Edit</button>
                  <button onClick={() => setDeleteId(contact._id)} className="btn-danger btn-sm flex-1 justify-center">Delete</button>
                </div>
              </div>
            )}
          />
        )}

      </div> {/* End Main Content Area */}

      {/* Side View Panel */}
      <ViewModal
        isOpen={!!viewData}
        onClose={() => setViewData(null)}
        data={viewData}
        title="Contact Details"
        onModel="Contact"
      />

      {/* Modals */}
      <ContactForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditContact(null); }}
        contact={editContact}
        onSuccess={fetchData}
      />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Contact" message="Are you sure you want to delete this contact?" loading={deleting} />
      <ConfirmDialog isOpen={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} onConfirm={handleBulkDelete}
        title="Delete Selected Contacts" message={`Delete ${selectedIds.length} contacts?`} loading={deleting} />
    </div>
  );
}
