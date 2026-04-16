import React, { useState, useRef } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from './Modal';

export default function BulkUpload({ module, onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const toast = useToast();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/bulk-upload/${module}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.data);
      toast.success(res.data.message);
      if (res.data.data.success > 0) onSuccess?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
    setResult(null);
  };

  const templateFields = {
    users: 'name,email,password,role',
    leads: 'name,email,phone,status,source,value,account,assignedTo',
    contacts: 'name,email,phone,jobTitle,status,source,account,assignedTo,tags,address.street,address.city,address.state,address.zip,address.country',
    deals: 'name,value,stage,probability,expectedCloseDate,account,contact,assignedTo',
    accounts: 'name,industry,website,email,phone,address.street,address.city,address.state,address.zip,address.country',
    tickets: 'subject,description,status,priority,contact,assignedTo',
    tasks: 'title,description,status,priority,dueDate,relatedTo,onModel,assignedTo',
    activities: 'type,subject,description,relatedTo,onModel',
  };

  const downloadTemplate = () => {
    const content = templateFields[module];
    const blob = new Blob([content + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${module}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-secondary btn-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Bulk Upload
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Bulk Upload ${module.charAt(0).toUpperCase() + module.slice(1)}`}
        size="md"
      >
        <div className="space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-blue-800">Download CSV Template</p>
              <p className="text-xs text-blue-600 mt-0.5">Use this template to format your data</p>
            </div>
            <button onClick={downloadTemplate} className="btn-secondary btn-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Template
            </button>
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
              ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium text-green-700">{file.name}</p>
                <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-xs text-gray-500 hover:text-red-500 underline mt-1"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-gray-600">Drop your file here or click to browse</p>
                <p className="text-xs">Supports CSV and XLSX (max 10MB)</p>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <div className="flex gap-0">
                <div className="flex-1 text-center py-3 bg-green-50">
                  <p className="text-2xl font-semibold text-green-600">{result.success}</p>
                  <p className="text-xs text-green-600 font-medium">Created</p>
                </div>
                <div className="flex-1 text-center py-3 bg-red-50 border-l border-gray-200">
                  <p className="text-2xl font-semibold text-red-600">{result.errors.length}</p>
                  <p className="text-xs text-red-600 font-medium">Failed</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="p-3 max-h-40 overflow-y-auto bg-gray-50 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Error Details:</p>
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-xs text-red-600 mb-1">
                      Row {e.row}: {e.errors.join(', ')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={handleClose} className="btn-secondary">Cancel</button>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </>
              ) : 'Upload'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
