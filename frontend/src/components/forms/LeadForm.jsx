import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';

const defaultForm = {
  name: '', email: '', phone: '', account: '',
  status: 'new', source: 'other', assignedTo: '', value: '',
};

export default function LeadForm({ isOpen, onClose, lead, onSuccess }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const toast = useToast();
  const isEdit = !!lead;

  useEffect(() => {
    if (isOpen) {
      api.get('/users?limit=100').then((r) => setUsers(r.data.data || [])).catch(() => {});
      api.get('/accounts?limit=100').then((r) => setAccounts(r.data.data || [])).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        account: lead.account?._id || lead.account || '',
        status: lead.status || 'new',
        source: lead.source || 'other',
        assignedTo: lead.assignedTo?._id || lead.assignedTo || '',
        value: lead.value ?? '',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [lead, isOpen]);

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
      const payload = {
        ...form,
        value: form.value !== '' ? Number(form.value) : undefined,
        assignedTo: form.assignedTo || undefined,
      };

      if (isEdit) {
        await api.put(`/leads/${lead._id}`, payload);
        toast.success('Lead updated successfully');
      } else {
        await api.post('/leads', payload);
        toast.success('Lead created successfully');
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Lead' : 'Create Lead'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Full Name <span className="text-red-500">*</span></label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="Alice Johnson" />
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
            <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="alice@acme.com" />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+1-555-0100" />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={set('status')}>
              {['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Source</label>
            <select className="form-input" value={form.source} onChange={set('source')}>
              {['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'event', 'other'].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Deal Value ($)</label>
            <input className="form-input" type="number" value={form.value} onChange={set('value')} placeholder="0" min="0" />
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

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
