import React from 'react';

export default function Pagination({ pagination = {}, onPageChange, onLimitChange }) {
  const { page = 1, pages = 1, total = 0, limit = 10 } = pagination;

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(2, page - delta);
    const right = Math.min(pages - 1, page + delta);

    range.push(1);
    if (left > 2) range.push('...');
    for (let i = left; i <= right; i++) range.push(i);
    if (right < pages - 1) range.push('...');
    if (pages > 1) range.push(pages);
    return range;
  };

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2 border-t border-gray-100 bg-gray-10 rounded-b-xl">
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>Showing {total > 0 ? start : 0}–{end} of {total}</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="btn btn-secondary btn-sm !px-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {getPageNumbers().map((p, i) => (
            p === '...'
              ? <span key={`e-${i}`} className="px-2 text-gray-400">…</span>
              : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`btn btn-sm !px-3 ${p === page
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'btn-secondary'
                    }`}
                >
                  {p}
                </button>
              )
          ))}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === pages}
            className="btn btn-secondary btn-sm !px-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
