import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';

const defaultForm = {
  title: '', description: '', status: 'pending', priority: 'medium',
  dueDate: '', assignedTo: '',
};

export default function TaskForm({ isOpen, onClose, task, onSuccess }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const toast = useToast();
  const isEdit = !!task;

  useEffect(() => {
    if (isOpen) {
      api.get('/users?limit=100').then((r) => setUsers(r.data.data || [])).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [task, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
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
        dueDate: form.dueDate || undefined,
        assignedTo: form.assignedTo || undefined,
      };

      if (isEdit) {
        await api.put(`/tasks/${task._id}`, payload);
        toast.success('Task updated successfully');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Task' : 'Create Task'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="form-label">Task Title <span className="text-red-500">*</span></label>
          <input className="form-input" value={form.title} onChange={set('title')} placeholder="Follow up with client" />
          {errors.title && <p className="form-error">{errors.title}</p>}
        </div>
        
        <div>
          <label className="form-label">Description</label>
          <textarea className="form-input min-h-[80px]" value={form.description} onChange={set('description')} placeholder="Details..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={set('status')}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="form-label">Priority</label>
            <select className="form-input" value={form.priority} onChange={set('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={set('dueDate')} />
            </div>

            <div>
              <label className="form-label">Assigned To</label>
              <select className="form-input" value={form.assignedTo} onChange={set('assignedTo')}>
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
