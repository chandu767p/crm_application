import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';

const defaultForm = {
  subject: '', description: '', status: 'open', priority: 'medium',
  contact: '', assignedTo: '',
};

export default function TicketForm({ isOpen, onClose, ticket, onSuccess }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const toast = useToast();
  const isEdit = !!ticket;

  useEffect(() => {
    if (isOpen) {
      api.get('/users?limit=100').then((r) => setUsers(r.data.data || [])).catch(() => {});
      api.get('/contacts?limit=100').then((r) => setContacts(r.data.data || [])).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (ticket) {
      setForm({
        subject: ticket.subject || '',
        description: ticket.description || '',
        status: ticket.status || 'open',
        priority: ticket.priority || 'medium',
        contact: ticket.contact?._id || ticket.contact || '',
        assignedTo: ticket.assignedTo?._id || ticket.assignedTo || '',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [ticket, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.description.trim()) e.description = 'Description is required';
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
        contact: form.contact || undefined,
        assignedTo: form.assignedTo || undefined,
      };

      if (isEdit) {
        await api.put(`/tickets/${ticket._id}`, payload);
        toast.success('Ticket updated successfully');
      } else {
        await api.post('/tickets', payload);
        toast.success('Ticket created successfully');
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Ticket' : 'Create Ticket'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Subject <span className="text-red-500">*</span></label>
            <input className="form-input" value={form.subject} onChange={set('subject')} placeholder="Issue with login" />
            {errors.subject && <p className="form-error">{errors.subject}</p>}
          </div>
          
          <div className="sm:col-span-2">
            <label className="form-label">Description <span className="text-red-500">*</span></label>
            <textarea className="form-input min-h-[100px]" value={form.description} onChange={set('description')} placeholder="Please describe the issue..." />
            {errors.description && <p className="form-error">{errors.description}</p>}
          </div>

          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={set('status')}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="form-label">Priority</label>
            <select className="form-input" value={form.priority} onChange={set('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="form-label">Related Contact</label>
            <select className="form-input" value={form.contact} onChange={set('contact')}>
              <option value="">None</option>
              {contacts.map((c) => (
                <option key={c._id} value={c._id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
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

        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
