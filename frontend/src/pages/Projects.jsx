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
import { ProgressBar } from 'primereact/progressbar';

const STATUSES = [
  { label: 'Planning', value: 'planning' }, { label: 'Active', value: 'active' },
  { label: 'On Hold', value: 'on_hold' }, { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];
const PRIORITIES = [
  { label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' }, { label: 'Critical', value: 'critical' },
];
const STATUS_COLORS = { planning: 'info', active: 'success', on_hold: 'warning', completed: null, cancelled: 'danger' };
const PRIORITY_COLORS = { low: 'info', medium: 'warning', high: 'danger', critical: 'danger' };
const PRIORITY_BG = { low: '#3b82f6', medium: '#f59e0b', high: '#ef4444', critical: '#7f1d1d' };

const EMPTY = { name: '', description: '', status: 'planning', priority: 'medium', startDate: '', endDate: '', budget: '', progress: 0, tags: '' };

export default function Projects() {
  const { t } = useTranslation();
  const toast = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/users?limit=100').then(r => setUsers(r.data.data || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page + 1, limit: rows, sort: '-createdAt' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      const res = await api.get(`/projects?${params}`);
      setData(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [page, rows, search, statusFilter, priorityFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => { setEditItem(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (row) => {
    setEditItem(row);
    setForm({ ...row, startDate: row.startDate?.slice(0, 10) || '', endDate: row.endDate?.slice(0, 10) || '', tags: row.tags?.join(', ') || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
      if (editItem) { await api.put(`/projects/${editItem._id}`, payload); toast.success('Project updated'); }
      else { await api.post('/projects', payload); toast.success('Project created'); }
      setDialogOpen(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    try { await api.delete(`/projects/${row._id}`); toast.success('Project deleted'); fetchData(); }
    catch (err) { toast.error(err.message); }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target?.value ?? e.value ?? e }));

  return (
    <div className="flex flex-col h-full min-h-0 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('projects')}</h2>
          <p className="text-sm text-gray-500">{total} {t('total')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} className="p-inputtext-sm" style={{ width: 200 }} />
          </span>
          <Dropdown value={statusFilter} options={[{ label: 'All Status', value: '' }, ...STATUSES]}
            onChange={(e) => setStatusFilter(e.value)} placeholder="Status" className="p-dropdown-sm" style={{ minWidth: 140 }} />
          <Dropdown value={priorityFilter} options={[{ label: 'All Priorities', value: '' }, ...PRIORITIES]}
            onChange={(e) => setPriorityFilter(e.value)} placeholder="Priority" className="p-dropdown-sm" style={{ minWidth: 140 }} />
          <Button icon="pi pi-refresh" className="p-button-sm p-button-outlined" onClick={fetchData} />
          <Button icon="pi pi-plus" label={`${t('add')} Project`} className="p-button-sm" onClick={openNew} />
        </div>
      </div>

      <div className="card p-0 flex-1 overflow-hidden">
        <DataTable value={data} loading={loading} paginator rows={rows} totalRecords={total} lazy
          first={page * rows} onPage={(e) => { setPage(e.page); setRows(e.rows); }}
          rowsPerPageOptions={[10, 20, 50]} dataKey="_id"
          emptyMessage="No projects found" className="p-datatable-sm" size="small"
          scrollable scrollHeight="flex" rowHover stripedRows>
          <Column header="#" body={(_, { rowIndex }) => <span className="text-gray-400 text-xs font-bold">{page * rows + rowIndex + 1}</span>} style={{ width: 48 }} />
          <Column field="name" header="Project" sortable
            body={(row) => (
              <div>
                <p className="font-semibold text-gray-900 text-xs">{row.name}</p>
                {row.description && <p className="text-[10px] text-gray-400 truncate max-w-xs">{row.description}</p>}
                {row.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {row.tags.map(tag => <span key={tag} className="badge bg-blue-50 text-blue-600 border-blue-100">{tag}</span>)}
                  </div>
                )}
              </div>
            )} />
          <Column field="status" header="Status" sortable
            body={(row) => <Tag severity={STATUS_COLORS[row.status]} value={row.status?.replace('_', ' ')} className="text-[9px] capitalize" />} />
          <Column field="priority" header="Priority" sortable
            body={(row) => (
              <span className="badge text-white text-[9px] capitalize" style={{ background: PRIORITY_BG[row.priority] }}>
                {row.priority}
              </span>
            )} />
          <Column field="progress" header="Progress"
            body={(row) => (
              <div className="flex items-center gap-2 min-w-[100px]">
                <ProgressBar value={row.progress || 0} style={{ height: 6, flex: 1 }} showValue={false} />
                <span className="text-[10px] text-gray-500 font-semibold w-8">{row.progress || 0}%</span>
              </div>
            )} />
          <Column field="budget" header="Budget"
            body={(row) => <span className="text-xs font-semibold text-gray-700">{row.budget ? `$${Number(row.budget).toLocaleString()}` : '—'}</span>} />
          <Column field="endDate" header="Due"
            body={(row) => {
              const overdue = row.endDate && new Date(row.endDate) < new Date() && row.status !== 'completed';
              return <span className={`text-xs ${overdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                {row.endDate ? new Date(row.endDate).toLocaleDateString() : '—'}
                {overdue && ' ⚠️'}
              </span>;
            }} />
          <Column field="assignedTo" header="Team"
            body={(row) => (
              <div className="flex -space-x-1.5">
                {(row.assignedTo || []).slice(0, 3).map(u => (
                  <div key={u._id} title={u.name}
                    className="w-6 h-6 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                    {u.name?.charAt(0)}
                  </div>
                ))}
                {row.assignedTo?.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-[9px] font-bold flex items-center justify-center border-2 border-white">
                    +{row.assignedTo.length - 3}
                  </div>
                )}
              </div>
            )} />
          <Column header="Actions" style={{ width: 100 }}
            body={(row) => (
              <div className="flex gap-1 justify-end">
                <Button icon="pi pi-pencil" className="p-button-sm p-button-text p-button-plain" onClick={() => openEdit(row)} />
                <Button icon="pi pi-trash" className="p-button-sm p-button-text p-button-danger" onClick={() => handleDelete(row)} />
              </div>
            )} />
        </DataTable>
      </div>

      <Dialog header={editItem ? 'Edit Project' : 'New Project'} visible={dialogOpen}
        onHide={() => setDialogOpen(false)} style={{ width: 600 }} modal draggable={false}>
        <div className="grid grid-cols-2 gap-4 p-2">
          <div className="col-span-2">
            <label className="form-label">Project Name *</label>
            <input value={form.name || ''} onChange={set('name')} className="form-input" placeholder="Enter project name" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Description</label>
            <textarea value={form.description || ''} onChange={set('description')} rows={2} className="form-input resize-none" />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select value={form.status} onChange={set('status')} className="form-input">
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Priority</label>
            <select value={form.priority} onChange={set('priority')} className="form-input">
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Start Date</label>
            <input type="date" value={form.startDate || ''} onChange={set('startDate')} className="form-input" />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input type="date" value={form.endDate || ''} onChange={set('endDate')} className="form-input" />
          </div>
          <div>
            <label className="form-label">Budget ($)</label>
            <input type="number" value={form.budget || ''} onChange={set('budget')} className="form-input" />
          </div>
          <div>
            <label className="form-label">Progress (%)</label>
            <input type="number" value={form.progress || 0} min={0} max={100} onChange={set('progress')} className="form-input" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Tags (comma-separated)</label>
            <input value={form.tags || ''} onChange={set('tags')} className="form-input" placeholder="react, design, sprint-2" />
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
