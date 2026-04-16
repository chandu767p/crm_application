import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';

const defaultForm = {
  name: '',
  website: '',
  industry: '',
  description: '',
  'address.street': '',
  'address.city': '',
  'address.state': '',
  'address.zip': '',
  'address.country': '',
  tags: '',
  owner: '',
};

export default function AccountForm({ isOpen, onClose, account, onSuccess }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const toast = useToast();
  const isEdit = !!account;

  useEffect(() => {
    if (isOpen) {
      api.get('/users?limit=100').then((r) => setUsers(r.data.data || [])).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (account) {
      setForm({
        name: account.name || '',
        website: account.website || '',
        industry: account.industry || '',
        description: account.description || '',
        'address.street': account.address?.street || '',
        'address.city': account.address?.city || '',
        'address.state': account.address?.state || '',
        'address.zip': account.address?.zip || '',
        'address.country': account.address?.country || '',
        tags: (account.tags || []).join(', '),
        owner: account.owner?._id || account.owner || '',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [account, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Account name is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { 
        'address.street': street, 
        'address.city': city, 
        'address.state': state,
        'address.zip': zip, 
        'address.country': country, 
        tags, 
        ...rest 
      } = form;

      const payload = {
        ...rest,
        tags: tags ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
        address: { street, city, state, zip, country },
        owner: form.owner || undefined,
      };

      if (isEdit) {
        await api.put(`/accounts/${account._id}`, payload);
        toast.success('Account updated successfully');
      } else {
        await api.post('/accounts', payload);
        toast.success('Account created successfully');
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Account' : 'Create Account'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Account Name <span className="text-red-500">*</span></label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Acme Corp" />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div>
            <label className="form-label">Website</label>
            <input className="form-input" value={form.website} onChange={set('website')} placeholder="https://acme.com" />
          </div>

          <div>
            <label className="form-label">Industry</label>
            <input className="form-input" value={form.industry} onChange={set('industry')} placeholder="Technology" />
          </div>

          <div className="sm:col-span-2">
            <label className="form-label">Description</label>
            <textarea className="form-input min-h-[80px]" value={form.description} onChange={set('description')} placeholder="Company details..." />
          </div>

          <div>
            <label className="form-label">Owner</label>
            <select className="form-input" value={form.owner} onChange={set('owner')}>
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" value={form.tags} onChange={set('tags')} placeholder="partner, enterprise" />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Address
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <input className="form-input" value={form['address.street']} onChange={set('address.street')} placeholder="Street address" />
            </div>
            <input className="form-input" value={form['address.city']} onChange={set('address.city')} placeholder="City" />
            <input className="form-input" value={form['address.state']} onChange={set('address.state')} placeholder="State" />
            <input className="form-input" value={form['address.zip']} onChange={set('address.zip')} placeholder="ZIP code" />
            <input className="form-input" value={form['address.country']} onChange={set('address.country')} placeholder="Country" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
