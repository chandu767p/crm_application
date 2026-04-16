import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';

const defaultForm = {
  name: '', email: '', phone: '', account: '', jobTitle: '',
  tags: '', assignedTo: '', active: true,
  'address.street': '', 'address.city': '', 'address.state': '',
  'address.zip': '', 'address.country': '',
};

export default function ContactForm({ isOpen, onClose, contact, onSuccess }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const toast = useToast();
  const isEdit = !!contact;

  useEffect(() => {
    if (isOpen) {
      api.get('/users?limit=100').then((r) => setUsers(r.data.data || [])).catch(() => {});
      api.get('/accounts?limit=100').then((r) => setAccounts(r.data.data || [])).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        account: contact.account?._id || contact.account || '',
        jobTitle: contact.jobTitle || '',
        tags: (contact.tags || []).join(', '),
        assignedTo: contact.assignedTo?._id || contact.assignedTo || '',
        active: contact.active !== false,
        'address.street': contact.address?.street || '',
        'address.city': contact.address?.city || '',
        'address.state': contact.address?.state || '',
        'address.zip': contact.address?.zip || '',
        'address.country': contact.address?.country || '',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [contact, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { 'address.street': street, 'address.city': city, 'address.state': state,
        'address.zip': zip, 'address.country': country, tags, ...rest } = form;

      const payload = {
        ...rest,
        tags: tags ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
        address: { street, city, state, zip, country },
        assignedTo: form.assignedTo || undefined,
      };

      if (isEdit) {
        await api.put(`/contacts/${contact._id}`, payload);
        toast.success('Contact updated successfully');
      } else {
        await api.post('/contacts', payload);
        toast.success('Contact created successfully');
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Contact' : 'Create Contact'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Full Name <span className="text-red-500">*</span></label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="Jane Smith" />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>
          <div>
            <label className="form-label">Account / Company</label>
            <select className="form-input" value={form.account} onChange={set('account')}>
              <option value="">No Account</option>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>{acc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="jane@acme.com" />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="+1-555-0100" />
          </div>
          <div>
            <label className="form-label">Job Title</label>
            <input className="form-input" value={form.jobTitle} onChange={set('jobTitle')} placeholder="CEO" />
          </div>
          <div>
            <label className="form-label">Tags <span className="text-gray-400 text-xs">(comma separated)</span></label>
            <input className="form-input" value={form.tags} onChange={set('tags')} placeholder="vip, enterprise, tech" />
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
          <div className="flex items-center gap-3 pt-6">
            <input
              id="contact-active"
              type="checkbox"
              checked={form.active}
              onChange={set('active')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="contact-active" className="text-sm font-medium text-gray-700 cursor-pointer">Active</label>
          </div>
        </div>

        {/* Address */}
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Address
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <input className="form-input" value={form['address.street']} onChange={set('address.street')} placeholder="Street address" />
            </div>
            <input className="form-input" value={form['address.city']} onChange={set('address.city')} placeholder="City" />
            <input className="form-input" value={form['address.state']} onChange={set('address.state')} placeholder="State" />
            <input className="form-input" value={form['address.zip']} onChange={set('address.zip')} placeholder="ZIP / Postal code" />
            <input className="form-input" value={form['address.country']} onChange={set('address.country')} placeholder="Country" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Contact'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
