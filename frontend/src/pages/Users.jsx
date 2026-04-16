import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import DataGrid from '../components/common/DataGrid';
import FilterBar from '../components/filters/FilterBar';
import UserForm from '../components/forms/UserForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import BulkUpload from '../components/common/BulkUpload';
import ExportButton from '../components/common/ExportButton';
import ViewModal from '../components/common/ViewModal';
import HelpIcon from '../components/common/HelpIcon';
import ColumnSettings from '../components/common/ColumnSettings';
import { formatDate, statusColors, capitalize, getInitials, getAvatarColor, buildColumnFilters } from '../utils/helpers';

const COLUMNS = [
  {
    key: 'name', label: 'Name', type: 'text', sortable: true, render: (row) => (
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full ${getAvatarColor(row.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {getInitials(row.name)}
        </div>
        <span className="font-medium text-gray-900">{row.name}</span>
      </div>
    )
  },
  { key: 'email', label: 'Email', type: 'text', sortable: true },
  {
    key: 'role.name', label: 'Role', type: 'text', sortable: true, render: (row) => (
      <span className={`badge ${statusColors[row.role?.name?.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>{capitalize(row.role?.name || '-')}</span>
    )
  },
  {
    key: 'active', label: 'Status', type: 'text', render: (row) => (
      <span className={`badge ${row.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {row.active ? 'Active' : 'Inactive'}
      </span>
    )
  },
  { key: 'lastLogin', label: 'Last Login', type: 'date', render: (row) => <span className="text-gray-400 text-xs">{formatDate(row.lastLogin)}</span> },
  { key: 'createdAt', label: 'Created', type: 'date', sortable: true, render: (row) => <span className="text-gray-400 text-xs">{formatDate(row.createdAt)}</span> },
];

const FILTER_FIELDS = [
  {
    key: 'active', label: 'Status', type: 'select', options: [
      { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' },
    ]
  },
];

const defaultFilters = { search: '', role: '', active: '', page: 1, limit: 20, sortField: 'createdAt', sortOrder: 'desc' };

export default function Users() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState(defaultFilters);
  const [colFilters, setColFilters] = useState({});
  const [columns, setColumns] = useState(COLUMNS);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [selectedIds, setSelectedIds] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const toast = useToast();
  const { user: currentUser } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      buildColumnFilters(params, colFilters);
      const res = await api.get(`/users?${params}`);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setSelectedIds([]); }, [filters, colFilters]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteId}`);
      toast.success('User deleted successfully');
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
      await api.delete('/users', { data: { ids: selectedIds } });
      toast.success(`${selectedIds.length} users deleted successfully`);
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
        <button
          onClick={() => { setEditUser(row); setFormOpen(true); }}
          className="btn-icon btn-sm"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        {row._id !== currentUser?.id && (
          <button onClick={() => setDeleteId(row._id)} className="btn-icon btn-sm text-red-400 hover:text-red-600" title="Delete">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </>
    ),
  }));

  const roleName = typeof currentUser?.role === 'string' ? currentUser?.role : (currentUser?.role?.name || '');
  const canEditUsers = currentUser?.role?.permissions?.includes('users') || roleName.toLowerCase() === 'admin';

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start relative h-full">
      <div className="flex-1 min-w-0 space-y-4 transition-all duration-300 w-full flex flex-col h-full">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-900">Users</h2>
              <HelpIcon module="users" />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{pagination.total} total users</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fetchData} className="btn-secondary p-2" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {/* View toggle */}
            <div className="flex bg-gray-900 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md transition-all border ${showFilters || filters.search || filters.role || filters.status ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-400 hover:text-gray-600 border-gray-100 hover:border-gray-200'}`}
              title="Search & Filters"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <ColumnSettings columns={columns} onChange={setColumns} />
            {canEditUsers && <BulkUpload module="users" onSuccess={fetchData} />}
            <ExportButton module="users" filters={filters} visibleColumns={columns.filter(c => !c.hidden).map(c => c.key)} />
            {canEditUsers && (
              <button
                onClick={() => { setEditUser(null); setFormOpen(true); }}
                className="btn-primary"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add User
              </button>
            )}
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
            onSort={(field, order) => setFilters((f) => ({ ...f, sortField: field, sortOrder: order }))}
            sortField={filters.sortField}
            sortOrder={filters.sortOrder}
            selectedIds={selectedIds}
            onSelectAll={(checked) => setSelectedIds(checked ? data.map((r) => r._id) : [])}
            onSelectRow={(id) => setSelectedIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )}
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
            renderCard={(user) => (
              <div className="card p-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white font-bold`}>
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`badge ${statusColors[user.role?.name?.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>{capitalize(user.role?.name || '-')}</span>
                  <span className={`badge ${user.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Joined {formatDate(user.createdAt)}</p>
                {canEditUsers && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => setViewData(user)} className="btn-secondary btn-sm flex-1 justify-center">View</button>
                    <button onClick={() => { setEditUser(user); setFormOpen(true); }} className="btn-secondary btn-sm flex-1 justify-center">Edit</button>
                    {user._id !== currentUser?.id && (
                      <button onClick={() => setDeleteId(user._id)} className="btn-danger btn-sm flex-1 justify-center">Delete</button>
                    )}
                  </div>
                )}
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
        title="User Details"
      />

      {/* Modals */}
      <UserForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditUser(null); }}
        user={editUser}
        onSuccess={fetchData}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        loading={deleting}
      />

      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Users"
        message={`Are you sure you want to delete ${selectedIds.length} selected users? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}
