import React, { useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { downloadCSV } from '../../utils/helpers';

export default function ExportButton({ module, filters = {}, visibleColumns }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      const exportFilters = { ...filters };
      delete exportFilters.page;
      delete exportFilters.limit;

      const params = new URLSearchParams(exportFilters);
      if (visibleColumns && visibleColumns.length > 0) {
        params.set('columns', visibleColumns.join(','));
      }

      const res = await api.get(`/export/${module}?${params.toString()}`, {
        responseType: 'blob',
      });

      const text = await res.data.text();
      const filename = `${module}_export_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(text, filename);
      toast.success(`${module} data exported successfully`);
    } catch (err) {
      toast.error(err.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="btn-secondary btn-sm"
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Exporting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </>
      )}
    </button>
  );
}
