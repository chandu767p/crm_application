import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';

const defaultForm = {
  name: '',
  value: '',
  probability: 50,
  stage: 'prospect',
  expectedCloseDate: '',
  contact: '',
  account: '',
  assignedTo: '',
};

export default function DealForm({ isOpen, onClose, deal, onSuccess }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const toast = useToast();
  const isEdit = !!deal;

  useEffect(() => {
    if (isOpen) {
      api.get('/users?limit=100').then((r) => setUsers(r.data.data || [])).catch(() => {});
      api.get('/contacts?limit=100').then((r) => setContacts(r.data.data || [])).catch(() => {});
      api.get('/accounts?limit=100').then((r) => setAccounts(r.data.data || [])).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (deal) {
      setForm({
        name: deal.name || '',
        value: deal.value || '',
        probability: deal.probability || 50,
        stage: deal.stage || 'prospect',
        expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split('T')[0] : '',
        contact: deal.contact?._id || deal.contact || '',
        account: deal.account?._id || deal.account || '',
        assignedTo: deal.assignedTo?._id || deal.assignedTo || '',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [deal, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Deal name is required';
    if (!form.value || isNaN(form.value)) e.value = 'Valid value is required';
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
        value: Number(form.value),
        probability: Number(form.probability),
        contact: form.contact || undefined,
        assignedTo: form.assignedTo || undefined,
        expectedCloseDate: form.expectedCloseDate || undefined,
      };

      if (isEdit) {
        await api.put(`/deals/${deal._id}`, payload);
        toast.success('Deal updated successfully');
      } else {
        await api.post('/deals', payload);
        toast.success('Deal created successfully');
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Deal' : 'Create Deal'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Deal Name <span className="text-red-500">*</span></label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Website Redesign" />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div>
            <label className="form-label">Value ($) <span className="text-red-500">*</span></label>
            <input type="number" className="form-input" value={form.value} onChange={set('value')} placeholder="5000" />
            {errors.value && <p className="form-error">{errors.value}</p>}
          </div>

          <div>
            <label className="form-label">Probability (%)</label>
            <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-3" min="0" max="100" value={form.probability} onChange={set('probability')} />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span className="font-bold text-blue-600">{form.probability}%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="form-label">Stage</label>
            <select className="form-input" value={form.stage} onChange={set('stage')}>
              <option value="prospect">Prospect</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div>
            <label className="form-label">Expected Close Date</label>
            <input type="date" className="form-input" value={form.expectedCloseDate} onChange={set('expectedCloseDate')} />
          </div>

          <div>
            <label className="form-label">Related Contact</label>
            <select className="form-input" value={form.contact} onChange={set('contact')}>
              <option value="">None</option>
              {contacts.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
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
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Deal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
