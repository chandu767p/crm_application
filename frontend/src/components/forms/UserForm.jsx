import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';

const defaultForm = { name: '', email: '', password: '', role: '', active: true };

export default function UserForm({ isOpen, onClose, user, onSuccess }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [rolesList, setRolesList] = useState([]);
  const toast = useToast();
  const isEdit = !!user;

  useEffect(() => {
    api.get('/roles?limit=100').then(res => setRolesList(res.data.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, password: '', role: user.role?._id || user.role, active: user.active });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [user, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (!isEdit && !form.password) e.password = 'Password is required';
    if (!isEdit && form.password && form.password.length < 6) e.password = 'Min 6 characters';
    if (!form.role) e.role = 'Role is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;

      if (isEdit) {
        await api.put(`/users/${user._id}`, payload);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', payload);
        toast.success('User created successfully');
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
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [field]: val }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit User' : 'Create User'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Full Name <span className="text-red-500">*</span></label>
          <input className="form-input" value={form.name} onChange={set('name')} placeholder="John Doe" />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        <div>
          <label className="form-label">Email <span className="text-red-500">*</span></label>
          <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" />
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>

        <div>
          <label className="form-label">
            Password {isEdit && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
            {!isEdit && <span className="text-red-500"> *</span>}
          </label>
          <input className="form-input" type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" />
          {errors.password && <p className="form-error">{errors.password}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Role</label>
            <select className="form-input" value={form.role} onChange={set('role')}>
              <option value="">Select a role...</option>
              {rolesList.map(r => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
            {errors.role && <p className="form-error">{errors.role}</p>}
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              id="active"
              type="checkbox"
              checked={form.active}
              onChange={set('active')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700 cursor-pointer">Active</label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
