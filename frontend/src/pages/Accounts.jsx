import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import AccountForm from '../components/forms/AccountForm';
import ViewModal from '../components/common/ViewModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import DataTable from '../components/common/DataTable';
import DataGrid from '../components/common/DataGrid';
import { formatDate, formatCurrency, buildColumnFilters } from '../utils/helpers';
import BulkUpload from '../components/common/BulkUpload';
import ExportButton from '../components/common/ExportButton';
import HelpIcon from '../components/common/HelpIcon';
import ColumnSettings from '../components/common/ColumnSettings';
import FilterBar from '../components/filters/FilterBar';

const COLUMNS = [
  {
    key: 'name', label: 'Account Name', type: 'text', sortable: true, render: (row, { setViewData }) => (
      <button onClick={() => setViewData(row)} className="font-bold text-gray-900 hover:text-blue-600 transition-colors">
        {row.name}
      </button>
    )
  },
  { key: 'industry', label: 'Industry', type: 'text', render: (row) => row.industry ? <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-tighter bg-blue-50 text-blue-700 border border-blue-200">{row.industry}</span> : '—' },
  { key: 'owner', label: 'Owner', type: 'text', render: (row) => row.owner?.name || 'Unassigned' },
  {
    key: 'createdAt', label: 'Created', type: 'date', sortable: true, render: (row) => (
      <span className="text-gray-400 text-xs">{formatDate(row.createdAt)}</span>
    )
  },
  {
    key: 'website', label: 'Website', type: 'text', render: (row) => row.website ? (
      <a href={row.website.startsWith('http') ? row.website : `https://${row.website}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
        {row.website.replace(/^https?:\/\//, '')}
      </a>
    ) : '—'
  }
];

const FILTER_FIELDS = [
  {
    key: 'industry', label: 'Industry', type: 'select', options: [
      'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Other'
    ].map(i => ({ value: i, label: i }))
  },
  {
    key: 'type', label: 'Type', type: 'select', options: [
      'Customer', 'Partner', 'Prospect', 'Vendor', 'Other'
    ].map(t => ({ value: t, label: t }))
  }
];

const defaultFilters = { search: '', industry: '', type: '', page: 1, limit: 20, sort: '-createdAt' };

export default function Accounts() {
  const [data, setAccounts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState(defaultFilters);
  const [colFilters, setColFilters] = useState({});
  const [columns, setColumns] = useState(COLUMNS);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState('table');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const toast = useToast();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      buildColumnFilters(params, colFilters);

      const res = await api.get(`/accounts?${params}`);
      setAccounts(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, colFilters, toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => { setSelectedIds([]); }, [filters, colFilters]);

  const handleDelete = async () => {
    try {
      await api.delete(`/accounts/${deleteId}`);
      toast.success('Account deleted successfully');
      setDeleteId(null);
      fetchAccounts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await api.delete('/accounts', { data: { ids: selectedIds } });
      toast.success(`${selectedIds.length} accounts deleted successfully`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      fetchAccounts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const memoizedColumns = useMemo(() => {
    return columns.map(col => {
      if (col.key === 'name') {
        return {
          ...col,
          render: (row) => (
            <button onClick={() => setViewData(row)} className="font-bold text-gray-900 hover:text-blue-600 transition-colors">
              {row.name}
            </button>
          )
        };
      }
      return col;
    });
  }, [columns]);

  const tableData = data.map(a => ({
    ...a,
    _actions: (
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => { setSelectedAccount(a); setFormOpen(true); }} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button onClick={() => setDeleteId(a._id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    )
  }));

  return (
    <div className="flex flex-col h-full min-h-0 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">Accounts</h2>
            <HelpIcon module="accounts" />
          </div>
          <p className="text-[11px] text-gray-500 font-medium">Manage companies and organizations</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchAccounts} className="btn-secondary p-2" title="Refresh">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewType('table')}
              className={`p-1.5 rounded-md transition-colors ${viewType === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Table View"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewType('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewType === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid View"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-md transition-all border ${showFilters || filters.search || filters.industry || filters.type ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-400 hover:text-gray-600 border-gray-100 hover:border-gray-200'}`}
            title="Search & Filters"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <ColumnSettings columns={columns} onChange={setColumns} />
          <BulkUpload module="accounts" onSuccess={fetchAccounts} />
          <ExportButton module="accounts" filters={filters} visibleColumns={columns.filter(c => !c.hidden).map(c => c.key)} />
          <button onClick={() => { setSelectedAccount(null); setFormOpen(true); }} className="btn-primary">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Account
          </button>
        </div>
      </div>


      {showFilters && (
        <FilterBar filters={filters} onChange={setFilters} fields={FILTER_FIELDS} />
      )}

      <div className="flex-1 flex flex-row min-h-0 overflow-hidden gap-2">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {viewType === 'table' ? (
            <DataTable
              columns={memoizedColumns}
              onColumnsChange={setColumns}
              data={tableData}
              loading={loading}
              pagination={pagination}
              onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
              onLimitChange={(l) => setFilters(prev => ({ ...prev, limit: l, page: 1 }))}
              onSort={(field, order) => {
                const sortStr = order === 'desc' ? `-${field}` : field;
                setFilters(prev => ({ ...prev, sort: sortStr, page: 1 }));
              }}
              sortField={filters.sort?.replace('-', '') || 'createdAt'}
              sortOrder={filters.sort?.startsWith('-') ? 'desc' : 'asc'}
              selectedIds={selectedIds}
              onSelectAll={(checked) => setSelectedIds(checked ? data.map(a => a._id) : [])}
              onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
              onBulkDelete={() => setBulkDeleteOpen(true)}
              onColumnFilterChange={setColFilters}
            />
          ) : (
            <div className="flex-1 min-h-0">
              <DataGrid
                data={data}
                loading={loading}
                pagination={pagination}
                onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
                onLimitChange={(l) => setFilters(prev => ({ ...prev, limit: l, page: 1 }))}
                renderCard={(account) => (
                  <div key={account._id} className="card p-2.5 shadow-md  hover:shadow-lg transition-shadow h-full flex flex-col group border-t-4 border-t-white hover:border-t-blue-500">
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-base shrink-0">
                        {account.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelectedAccount(account); setFormOpen(true); }} className="p-1 text-gray-400 hover:text-blue-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteId(account._id)} className="p-1 text-gray-400 hover:text-red-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <button onClick={() => setViewData(account)} className="block text-left w-full group-hover:text-blue-600 transition-colors">
                      <h3 className="font-bold text-gray-900 text-xs truncate">{account.name}</h3>
                    </button>
                    <div className="mb-2 flex">
                      {account.industry ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-tighter bg-blue-50 text-blue-700 border border-blue-200 truncate">
                          {account.industry}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">No industry</span>
                      )}
                    </div>

                    <div className="space-y-1 mt-auto">
                      {account.website && (
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span className="truncate">{account.website}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate">{account.owner?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
          )}
        </div>

        <ViewModal
          isOpen={!!viewData}
          onClose={() => setViewData(null)}
          data={viewData}
          title="Account Details"
          onModel="Account"
        />
      </div>

      <AccountForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        account={selectedAccount}
        onSuccess={fetchAccounts}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Account"
        message="Are you sure you want to delete this account? All associated data might be affected."
      />

      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Bulk Delete Accounts"
        message={`Are you sure you want to delete ${selectedIds.length} accounts? This action cannot be undone.`}
      />
    </div>
  );
}
