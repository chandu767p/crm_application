import React, { useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { downloadCSV } from '../../utils/helpers';

export default function ExportButton({ module, filters = {}, visibleColumns }) {
  const [loading, setLoading] = useState(null); // 'csv' or 'pdf'
  const [showMenu, setShowMenu] = useState(false);
  const toast = useToast();

  const handleExport = async (format) => {
    setLoading(format);
    setShowMenu(false);
    try {
      const exportFilters = { ...filters, format };
      delete exportFilters.page;
      delete exportFilters.limit;

      const params = new URLSearchParams(exportFilters);
      if (visibleColumns && visibleColumns.length > 0) {
        params.set('columns', visibleColumns.join(','));
      }

      const res = await api.get(`/export/${module}?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${module}_export_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${module} ${format.toUpperCase()} exported successfully`);
    } catch (err) {
      toast.error(err.message || 'Export failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={!!loading}
        className="btn-secondary btn-sm flex items-center gap-2"
      >
        {loading ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
        <span>{loading ? 'Exporting...' : 'Export'}</span>
        <svg className={`w-3 h-3 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-20">
            <button
              onClick={() => handleExport('csv')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              CSV Spreadsheet
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              PDF Document
            </button>
          </div>
        </>
      )}
    </div>
  );
}
