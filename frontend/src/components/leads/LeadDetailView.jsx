import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatCurrency, statusColors, capitalize } from '../../utils/helpers';
import UnifiedTimeline from '../common/UnifiedTimeline';
import ActivityForm from '../forms/ActivityForm';
import NotesSection from './NotesSection';

const leadStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const leadSources = ['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'event', 'other'];

export default function LeadDetailView({ lead: initialLead, onUpdate, onDelete, onBack }) {
  const [lead, setLead] = useState(initialLead);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setLead(initialLead);
  }, [initialLead]);

  useEffect(() => {
    if (initialLead) {
      fetchUsersAndAccounts();
      if (activeTab === 'activity') fetchActivities();
    }
  }, [initialLead]);

  const fetchUsersAndAccounts = async () => {
    try {
      const [uRes, aRes] = await Promise.all([
        api.get('/users?limit=100'),
        api.get('/accounts?limit=100')
      ]);
      setUsers(uRes.data.data || []);
      setAccounts(aRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch users/accounts', err);
    }
  };

  const fetchActivities = useCallback(async () => {
    if (!lead?._id) return;
    setLoadingActivities(true);
    try {
      const res = await api.get(`/activities/timeline/Lead/${lead._id}`);
      setActivities(res.data.data);
    } catch (err) {
      console.error('Failed to fetch activities', err);
    } finally {
      setLoadingActivities(false);
    }
  }, [lead?._id]);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivities();
    }
  }, [activeTab, fetchActivities]);

  const handleUpdateField = async (field, value) => {
    setLoading(true);
    try {
      const res = await api.put(`/leads/${lead._id}`, { [field]: value });
      setLead(res.data.data);
      if (onUpdate) onUpdate(res.data.data);
      toast.success(`${capitalize(field.replace(/([A-Z])/g, ' $1').trim())} updated`);
      setEditingField(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (field, value) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  if (!lead) return null;

  const InlineEdit = ({ label, field, value, type = 'text', options = null }) => {
    const isEditing = editingField === field;
    const displayValue = value || <span className="text-gray-400 italic">None</span>;

    const handleSubmit = (e) => {
      if (e) e.preventDefault();
      if (editValue === value) {
        cancelEditing();
        return;
      }
      handleUpdateField(field, type === 'number' ? Number(editValue) : editValue);
    };

    return (
      <div className={`group flex items-center py-1 px-3 rounded-lg transition-all duration-200 ${isEditing ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50/80'}`}>
        <div className="w-1/3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
          {label}
        </div>
        <div className="w-2/3 relative flex items-center min-h-[28px]">
          {isEditing ? (
            <div className="flex-1 flex items-center gap-2">
              {type === 'select' ? (
                <select
                  autoFocus
                  className="w-full bg-transparent border-b border-blue-500 focus:outline-none text-xs py-0.5 font-bold text-gray-900"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => !loading && handleSubmit()}
                >
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  autoFocus
                  type={type}
                  className="w-full bg-transparent border-b border-blue-500 focus:outline-none text-xs py-0.5 font-bold text-gray-900"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => !loading && handleSubmit()}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              )}
              <div className="flex gap-1 ml-1.5">
                <button onMouseDown={handleSubmit} className="bg-green-500 text-white p-0.5 rounded hover:bg-green-600  transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button onMouseDown={cancelEditing} className="bg-red-400 text-white p-0.5 rounded hover:bg-red-500  transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div
              className="flex-1 text-xs text-[#222] font-medium cursor-pointer flex items-center justify-between group"
              onClick={() => startEditing(field, field === 'account' ? (value?._id || value) : (field === 'assignedTo' ? (value?._id || value) : value))}
            >
              <span className="truncate">
                {field === 'value' ? <span className="text-blue-600 font-semibold">{formatCurrency(value)}</span> :
                  field === 'status' ? <span className={`badge px-2 py-0.5 text-[10px] ${statusColors[value] || 'bg-gray-100 text-gray-600'}`}>{capitalize(value)}</span> :
                    field === 'source' ? <span className="text-purple-600 font-medium">{capitalize(value.replace(/_/g, ' '))}</span> :
                      field === 'account' ? (value?.name || value || <span className="text-gray-400 italic font-normal">None</span>) :
                        field === 'assignedTo' ? (value?.name || value || <span className="text-gray-400 italic font-normal">Unassigned</span>) :
                          displayValue}
              </span>
              <svg className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#f5f7f9] h-screen flex flex-col overflow-hidden animate-slide-in-right text-[#222]">
      {/* Top Sticky Header - Compact */}
      <div className="bg-white px-4 py-2  flex items-center justify-between z-10  shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5  text-blue-900 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border-none "
            title="Back to Leads"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-[20px] font-semibold truncate tracking-wide leading-none bg-gradient-to-r from-blue-950 to-blue-900 bg-clip-text text-transparent">
                {lead.name.toUpperCase()}
              </h2>
              <span className={`badge text-[8px] font-semibold px-2 py-0.5 tracking-wider ${statusColors[lead.status] || 'bg-gray-100 text-gray-600  border border-gray-200/50'}`}>
                {capitalize(lead.status)}
              </span>
            </div>

          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDelete(lead)}
            className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 bg-red-50/50 border border-red-100 rounded-lg transition-all  group"
            title="Delete Lead"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs - Compact sticky */}
      <div className="bg-white border-b border-gray-200 px-5 sticky top-0 z-10 shadow-sm shrink-0">
        <div className="flex">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-1.5 text-[9px] font-semibold tracking-widest border-b-2 transition-all mr-6 outline-none ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-1.5 text-[9px] font-semibold tracking-widest border-b-2 transition-all outline-none ${activeTab === 'activity' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Body Content - High Density Scroll */}
      <div className="w-full px-4 lg:px-6 py-3 flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 pb-6">
            {/* Lead Information Section Card - Tight */}
            <section className="bg-white rounded-xl p-2.5  border border-gray-100 space-y-1.5 transition-all hover:shadow-sm border-l-4 border-l-blue-500">
              <h3 className="text-[10px] font-semibold text-gray-900 border-b border-gray-50 pb-1.5 mb-0.5 flex items-center gap-2 tracking-tight">
                <span className="text-sm">👤</span>
                Lead Information
              </h3>
              <div className="space-y-0">
                <InlineEdit label="Full Name" field="name" value={lead.name} />
                <InlineEdit
                  label="Status"
                  field="status"
                  value={lead.status}
                  type="select"
                  options={leadStatuses.map(s => ({ value: s, label: capitalize(s) }))}
                />
                <InlineEdit
                  label="Source"
                  field="source"
                  value={lead.source}
                  type="select"
                  options={leadSources.map(s => ({ value: s, label: capitalize(s.replace(/_/g, ' ')) }))}
                />
                <InlineEdit label="Deal Value" field="value" value={lead.value} type="number" />
              </div>
            </section>

            {/* Contact Details Section Card - Tight */}
            <section className="bg-white rounded-xl p-2.5  border border-gray-100 space-y-1.5 transition-all hover:shadow-sm border-l-4 border-l-purple-500">
              <h3 className="text-[10px] font-semibold text-gray-900 border-b border-gray-50 pb-1.5 mb-0.5 flex items-center gap-2 tracking-tight">
                <span className="text-sm">📞</span>
                Contact Details
              </h3>
              <div className="space-y-0">
                <InlineEdit label="Email" field="email" value={lead.email} type="email" />
                <InlineEdit label="Phone" field="phone" value={lead.phone} type="tel" />
              </div>
            </section>

            {/* Company Details Section Card - Tight */}
            <section className="bg-white rounded-xl p-2.5  border border-gray-100 space-y-1.5 transition-all hover:shadow-sm border-l-4 border-l-green-500">
              <h3 className="text-[10px] font-semibold text-gray-900 border-b border-gray-50 pb-1.5 mb-0.5 flex items-center gap-2 tracking-tight">
                <span className="text-sm">🏢</span>
                Company Details
              </h3>
              <div className="space-y-0">
                <InlineEdit
                  label="Company"
                  field="account"
                  value={lead.account}
                  type="select"
                  options={[{ value: '', label: 'No Account' }, ...accounts.map(a => ({ value: a._id, label: a.name }))]}
                />
              </div>
            </section>

            {/* Additional Info Section Card - Tight */}
            <section className="bg-white rounded-xl p-2.5  border border-gray-100 space-y-1.5 transition-all hover:shadow-sm border-l-4 border-l-amber-500">
              <h3 className="text-[10px] font-semibold text-gray-900 border-b border-gray-50 pb-1.5 mb-0.5 flex items-center gap-2 tracking-tight">
                <span className="text-sm">📌</span>
                Additional Information
              </h3>
              <div className="space-y-0">
                <InlineEdit
                  label="Owner"
                  field="assignedTo"
                  value={lead.assignedTo}
                  type="select"
                  options={[{ value: '', label: 'Unassigned' }, ...users.map(u => ({ value: u._id, label: u.name }))]}
                />
                {/* System Metadata Section - Read Only */}
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1">
                  <div className="flex items-center py-0.5 px-3 text-[9px] text-gray-400 font-semibold tracking-widest leading-none">
                    System Information
                  </div>
                  <div className="flex items-center py-1 px-3 rounded-lg text-gray-500 hover:bg-gray-50/50 transition-colors cursor-default group">
                    <div className="w-1/3 text-[9px] font-semibold tracking-widest text-gray-400 group-hover:text-gray-500 transition-colors">Record Created</div>
                    <div className="w-2/3 text-[10px] font-medium text-gray-400 font-mono">{formatDate(lead.createdAt)}</div>
                  </div>
                  <div className="flex items-center py-1 px-3 rounded-lg text-gray-500 hover:bg-gray-50/50 transition-colors cursor-default group">
                    <div className="w-1/3 text-[9px] font-semibold tracking-widest text-gray-400 group-hover:text-gray-500 transition-colors">Last Modified</div>
                    <div className="w-2/3 text-[10px] font-medium text-gray-400 font-mono">{formatDate(lead.updatedAt)}</div>
                  </div>
                </div>
              </div>
            </section>

            <div className="lg:col-span-2">
              <NotesSection leadId={lead._id} />
            </div>

            {/* Quick Activity Timeline - Bottom of Details */}
            <div className="lg:col-span-2 bg-white rounded-xl  border border-gray-100 overflow-hidden border-l-4 border-l-gray-300">
              <div className="p-3 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-gray-900 flex items-center gap-2 tracking-tight">
                  <span className="text-sm">🔄</span>
                  Activity History
                </h3>
              </div>
              <div className="p-4 bg-gray-50/10">
                <UnifiedTimeline activities={activities} loading={loadingActivities} />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-3 pb-6">
            <div className="bg-white p-3 rounded-xl  border border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900">Recent Interactions</h3>
              </div>
              <button
                onClick={() => setActivityFormOpen(true)}
                className="btn-primary py-1.5 px-3 text-[9px] font-semibold tracking-widest "
              >
                <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                Log Activity
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl  border border-gray-100">
              <UnifiedTimeline activities={activities} loading={loadingActivities} />
            </div>
          </div>
        )}
      </div>

      <ActivityForm
        isOpen={activityFormOpen}
        onClose={() => setActivityFormOpen(false)}
        relatedTo={lead._id}
        onModel="Lead"
        onSuccess={fetchActivities}
      />
    </div>
  );
}
