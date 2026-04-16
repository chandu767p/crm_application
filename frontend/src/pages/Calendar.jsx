import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';

const EVENT_TYPES = [
  { label: 'Meeting', value: 'meeting', color: '#3b82f6', icon: '🤝' },
  { label: 'Call', value: 'call', color: '#10b981', icon: '📞' },
  { label: 'Task', value: 'task', color: '#f59e0b', icon: '✅' },
  { label: 'Reminder', value: 'reminder', color: '#ef4444', icon: '⏰' },
  { label: 'Event', value: 'event', color: '#8b5cf6', icon: '📅' },
];

const TYPE_MAP = Object.fromEntries(EVENT_TYPES.map(t => [t.value, t]));

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const EMPTY_EVENT = { title: '', description: '', start: '', end: '', allDay: false, type: 'event', location: '' };

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function Calendar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const today = new Date();
  const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [selectedDay, setSelectedDay] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date(viewDate.year, viewDate.month, 1).toISOString();
      const end = new Date(viewDate.year, viewDate.month + 1, 0, 23, 59, 59).toISOString();
      const res = await api.get(`/calendar/all?start=${start}&end=${end}`);
      setEvents(res.data.data || []);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [viewDate]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const prevMonth = () => setViewDate(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const nextMonth = () => setViewDate(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });
  const goToday = () => setViewDate({ year: today.getFullYear(), month: today.getMonth() });

  const openNew = (day = null) => {
    const dateStr = day ? `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
    const startStr = dateStr ? `${dateStr}T09:00` : '';
    const endStr = dateStr ? `${dateStr}T10:00` : '';
    setEditItem(null);
    setForm({ ...EMPTY_EVENT, start: startStr, end: endStr });
    setDialogOpen(true);
  };

  const openEdit = (evt) => {
    setEditItem(evt);
    setForm({
      ...evt,
      start: evt.start ? new Date(evt.start).toISOString().slice(0, 16) : '',
      end: evt.end ? new Date(evt.end).toISOString().slice(0, 16) : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.start || !form.end) { toast.error('Title, start and end are required'); return; }
    setSaving(true);
    try {
      if (editItem) { await api.put(`/calendar/${editItem._id}`, form); toast.success('Event updated'); }
      else { await api.post('/calendar', form); toast.success('Event created'); }
      setDialogOpen(false);
      fetchEvents();
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (evt) => {
    if (!window.confirm(`Delete "${evt.title}"?`)) return;
    try { await api.delete(`/calendar/${evt._id}`); toast.success('Event deleted'); fetchEvents(); }
    catch (err) { toast.error(err.message); }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target?.value ?? e.value ?? e }));

  const days = getCalendarDays(viewDate.year, viewDate.month);

  const getEventsForDay = (day) => {
    if (!day) return [];
    return events.filter(evt => {
      const d = new Date(evt.start);
      return d.getFullYear() === viewDate.year && d.getMonth() === viewDate.month && d.getDate() === day;
    });
  };

  const isToday = (day) => day && today.getDate() === day && today.getMonth() === viewDate.month && today.getFullYear() === viewDate.year;

  return (
    <div className="flex flex-col h-full min-h-0 space-y-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">{t('calendar')}</h2>
          <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1">
            <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-white hover:shadow text-gray-500 hover:text-gray-900 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-bold text-gray-800 px-2 min-w-[140px] text-center">{MONTHS[viewDate.month]} {viewDate.year}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-white hover:shadow text-gray-500 hover:text-gray-900 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <button onClick={goToday} className="btn-secondary text-xs px-3 py-1.5">Today</button>
        </div>
        <div className="flex items-center gap-2">
          {EVENT_TYPES.map(t => (
            <div key={t.value} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
              <span className="text-[10px] text-gray-500 font-medium">{t.label}</span>
            </div>
          ))}
          <Button icon="pi pi-plus" label="Add Event" className="p-button-sm ml-2" onClick={() => openNew()} />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card p-0 flex-1 overflow-hidden flex flex-col">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className={`grid grid-cols-7 flex-1 ${loading ? 'opacity-50' : ''}`}>
          {days.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const todayCell = isToday(day);
            return (
              <div
                key={idx}
                onClick={() => day && openNew(day)}
                className={`min-h-[80px] border-r border-b border-gray-50 p-1.5 cursor-pointer transition-colors
                  ${!day ? 'bg-gray-50/30' : 'hover:bg-blue-50/30'}
                  ${todayCell ? 'bg-blue-50/50' : ''}
                `}
              >
                {day && (
                  <>
                    <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1
                      ${todayCell ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(evt => (
                        <div key={evt._id}
                          onClick={(e) => { e.stopPropagation(); openEdit(evt); }}
                          className="text-[9px] font-semibold text-white rounded px-1 py-0.5 truncate cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ background: TYPE_MAP[evt.type]?.color || '#6b7280' }}
                          title={evt.title}>
                          {TYPE_MAP[evt.type]?.icon} {evt.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-gray-400 font-semibold pl-1">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming events strip */}
      {events.length > 0 && (
        <div className="card p-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">This Month's Events ({events.length})</h3>
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {events.sort((a,b) => new Date(a.start) - new Date(b.start)).map(evt => (
              <div key={evt._id}
                onClick={() => openEdit(evt)}
                className="flex-shrink-0 rounded-xl p-3 cursor-pointer hover:opacity-90 transition-opacity w-48"
                style={{ background: `${TYPE_MAP[evt.type]?.color}15`, border: `1px solid ${TYPE_MAP[evt.type]?.color}30` }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">{TYPE_MAP[evt.type]?.icon}</span>
                  <span className="text-[10px] font-bold capitalize" style={{ color: TYPE_MAP[evt.type]?.color }}>{evt.type}</span>
                </div>
                <p className="text-xs font-semibold text-gray-800 truncate">{evt.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{new Date(evt.start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                {evt.location && <p className="text-[9px] text-gray-400 truncate mt-0.5">📍 {evt.location}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Dialog */}
      <Dialog header={editItem ? 'Edit Event' : 'New Calendar Event'} visible={dialogOpen}
        onHide={() => setDialogOpen(false)} style={{ width: 520 }} modal draggable={false}>
        <div className="space-y-4 p-2">
          <div>
            <label className="form-label">Title *</label>
            <input value={form.title || ''} onChange={set('title')} className="form-input" placeholder="Event title" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Type</label>
              <select value={form.type || 'event'} onChange={set('type')} className="form-input">
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.allDay || false} onChange={(e) => setForm(p => ({ ...p, allDay: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600" />
                <span className="text-xs font-medium text-gray-600">All day</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Start *</label>
              <input type={form.allDay ? 'date' : 'datetime-local'} value={form.start || ''} onChange={set('start')} className="form-input" />
            </div>
            <div>
              <label className="form-label">End *</label>
              <input type={form.allDay ? 'date' : 'datetime-local'} value={form.end || ''} onChange={set('end')} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Location</label>
            <input value={form.location || ''} onChange={set('location')} className="form-input" placeholder="Office, Zoom, etc." />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea value={form.description || ''} onChange={set('description')} rows={3} className="form-input resize-none" />
          </div>
        </div>
        <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
          {editItem ? (
            <Button label="Delete" icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => { handleDelete(editItem); setDialogOpen(false); }} />
          ) : <div />}
          <div className="flex gap-3">
            <Button label={t('cancel')} className="p-button-text p-button-sm" onClick={() => setDialogOpen(false)} />
            <Button label={saving ? 'Saving...' : t('save')} className="p-button-sm" onClick={handleSave} disabled={saving} icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
