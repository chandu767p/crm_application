import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { debounce } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function FilterBar({ filters, onChange, fields, module }) {
  const { user } = useAuth();
  const toast = useToast();
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [savedFilters, setSavedFilters] = useState([]);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  // Load saved filters for this module
  useEffect(() => {
    if (!module) return;
    api.get(`/saved-filters?module=${module}`)
      .then(r => {
        setSavedFilters(r.data.data || []);
        // Auto-apply default filter on first load
        const def = r.data.data?.find(f => f.isDefault);
        if (def) onChange({ ...def.filters, page: 1 });
      })
      .catch(() => {});
  }, [module]);

  const debouncedChange = React.useMemo(
    () => debounce((val) => onChange({ ...filters, search: val, page: 1 }), 350),
    [filters, onChange]
  );

  useEffect(() => { setLocalSearch(filters.search || ''); }, [filters.search]);

  const handleSearch = (val) => { setLocalSearch(val); debouncedChange(val); };
  const handleField = (key, val) => onChange({ ...filters, [key]: val, page: 1 });

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => !['page', 'limit', 'sort'].includes(k) && v
  );

  const clearAll = () => {
    const cleared = { page: 1, limit: filters.limit, sort: filters.sort };
    fields.forEach(f => { cleared[f.key] = ''; });
    onChange(cleared);
  };

  const handleSaveFilter = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/saved-filters', { name: saveName.trim(), module, filters });
      setSavedFilters(prev => [res.data.data, ...prev]);
      setShowSaveInput(false);
      setSaveName('');
      toast.success('Filter saved!');
    } catch (err) { toast.error('Failed to save filter'); }
    finally { setSaving(false); }
  };

  const handleSetDefault = async (sf) => {
    try {
      await api.put(`/saved-filters/${sf._id}/default`);
      setSavedFilters(prev => prev.map(f => ({ ...f, isDefault: f._id === sf._id })));
      toast.success(`"${sf.name}" set as default`);
    } catch { toast.error('Failed to set default'); }
  };

  const handleDeleteSavedFilter = async (sf) => {
    try {
      await api.delete(`/saved-filters/${sf._id}`);
      setSavedFilters(prev => prev.filter(f => f._id !== sf._id));
    } catch { toast.error('Failed to delete filter'); }
  };

  const applyFilter = (sf) => onChange({ ...sf.filters, page: 1 });

  return (
    <div className="card p-2 px-3 mb-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={localSearch} onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search..." className="form-input pl-8 pr-8 text-xs py-1.5 shadow-sm" />
          {localSearch && (
            <button onClick={() => handleSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Dynamic filter fields */}
        {fields?.map((field) => (
          <div key={field.key} className="min-w-[140px]">
            {field.type === 'select' ? (
              <select value={filters[field.key] || ''} onChange={(e) => handleField(field.key, e.target.value)} className="form-input">
                <option value="">{field.placeholder || `All ${field.label}`}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input type={field.type || 'text'} value={filters[field.key] || ''}
                onChange={(e) => handleField(field.key, e.target.value)}
                placeholder={field.placeholder || field.label} className="form-input text-xs py-1.5" />
            )}
          </div>
        ))}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button onClick={clearAll} className="btn-secondary py-1 px-2 text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-tighter shadow-sm">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}

        {/* Save filter button */}
        {module && (
          <button onClick={() => setShowSaveInput(!showSaveInput)}
            className={`btn-secondary py-1 px-2 text-[10px] font-bold uppercase tracking-tighter shadow-sm ${showSaveInput ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-500'}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Save
          </button>
        )}
      </div>

      {/* Save filter input */}
      {showSaveInput && (
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100 animate-in slide-in-from-top-1 duration-200">
          <input value={saveName} onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
            placeholder="Filter name (e.g. High Priority Leads)..."
            className="form-input flex-1 text-xs py-1.5" autoFocus />
          <button onClick={handleSaveFilter} disabled={saving || !saveName.trim()}
            className="btn-primary py-1 px-3 text-[10px]">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      {/* Saved filters chips */}
      {module && savedFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest self-center">Saved:</span>
          {savedFilters.map(sf => (
            <div key={sf._id} className={`flex items-center gap-1 text-[10px] rounded-lg px-2 py-1 border transition-all
              ${sf.isDefault ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
              <button onClick={() => applyFilter(sf)} className="font-semibold">{sf.name}</button>
              {sf.isDefault && <span className="text-[8px] opacity-75">✓ default</span>}
              <div className="flex items-center gap-0.5 ml-1">
                {!sf.isDefault && (
                  <button onClick={() => handleSetDefault(sf)} title="Set as default"
                    className="opacity-50 hover:opacity-100 text-blue-500">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                )}
                <button onClick={() => handleDeleteSavedFilter(sf)} title="Remove"
                  className={`opacity-50 hover:opacity-100 ${sf.isDefault ? 'text-white' : 'text-red-400'}`}>
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
