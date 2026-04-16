import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

const DEPARTMENTS = [
  { label: 'Sales', value: 'sales' }, { label: 'Marketing', value: 'marketing' },
  { label: 'Engineering', value: 'engineering' }, { label: 'Support', value: 'support' },
  { label: 'HR', value: 'hr' }, { label: 'Finance', value: 'finance' },
  { label: 'Operations', value: 'operations' }, { label: 'Other', value: 'other' },
];
const STATUSES = [
  { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' },
  { label: 'On Leave', value: 'on_leave' },
];
const STATUS_COLORS = { active: 'success', inactive: 'danger', on_leave: 'warning' };
const DEPT_COLORS = { sales: '#3b82f6', marketing: '#8b5cf6', engineering: '#06b6d4', support: '#10b981', hr: '#f59e0b', finance: '#ef4444', operations: '#6366f1', other: '#6b7280' };

const EMPTY = { name: '', email: '', phone: '', department: 'other', position: '', salary: '', joinDate: '', status: 'active', notes: '' };

export default function Employees() {
  const { t } = useTranslation();
  const toast = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page + 1, limit: rows, sort: '-createdAt' });
      if (search) params.set('search', search);
      if (deptFilter) params.set('department', deptFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/employees?${params}`);
      setData(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [page, rows, search, deptFilter, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => { setEditItem(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (row) => { setEditItem(row); setForm({ ...row, joinDate: row.joinDate ? row.joinDate.slice(0, 10) : '' }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editItem) { await api.put(`/employees/${editItem._id}`, form); toast.success('Employee updated'); }
      else { await api.post('/employees', form); toast.success('Employee created'); }
      setDialogOpen(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete ${row.name}?`)) return;
    try { await api.delete(`/employees/${row._id}`); toast.success('Employee deleted'); fetchData(); }
    catch (err) { toast.error(err.message); }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target?.value ?? e.value ?? e }));

  return (
    <div className="flex flex-col h-full min-h-0 space-y-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('employees')}</h2>
          <p className="text-sm text-gray-500">{total} {t('total')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} className="p-inputtext-sm" style={{ width: 200 }} />
          </span>
          <Dropdown value={deptFilter} options={[{ label: 'All Departments', value: '' }, ...DEPARTMENTS]}
            onChange={(e) => setDeptFilter(e.value)} placeholder="Department" className="p-dropdown-sm" style={{ minWidth: 160 }} />
          <Dropdown value={statusFilter} options={[{ label: 'All Status', value: '' }, ...STATUSES]}
            onChange={(e) => setStatusFilter(e.value)} placeholder="Status" className="p-dropdown-sm" style={{ minWidth: 130 }} />
          <Button icon="pi pi-refresh" className="p-button-sm p-button-outlined" onClick={fetchData} tooltip={t('refresh')} />
          <Button icon="pi pi-plus" label={`${t('add')} Employee`} className="p-button-sm p-button-primary" onClick={openNew} />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 flex-1 overflow-hidden">
        <DataTable
          value={data} loading={loading} paginator rows={rows} totalRecords={total} lazy
          first={page * rows} onPage={(e) => { setPage(e.page); setRows(e.rows); }}
          rowsPerPageOptions={[10, 20, 50]} dataKey="_id"
          selection={selectedRows} onSelectionChange={(e) => setSelectedRows(e.value)}
          emptyMessage="No employees found" className="p-datatable-sm" size="small"
          scrollable scrollHeight="flex"
          rowHover stripedRows
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column header="#" body={(_, { rowIndex }) => <span className="text-gray-400 text-xs font-bold">{page * rows + rowIndex + 1}</span>} style={{ width: 48 }} />
          <Column field="name" header="Name" sortable
            body={(row) => (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: DEPT_COLORS[row.department] || '#6b7280' }}>
                  {row.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-xs">{row.name}</p>
                  <p className="text-[10px] text-gray-400">{row.position || '—'}</p>
                </div>
              </div>
            )}
          />
          <Column field="email" header="Email" body={(row) => (
            <a href={`mailto:${row.email}`} className="text-blue-600 hover:underline text-xs">{row.email}</a>
          )} />
          <Column field="phone" header="Phone" body={(row) => <span className="text-xs text-gray-600">{row.phone || '—'}</span>} />
          <Column field="department" header="Department" sortable
            body={(row) => (
              <span className="badge text-white text-[9px] px-2 py-0.5 rounded-md font-semibold capitalize"
                style={{ background: DEPT_COLORS[row.department] || '#6b7280' }}>{row.department}</span>
            )} />
          <Column field="status" header="Status" sortable
            body={(row) => <Tag severity={STATUS_COLORS[row.status]} value={row.status?.replace('_', ' ')} className="text-[9px]" />} />
          <Column field="salary" header="Salary" sortable
            body={(row) => <span className="text-xs font-semibold text-gray-700">{row.salary ? `$${Number(row.salary).toLocaleString()}` : '—'}</span>} />
          <Column field="joinDate" header="Join Date"
            body={(row) => <span className="text-xs text-gray-400">{row.joinDate ? new Date(row.joinDate).toLocaleDateString() : '—'}</span>} />
          <Column header="Actions" style={{ width: 100 }}
            body={(row) => (
              <div className="flex gap-1 justify-end">
                <Button icon="pi pi-pencil" className="p-button-sm p-button-text p-button-plain" onClick={() => openEdit(row)} />
                <Button icon="pi pi-trash" className="p-button-sm p-button-text p-button-danger" onClick={() => handleDelete(row)} />
              </div>
            )} />
        </DataTable>
      </div>

      {/* Dialog */}
      <Dialog header={editItem ? 'Edit Employee' : 'Add Employee'} visible={dialogOpen}
        onHide={() => setDialogOpen(false)} style={{ width: 540 }} modal draggable={false}>
        <div className="grid grid-cols-2 gap-4 p-2">
          {[['name', 'Full Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'text'], ['position', 'Position', 'text'], ['salary', 'Salary', 'number'], ['joinDate', 'Join Date', 'date']].map(([k, label, type]) => (
            <div key={k}>
              <label className="form-label">{label}</label>
              <input type={type} value={form[k] || ''} onChange={set(k)} className="form-input" />
            </div>
          ))}
          <div>
            <label className="form-label">Department</label>
            <select value={form.department} onChange={set('department')} className="form-input">
              {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select value={form.status} onChange={set('status')} className="form-input">
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="form-label">Notes</label>
            <textarea value={form.notes || ''} onChange={set('notes')} rows={2} className="form-input resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button label={t('cancel')} className="p-button-text p-button-sm" onClick={() => setDialogOpen(false)} />
          <Button label={saving ? 'Saving...' : t('save')} className="p-button-sm" onClick={handleSave} disabled={saving} icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'} />
        </div>
      </Dialog>
    </div>
  );
}
