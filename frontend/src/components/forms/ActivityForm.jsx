import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { capitalize } from '../../utils/helpers';

const defaultForm = {
  type: 'call',
  subject: '',
  description: '',
  duration: '',
  activityDate: new Date().toISOString().slice(0, 16),
  status: 'completed',
  purpose: 'discovery',
  outcome: 'answered',
};

const PURPOSES = ['discovery', 'follow_up', 'negotiation', 'support', 'demo', 'other'];
const OUTCOMES = ['answered', 'no_answer', 'busy', 'left_voicemail', 'scheduled_follow_up', 'closed', 'refused'];

export default function ActivityForm({ isOpen, onClose, relatedTo, onModel, onSuccess, initialType, activity }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  
  const toast = useToast();
  const isEdit = !!activity;

  useEffect(() => {
    if (isOpen) {
      if (activity) {
        setForm({
          type: activity.type || 'call',
          subject: activity.subject || '',
          description: activity.description || '',
          duration: activity.duration || '',
          activityDate: activity.activityDate ? new Date(activity.activityDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
          status: activity.status || 'completed',
          purpose: activity.purpose || 'discovery',
          outcome: activity.outcome || 'answered',
        });
        if (activity.relatedTo) {
          setSelectedEntity({
            id: activity.relatedTo._id || activity.relatedTo,
            name: activity.relatedTo.name || activity.relatedTo.title || activity.relatedTo.subject || 'Linked Record',
            type: activity.onModel,
          });
        }
      } else {
        setForm({
          ...defaultForm,
          type: initialType || defaultForm.type,
          activityDate: new Date().toISOString().slice(0, 16),
        });
        setSelectedEntity(null);
      }
      setErrors({});
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, initialType, activity]);

  // Global search for Leads/Contacts/Accounts
  useEffect(() => {
    if (searchQuery.length < 2 || relatedTo || isEdit) return;
    
    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const [leads, contacts, accounts] = await Promise.all([
          api.get(`/leads?search=${searchQuery}&limit=3`),
          api.get(`/contacts?search=${searchQuery}&limit=3`),
          api.get(`/accounts?search=${searchQuery}&limit=3`),
        ]);
        
        const results = [
          ...leads.data.data.map(l => ({ id: l._id, name: l.name, type: 'Lead' })),
          ...contacts.data.data.map(c => ({ id: c._id, name: c.name, type: 'Contact' })),
          ...accounts.data.data.map(a => ({ id: a.name, name: a.name, type: 'Account', realId: a._id })),
        ];
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, relatedTo, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.activityDate) e.activityDate = 'Date is required';
    if (!relatedTo && !selectedEntity) e.entity = 'Please select a related record';
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
        relatedTo: relatedTo || (selectedEntity.realId || selectedEntity.id),
        onModel: onModel || selectedEntity.type,
        duration: Number(form.duration) || 0,
        activityDate: new Date(form.activityDate).toISOString(),
      };

      if (isEdit) {
        await api.put(`/activities/${activity._id}`, payload);
        toast.success('Activity updated successfully');
      } else {
        await api.post('/activities', payload);
        toast.success(form.status === 'scheduled' ? 'Activity scheduled successfully' : 'Activity logged successfully');
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

  const activityIcons = {
    call: '📞',
    email: '✉️',
    meeting: '🤝',
    note: '📝',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={form.status === 'scheduled' ? 'Schedule Activity' : 'Log History'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle Mode */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-2">
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, status: 'completed' }))}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${form.status === 'completed' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Log Past Activity
          </button>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, status: 'scheduled' }))}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${form.status === 'scheduled' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Schedule Future Task
          </button>
        </div>

        {/* Record Selection (Conditional) */}
        {!relatedTo && (
          <div className="relative">
            <label className="form-label">Related Record <span className="text-red-500">*</span></label>
            {selectedEntity ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold  tracking-widest">{selectedEntity.type}</span>
                  <span className="font-semibold text-gray-900">{selectedEntity.name}</span>
                </div>
                <button type="button" onClick={() => setSelectedEntity(null)} className="text-blue-600 hover:text-blue-800 font-semibold text-xs  underline">Change</button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search for Lead, Contact, or Account..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchResults.length > 0 && !searching && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl divide-y divide-gray-50 max-h-60 overflow-hidden">
                    {searchResults.map((res) => (
                      <button
                        key={`${res.type}-${res.id}`}
                        type="button"
                        onClick={() => { setSelectedEntity(res); setSearchResults([]); }}
                        className="w-full text-left p-3 hover:bg-gray-50 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-semibold  tracking-widest">{res.type}</span>
                          <span className="font-medium text-gray-700 group-hover:text-blue-600">{res.name}</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
                {searching && <div className="absolute right-3 top-[38px]"><LoadingSpinner size="xs" /></div>}
                {errors.entity && <p className="form-error">{errors.entity}</p>}
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Activity Type</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(activityIcons).map(([type, icon]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, type }))}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${form.type === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-100 hover:border-gray-300 text-gray-500'
                    }`}
                >
                  <span className="text-xl mb-1">{icon}</span>
                  <span className="text-[10px] font-semibold ">{type}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="form-label">Subject <span className="text-red-500">*</span></label>
            <input className="form-input" value={form.subject} onChange={set('subject')} placeholder="e.g. Discovery Call" />
            {errors.subject && <p className="form-error">{errors.subject}</p>}
          </div>

          {/* Call Specifics */}
          {form.type === 'call' && (
            <>
              <div>
                <label className="form-label text-xs  tracking-wider text-gray-400">Purpose</label>
                <select className="form-input" value={form.purpose} onChange={set('purpose')}>
                  {PURPOSES.map((p) => (
                    <option key={p} value={p}>{capitalize(p.replace('_', ' '))}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label text-xs  tracking-wider text-gray-400">Outcome</label>
                <select className="form-input" value={form.outcome} onChange={set('outcome')} disabled={form.status === 'scheduled'}>
                  {OUTCOMES.map((o) => (
                    <option key={o} value={o}>{capitalize(o.replace('_', ' '))}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="sm:col-span-2">
            <label className="form-label">Description</label>
            <textarea className="form-input min-h-[60px]" value={form.description} onChange={set('description')} placeholder="What was discussed?" />
          </div>

          <div>
            <label className="form-label">{form.status === 'scheduled' ? 'Scheduled Date' : 'Actual Date'}</label>
            <input type="datetime-local" className="form-input text-sm" value={form.activityDate} onChange={set('activityDate')} />
            {errors.activityDate && <p className="form-error">{errors.activityDate}</p>}
          </div>

          <div>
            <label className="form-label">Duration (mins)</label>
            <input type="number" className="form-input" value={form.duration} onChange={set('duration')} placeholder="15" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : form.status === 'scheduled' ? 'Schedule Call' : 'Log Activity'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
