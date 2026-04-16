import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import Modal from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'followup', label: 'Follow Up' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'custom', label: 'Custom' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const EMPTY_FORM = {
  name: '',
  subject: '',
  body: '',
  category: 'custom',
  active: true,
};

const DEFAULT_BODY = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
  <p>Hello {{name}},</p>
  <p>Thank you for connecting with {{company}}.</p>
  <p>Our team would love to help you move forward.</p>
  <p>Best regards,<br />{{agent}}</p>
</div>`;

const DEFAULT_SAMPLE_DATA = {
  name: 'John Doe',
  company: 'Acme Corp',
  email: 'john@acme.com',
  date: new Date().toLocaleDateString(),
  agent: 'Sales Agent',
  proposalValue: '$12,500',
};

const CATEGORY_STYLES = {
  followup: 'bg-sky-50 text-sky-700 border-sky-100',
  welcome: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  proposal: 'bg-amber-50 text-amber-700 border-amber-100',
  custom: 'bg-slate-100 text-slate-700 border-slate-200',
};

const normalizeVariableKey = (value = '') =>
  value
    .trim()
    .replace(/[{}]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^\w.]/g, '');

const buildSampleDataForVariables = (variables = [], currentSampleData = DEFAULT_SAMPLE_DATA) => {
  const nextSampleData = { ...currentSampleData };

  variables.forEach((variable) => {
    if (nextSampleData[variable] === undefined) {
      nextSampleData[variable] = '';
    }
  });

  return nextSampleData;
};

const renderTemplate = (template = '', sampleData = {}) =>
  template.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key) => {
    const value = sampleData[key];
    return value === undefined || value === null ? `{{${key}}}` : String(value);
  });

const stripHtml = (html = '') =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractVariables = (value = '') =>
  Array.from(new Set([...value.matchAll(/{{\s*([\w.]+)\s*}}/g)].map((match) => match[1])));

const formatRelativeDate = (value) => {
  if (!value) return 'Recently updated';

  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round((now - then) / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString();
};

export default function EmailTemplates() {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [active, setActive] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [sampleData, setSampleData] = useState(DEFAULT_SAMPLE_DATA);
  const [newVariableName, setNewVariableName] = useState('');
  const [previewVariableName, setPreviewVariableName] = useState('');
  const [serverPreview, setServerPreview] = useState({
    subject: '',
    preview: '',
    sampleData: DEFAULT_SAMPLE_DATA,
  });

  useEffect(() => {
    fetchTemplates();
  }, [search, category, active]);

  useEffect(() => {
    if (!selectedId && templates.length > 0) {
      setSelectedId(templates[0]._id);
    }

    if (selectedId && !templates.some((template) => template._id === selectedId)) {
      setSelectedId(templates[0]?._id || null);
    }
  }, [templates, selectedId]);

  useEffect(() => {
    if (selectedId) {
      fetchPreview(selectedId, sampleData);
    } else {
      setServerPreview({
        subject: '',
        preview: '',
        sampleData,
      });
    }
  }, [selectedId]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template._id === selectedId) || null,
    [templates, selectedId]
  );

  const selectedVariables = useMemo(() => {
    if (!selectedTemplate) return [];

    return extractVariables(`${selectedTemplate.subject}\n${selectedTemplate.body}`);
  }, [selectedTemplate]);

  const sampleDataKeys = useMemo(
    () => Array.from(new Set([...selectedVariables, ...Object.keys(sampleData)])),
    [selectedVariables, sampleData]
  );

  const localPreview = useMemo(() => ({
    subject: renderTemplate(form.subject, sampleData),
    body: renderTemplate(form.body, sampleData),
    variables: extractVariables(`${form.subject}\n${form.body}`),
  }), [form, sampleData]);

  useEffect(() => {
    if (selectedVariables.length > 0) {
      setSampleData((current) => buildSampleDataForVariables(selectedVariables, current));
    }
  }, [selectedVariables]);

  useEffect(() => {
    if (localPreview.variables.length > 0 && modalOpen) {
      setSampleData((current) => buildSampleDataForVariables(localPreview.variables, current));
    }
  }, [localPreview.variables, modalOpen]);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (active) params.set('active', active);
      params.set('limit', '100');
      params.set('sort', '-updatedAt');

      const response = await api.get(`/email-templates?${params.toString()}`);
      setTemplates(response.data.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPreview(templateId, nextSampleData = sampleData) {
    setPreviewLoading(true);
    try {
      const response = await api.post(`/email-templates/${templateId}/preview`, {
        sampleData: nextSampleData,
      });

      setServerPreview({
        subject: response.data.subject,
        preview: response.data.preview,
        sampleData: response.data.sampleData || nextSampleData,
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPreviewLoading(false);
    }
  }

  const openCreateModal = () => {
    setEditingTemplate(null);
    setForm({
      ...EMPTY_FORM,
      body: DEFAULT_BODY,
    });
    setNewVariableName('');
    setModalOpen(true);
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setForm({
      name: template.name || '',
      subject: template.subject || '',
      body: template.body || '',
      category: template.category || 'custom',
      active: template.active !== false,
    });
    setNewVariableName('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTemplate(null);
    setForm(EMPTY_FORM);
    setNewVariableName('');
  };

  const handleFormChange = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSampleChange = (key) => (event) => {
    setSampleData((current) => ({ ...current, [key]: event.target.value }));
  };

  const insertSnippet = (snippet) => {
    setForm((current) => ({
      ...current,
      body: current.body ? `${current.body}\n${snippet}` : snippet,
    }));
  };

  const handleAddVariableToTemplate = () => {
    const variableKey = normalizeVariableKey(newVariableName);

    if (!variableKey) {
      toast.error('Enter a valid variable name');
      return;
    }

    setForm((current) => {
      const placeholder = `{{${variableKey}}}`;
      const draft = `${current.subject}\n${current.body}`;

      return {
        ...current,
        body: draft.includes(placeholder)
          ? current.body
          : `${current.body}${current.body ? '\n' : ''}<p>${placeholder}</p>`,
      };
    });

    setSampleData((current) => buildSampleDataForVariables([variableKey], current));
    setNewVariableName('');
  };

  const handleAddPreviewVariable = () => {
    const variableKey = normalizeVariableKey(previewVariableName);

    if (!variableKey) {
      toast.error('Enter a valid variable name');
      return;
    }

    setSampleData((current) => buildSampleDataForVariables([variableKey], current));
    setPreviewVariableName('');
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      toast.error('Name, subject, and body are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        body: form.body,
        category: form.category,
        active: form.active,
      };

      let response;

      if (editingTemplate) {
        response = await api.put(`/email-templates/${editingTemplate._id}`, payload);
        toast.success('Template updated');
      } else {
        response = await api.post('/email-templates', payload);
        toast.success('Template created');
      }

      closeModal();
      await fetchTemplates();

      if (response?.data?.data?._id) {
        const nextId = response.data.data._id;
        setSelectedId(nextId);

        if (nextId === selectedId) {
          await fetchPreview(nextId, sampleData);
        }
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`Delete "${template.name}"?`)) return;

    try {
      await api.delete(`/email-templates/${template._id}`);
      toast.success('Template deleted');

      if (selectedId === template._id) {
        setSelectedId(null);
      }

      await fetchTemplates();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRefreshPreview = async () => {
    if (!selectedId) return;
    await fetchPreview(selectedId, sampleData);
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage reusable HTML email templates with live preview and sample merge data.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchTemplates} className="btn-secondary px-3 py-2 text-sm">
            Refresh
          </button>
          <button onClick={openCreateModal} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-4 flex-1 min-h-0">
        <section className="card p-0 overflow-hidden flex flex-col min-h-[540px]">
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="form-label">Search</label>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="form-input"
                  placeholder="Search by name, subject, or body"
                />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="form-input">
                  {CATEGORIES.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select value={active} onChange={(event) => setActive(event.target.value)} className="form-input">
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/70">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              {loading ? 'Loading templates...' : `${templates.length} templates`}
            </p>
            <p className="text-xs text-gray-400">Click a card to preview</p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-gray-50/50">
            {!loading && templates.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center">
                <p className="text-sm font-semibold text-gray-700">No templates found</p>
                <p className="text-xs text-gray-500 mt-1">Try a different filter or create a new template.</p>
              </div>
            )}

            {templates.map((template) => {
              const isSelected = template._id === selectedId;
              const previewText = stripHtml(renderTemplate(template.body, sampleData)).slice(0, 160);

              return (
                <button
                  key={template._id}
                  onClick={() => setSelectedId(template._id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50/70 shadow-md shadow-blue-100/70'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{renderTemplate(template.subject, sampleData)}</p>
                    </div>
                    <span className={`badge border capitalize ${CATEGORY_STYLES[template.category] || CATEGORY_STYLES.custom}`}>
                      {template.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className={`badge border ${template.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                      {template.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {template.createdBy?.name || 'Unknown author'}
                    </span>
                    <span className="text-[11px] text-gray-300">•</span>
                    <span className="text-[11px] text-gray-400">{formatRelativeDate(template.updatedAt)}</span>
                  </div>

                  <p className="text-xs text-gray-500 mt-3 leading-5">
                    {previewText || 'No preview text available'}
                    {previewText.length >= 160 ? '...' : ''}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card p-0 overflow-hidden flex flex-col min-h-[540px]">
          {!selectedTemplate ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-8 8h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-gray-900">Select a template</p>
                <p className="text-sm text-gray-500 mt-2">
                  Choose a template from the left to inspect its HTML preview and sample rendering.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-100 bg-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-semibold text-gray-900">{selectedTemplate.name}</h2>
                      <span className={`badge border capitalize ${CATEGORY_STYLES[selectedTemplate.category] || CATEGORY_STYLES.custom}`}>
                        {selectedTemplate.category}
                      </span>
                      <span className={`badge border ${selectedTemplate.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                        {selectedTemplate.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Created by {selectedTemplate.createdBy?.name || 'Unknown author'} on{' '}
                      {new Date(selectedTemplate.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={handleRefreshPreview} className="btn-secondary px-3 py-2 text-sm" disabled={previewLoading}>
                      {previewLoading ? 'Refreshing...' : 'Refresh Preview'}
                    </button>
                    <button onClick={() => openEditModal(selectedTemplate)} className="btn-secondary px-3 py-2 text-sm">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedTemplate)}
                      className="px-3 py-2 text-sm rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 2xl:grid-cols-[320px_minmax(0,1fr)] flex-1 min-h-0">
                <aside className="border-r border-gray-100 bg-gray-50/70 p-4 overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Sample data</p>
                        <button
                          onClick={handleRefreshPreview}
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Re-render
                        </button>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <input
                          value={previewVariableName}
                          onChange={(event) => setPreviewVariableName(event.target.value)}
                          className="form-input"
                          placeholder="Add custom variable"
                        />
                        <button
                          type="button"
                          onClick={handleAddPreviewVariable}
                          className="btn-secondary px-3 py-2 text-xs"
                        >
                          Add
                        </button>
                      </div>
                      <div className="space-y-3 mt-4">
                        {sampleDataKeys.map((key) => (
                          <div key={key}>
                            <label className="form-label capitalize">{key}</label>
                            <input value={sampleData[key] ?? ''} onChange={handleSampleChange(key)} className="form-input" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Variables used</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedVariables.length > 0 ? (
                          selectedVariables.map((variable) => (
                            <span key={variable} className="badge bg-blue-50 text-blue-700 border border-blue-100">
                              {`{{${variable}}}`}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">No merge variables detected.</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Subject preview</p>
                      <p className="text-sm font-medium text-gray-900 mt-3 break-words">
                        {serverPreview.subject || renderTemplate(selectedTemplate.subject, sampleData)}
                      </p>
                    </div>
                  </div>
                </aside>

                <div className="flex flex-col min-h-0 bg-white">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Rendered HTML preview</p>
                    <p className="text-sm text-gray-500 mt-1">
                      This uses the server preview endpoint with your current sample data.
                    </p>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-5">
                    <div className="max-w-4xl mx-auto rounded-[28px] border border-gray-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400 font-semibold">Subject</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1 break-words">
                          {serverPreview.subject || renderTemplate(selectedTemplate.subject, sampleData)}
                        </p>
                      </div>
                      <div
                        className="p-6 min-h-[360px] prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: serverPreview.preview || renderTemplate(selectedTemplate.body, sampleData),
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingTemplate ? 'Edit Email Template' : 'New Email Template'}
        size="2xl"
        footer={(
          <>
            <button onClick={closeModal} className="btn-secondary px-4 py-2 text-sm">
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
            </button>
          </>
        )}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Template name</label>
                <input
                  value={form.name}
                  onChange={handleFormChange('name')}
                  className="form-input"
                  placeholder="Follow-up after demo"
                />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select value={form.category} onChange={handleFormChange('category')} className="form-input">
                  {CATEGORIES.filter((option) => option.value).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Subject</label>
              <input
                value={form.subject}
                onChange={handleFormChange('subject')}
                className="form-input"
                placeholder="Hello {{name}}, quick follow-up from {{company}}"
              />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="form-label mb-0">HTML body</label>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => insertSnippet('<p>Hello {{name}},</p>')}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Greeting
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('<p><strong>{{company}}</strong></p>')}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Company
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('<p>Best regards,<br />{{agent}}</p>')}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Signature
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('<a href="https://example.com" style="color:#2563eb;">View proposal</a>')}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  CTA link
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Custom variables</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Add any placeholder and it will be available in preview sample data.
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    value={newVariableName}
                    onChange={(event) => setNewVariableName(event.target.value)}
                    className="form-input sm:w-52"
                    placeholder="deal_stage"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariableToTemplate}
                    className="btn-secondary px-3 py-2 text-xs"
                  >
                    Add Variable
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {localPreview.variables.length > 0 ? (
                  localPreview.variables.map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => insertSnippet(`{{${variable}}}`)}
                      className="badge bg-white text-blue-700 border border-blue-100 hover:bg-blue-50"
                    >
                      {`{{${variable}}}`}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">Add variables like `name`, `deal_stage`, or `next_step`.</span>
                )}
              </div>
            </div>

            <textarea
              value={form.body}
              onChange={handleFormChange('body')}
              className="form-input min-h-[360px] font-mono text-[12px] leading-6 resize-y"
              placeholder="Write email HTML here"
            />

            <label className="inline-flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={handleFormChange('active')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Active template
            </label>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Merge variables</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {localPreview.variables.length > 0 ? (
                  localPreview.variables.map((variable) => (
                    <span key={variable} className="badge bg-white text-blue-700 border border-blue-100">
                      {`{{${variable}}}`}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">No merge variables in this draft yet.</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Live preview</p>
                <p className="text-sm font-medium text-gray-900 mt-1 break-words">{localPreview.subject || 'Subject preview'}</p>
              </div>
              <div
                className="p-4 max-h-[420px] overflow-y-auto custom-scrollbar"
                dangerouslySetInnerHTML={{ __html: localPreview.body || '<p style="color:#94a3b8;">Draft preview will appear here.</p>' }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
