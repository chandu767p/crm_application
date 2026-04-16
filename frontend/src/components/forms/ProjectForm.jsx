import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';

const defaultForm = {
  name: '',
  description: '',
  status: 'planning',
  priority: 'medium',
  startDate: '',
  endDate: '',
  budget: '',
  progress: 0,
  tags: '',
  assignedTo: [],
};

const STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function ProjectForm({ isOpen, onClose, project, onSuccess }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const toast = useToast();
  const isEdit = !!project;

  useEffect(() => {
    if (isOpen) {
      api.get('/users?limit=100').then((r) => setUsers(r.data.data || [])).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        startDate: project.startDate?.slice(0, 10) || '',
        endDate: project.endDate?.slice(0, 10) || '',
        budget: project.budget || '',
        progress: project.progress || 0,
        tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
        assignedTo: project.assignedTo?.map(u => u._id || u) || [],
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [project, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Project Name is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        budget: form.budget !== '' ? Number(form.budget) : undefined,
        progress: Number(form.progress),
      };

      if (isEdit) {
        await api.put(`/projects/${project._id}`, payload);
        toast.success('Project updated successfully');
      } else {
        await api.post('/projects', payload);
        toast.success('Project created successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => {
    const value = e.target.type === 'select-multiple' 
      ? Array.from(e.target.selectedOptions, option => option.value)
      : e.target.value;
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Project' : 'Create Project'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label">Project Name <span className="text-red-500">*</span></label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="E-commerce Migration" />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>
          <div className="col-span-2">
            <label className="form-label">Description</label>
            <textarea className="form-input resize-none" rows={2} value={form.description} onChange={set('description')} placeholder="Project objective..." />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Priority</label>
            <select className="form-input" value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Start Date</label>
            <input className="form-input" type="date" value={form.startDate} onChange={set('startDate')} />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input className="form-input" type="date" value={form.endDate} onChange={set('endDate')} />
          </div>
          <div>
            <label className="form-label">Budget ($)</label>
            <input className="form-input" type="number" value={form.budget} onChange={set('budget')} placeholder="5000" />
          </div>
          <div>
            <label className="form-label">Progress (%)</label>
            <input className="form-input" type="number" min="0" max="100" value={form.progress} onChange={set('progress')} />
          </div>
          <div className="col-span-2">
            <label className="form-label">Team Members</label>
            <select 
              multiple 
              className="form-input h-24" 
              value={form.assignedTo} 
              onChange={set('assignedTo')}
            >
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple members</p>
          </div>
          <div className="col-span-2">
            <label className="form-label">Tags (comma-separated)</label>
            <input className="form-input" value={form.tags} onChange={set('tags')} placeholder="revamp, mobile, q3" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
