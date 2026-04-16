import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/common/DataTable';
import FilterBar from '../components/filters/FilterBar';
import RoleForm from '../components/forms/RoleForm';
import HelpIcon from '../components/common/HelpIcon';
import ExportButton from '../components/common/ExportButton';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ViewModal from '../components/common/ViewModal';
import ColumnSettings from '../components/common/ColumnSettings';
import { formatDate } from '../utils/helpers';

const COLUMNS = [
  { key: 'name', label: 'Role Name', sortable: true, render: (row) => (
    <span className="font-medium text-gray-900">{row.name}</span>
  )},
  { key: 'description', label: 'Description', render: (row) => (
    <span className="text-gray-500 truncate max-w-xs">{row.description || '-'}</span>
  )},
  { key: 'permissions', label: 'Permissions', render: (row) => {
    const SCREENS_ORDER = ['dashboard', 'leads', 'deals', 'accounts', 'contacts', 'users', 'roles', 'calls', 'emails', 'meetings', 'tickets', 'tasks'];
    const sorted = [...(row.permissions || [])].sort((a, b) => {
      const indexA = SCREENS_ORDER.indexOf(a);
      const indexB = SCREENS_ORDER.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    return (
      <div className="flex flex-wrap gap-1 max-w-[300px]">
        {sorted.map(p => (
          <span key={p} className="badge bg-blue-50 text-blue-700 capitalize text-[10px]">{p}</span>
        ))}
        {!sorted.length && <span className="text-gray-400 text-xs">None</span>}
      </div>
    );
  }},
  { key: 'createdAt', label: 'Created', sortable: true, render: (row) => <span className="text-gray-400 text-xs">{formatDate(row.createdAt)}</span> },
];

const FILTER_FIELDS = [];

const defaultFilters = { search: '', page: 1, limit: 10, sort: 'name' };

export default function Roles() {
  const [data, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [deleteId, setDeleteId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [columns, setColumns] = useState(COLUMNS);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await api.get(`/roles?${params}`);
      setRoles(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setSelectedIds([]); }, [filters]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/roles/${deleteId}`);
      toast.success('Role deleted successfully');
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
      await api.delete('/roles', { data: { ids: selectedIds } });
      toast.success(`${selectedIds.length} roles deleted successfully`);
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
        <button onClick={() => { setEditRole(row); setFormOpen(true); }} className="btn-icon btn-sm" title="Edit">
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
    <div className="flex flex-col xl:flex-row gap-6 items-start relative">
      <div className="flex-1 min-w-0 space-y-4 transition-all duration-300 w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-900">Roles</h2>
              <HelpIcon module="roles" />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{pagination.total} total roles</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fetchData} className="btn-secondary p-2" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`p-2 rounded-md transition-all border ${showFilters || filters.search ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-400 hover:text-gray-600 border-gray-100 hover:border-gray-200'}`}
              title="Search & Filters"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <ColumnSettings columns={columns} onChange={setColumns} />
            <ExportButton module="roles" filters={filters} visibleColumns={columns.filter(c => !c.hidden).map(c => c.key)} />
            <button
              onClick={() => { setEditRole(null); setFormOpen(true); }}
              className="btn-primary"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Role
            </button>
          </div>
        </div>

        {showFilters && (
          <FilterBar filters={filters} onChange={setFilters} fields={FILTER_FIELDS} />
        )}

        <DataTable
          columns={columns}
          onColumnsChange={setColumns}
          data={tableData}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          onLimitChange={(l) => setFilters((f) => ({ ...f, limit: l, page: 1 }))}
          onSort={(field, order) => setFilters((f) => ({ ...f, sortField: field, sortOrder: order }))}
          sortField={filters.sortField}
          sortOrder={filters.sortOrder}
          selectedIds={selectedIds}
          onSelectAll={(checked) => setSelectedIds(checked ? data.map((r) => r._id) : [])}
          onSelectRow={(id) => setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
          )}
          onBulkDelete={() => setBulkDeleteOpen(true)}
        />
      </div>

      <ViewModal
        isOpen={!!viewData}
        onClose={() => setViewData(null)}
        data={viewData}
        title="Role Details"
      />

      <RoleForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditRole(null); }}
        role={editRole}
        onSuccess={fetchData}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Role"
        message="Are you sure you want to delete this role? This might crash users assigned to it!"
        loading={deleting}
      />

      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Roles"
        message={`Are you sure you want to delete ${selectedIds.length} select roles?`}
        loading={deleting}
      />
    </div>
  );
}
