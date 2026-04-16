import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';

const SCREENS = [
  'dashboard', 
  'leads', 
  'deals', 
  'accounts', 
  'contacts', 
  'users', 
  'roles', 
  'calls', 
  'emails', 
  'meetings', 
  'tickets', 
  'tasks'
];

const defaultForm = { name: '', description: '', permissions: [] };

export default function RoleForm({ isOpen, onClose, role, onSuccess }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const isEdit = !!role;

  useEffect(() => {
    if (role) {
      setForm({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || [],
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [role, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.permissions.length === 0) e.permissions = 'At least one permission is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/roles/${role._id}`, form);
        toast.success('Role updated successfully');
      } else {
        await api.post('/roles', form);
        toast.success('Role created successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (screen) => {
    setForm(p => ({
      ...p,
      permissions: p.permissions.includes(screen)
        ? p.permissions.filter(s => s !== screen)
        : [...p.permissions, screen]
    }));
    if (errors.permissions) setErrors(e => ({ ...e, permissions: undefined }));
  };

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Role' : 'Create Role'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Role Name <span className="text-red-500">*</span></label>
          <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Sales Director" />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea className="form-input" value={form.description} onChange={set('description')} placeholder="Description of the role..." rows={3} />
        </div>

        <div>
          <label className="form-label">Screen Permissions <span className="text-red-500">*</span></label>
          <div className="space-y-2 mt-2 border p-3 rounded-lg bg-gray-50 border-gray-200">
            {SCREENS.map(screen => (
              <label key={screen} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.permissions.includes(screen)}
                  onChange={() => handlePermissionToggle(screen)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700 capitalize">{screen}</span>
              </label>
            ))}
          </div>
          {errors.permissions && <p className="form-error">{errors.permissions}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
