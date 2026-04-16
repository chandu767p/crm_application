import React, { useState, useRef, useCallback, useMemo } from 'react';
import Pagination from './Pagination';
import LoadingSpinner from './LoadingSpinner';

export default function DataTable({
  columns = [],
  onColumnsChange,
  data,
  loading,
  pagination,
  onPageChange,
  onLimitChange,
  onSort,
  sortField,
  sortOrder,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onBulkDelete,
  toolbar,
  onColumnFilterChange,
  emptyMessage = 'No records found',
}) {
  // Table reorder
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const dragColIdx = useRef(null);

  const [columnFilters, setColumnFilters] = useState({});
  const [openFilterCol, setOpenFilterCol] = useState(null);
  const filterMenuRef = useRef(null);

  // Close filter menu on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setOpenFilterCol(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visibleColumns = columns.filter((c) => !c.hidden);

  const handleFilterChange = (key, filterConfig, shouldApply = false) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev, [key]: filterConfig };
      if (shouldApply && onColumnFilterChange) {
        onColumnFilterChange(newFilters);
      }
      return newFilters;
    });
  };

  const applyFilters = () => {
    setColumnFilters((prev) => {
      if (onColumnFilterChange) {
        onColumnFilterChange({ ...prev });
      }
      return prev;
    });
  };

  const clearFilters = () => {
    setColumnFilters({});
    if (onColumnFilterChange) {
      onColumnFilterChange({});
    }
  };

  // ... Drag handlers ... (skipping for brevity but keeping them unchanged)

  const handleDragStart = (e, idx) => {
    dragColIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    const from = dragColIdx.current;
    if (from === null || from === idx) return;

    const visible = columns.filter((c) => !c.hidden);
    const hidden = columns.filter((c) => c.hidden);
    const reordered = [...visible];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(idx, 0, moved);

    if (onColumnsChange) {
      onColumnsChange([...reordered, ...hidden]);
    }

    dragColIdx.current = null;
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    dragColIdx.current = null;
    setDragOverIdx(null);
  };

  const handleSort = (col) => {
    if (!col.sortable) return;
    const newOrder = sortField === col.key && sortOrder === 'desc' ? 'asc' : 'desc';
    if (onSort) onSort(col.key, newOrder);
  };

  const allSelected = data?.length > 0 && data.every((row) => selectedIds?.includes(row._id));
  const someSelected = selectedIds?.length > 0;
  const hasActiveFilters = Object.values(columnFilters).some((f) => f && f.value !== '' && f.value !== undefined);

  return (
    <div className="card flex flex-col h-full min-h-0 overflow-hidden p-0 border-gray-200/60 shadow-sm">
      {/* Toolbar */}
      {(toolbar || someSelected || hasActiveFilters) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 flex-wrap min-h-[32px]">
            {someSelected && (
              <div className="flex items-center gap-1.5 animate-in slide-in-from-left-2 duration-200">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {selectedIds.length} Selected
                </span>
                <button onClick={onBulkDelete} className="btn-danger p-1 rounded-md text-[10px] h-7 px-2">
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-tight transition-colors flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md border border-red-100"
              >
                Clear Filters
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}

            {toolbar}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto custom-scrollbar flex-1 min-h-0">
        <table className="w-full text-[11px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              {/* Checkbox */}
              <th className="w-8 px-2 py-1 sticky top-0 bg-gray-50 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] align-middle">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>

              {/* S.No. */}
              <th className="px-2 py-1 text-left font-bold text-gray-400 sticky top-0 bg-gray-50 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] whitespace-nowrap select-none w-10 align-middle text-[9px] uppercase tracking-tighter border-r border-gray-100/50">
                #
              </th>

              {visibleColumns.map((col, idx) => {
                const activeFilter = columnFilters[col.key];
                const isFiltered = activeFilter && (
                  (activeFilter.value !== undefined && activeFilter.value !== '') ||
                  (activeFilter.value2 !== undefined && activeFilter.value2 !== '')
                );

                return (
                  <th
                    key={col.key}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`
                          px-2 py-1 text-left font-bold text-gray-500 sticky top-0 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] whitespace-nowrap select-none align-middle
                          ${dragOverIdx === idx ? 'bg-blue-50/80 border-l-2 border-blue-400' : isFiltered ? 'bg-blue-50/30' : 'bg-gray-50'}
                          transition-all duration-150
                        `}
                    style={{ minWidth: col.minWidth || 80 }}
                  >
                    <div className="flex flex-col w-full">
                      {/* Header Label Row */}
                      <div className="flex items-center gap-1.5 z-10 relative">
                        <span
                          title="Drag to reorder"
                          className="text-gray-200 hover:text-gray-400 cursor-grab active:cursor-grabbing text-[9px] mr-0.5"
                          onDragStart={(e) => { e.stopPropagation(); }}
                        >
                          ⋮⋮
                        </span>
                        <span
                          className={`font-bold transition-colors flex-1 truncate ${isFiltered ? 'text-blue-700' : 'text-gray-700'
                            } ${col.sortable ? 'cursor-pointer hover:text-gray-900' : ''}`}
                          onClick={() => col.sortable && handleSort(col)}
                        >
                          {col.label}
                        </span>

                        <div className="flex items-center gap-1 ml-auto">
                          {col.sortable && (
                            <button onClick={() => handleSort(col)} className="text-gray-400 hover:text-blue-500 transition-colors">
                              {sortField === col.key ? (
                                sortOrder === 'asc' ? (
                                  <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                  </svg>
                                )
                              ) : (
                                <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                              )}
                            </button>
                          )}

                          {/* Filter Toggle Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFilterCol(openFilterCol === col.key ? null : col.key);
                            }}
                            className={`p-1 rounded-md transition-all duration-200 ${isFiltered
                              ? 'text-white bg-blue-600 shadow-sm shadow-blue-200 hover:bg-blue-700'
                              : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100'
                              }`}
                            title="Filter"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                          </button>
                        </div>

                        {/* Filter Dropdown Overlay */}
                        {openFilterCol === col.key && (
                          <div
                            ref={filterMenuRef}
                            className={`absolute top-full mt-2 w-64 max-w-[280px] bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] p-4 animate-in fade-in zoom-in duration-150 origin-top text-xs whitespace-normal
                                  ${idx > visibleColumns.length / 2 ? 'right-0' : 'left-0'}
                                `}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2 flex items-center justify-between">
                              Filter {col.label}
                              <button onClick={() => setOpenFilterCol(null)} className="text-gray-300 hover:text-gray-500 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </p>
                            <ColumnFilter
                              column={col}
                              filter={columnFilters[col.key]}
                              onChange={(val, shouldApply) => handleFilterChange(col.key, val, shouldApply)}
                              onEnter={() => {
                                applyFilters();
                                setOpenFilterCol(null);
                              }}
                              onClear={() => {
                                handleFilterChange(col.key, {}, true);
                                setOpenFilterCol(null);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}

              {/* Actions header */}
              <th className="px-2 py-1 text-right font-bold text-gray-400 sticky top-0 bg-gray-50 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] w-20 align-middle text-[9px] uppercase tracking-tighter">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + 3} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <LoadingSpinner size="lg" />
                    <span className="text-sm">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : (!data || data.length === 0) ? (
              <tr>
                <td colSpan={visibleColumns.length + 3} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium">
                      {hasActiveFilters ? 'No records match your column filters' : emptyMessage}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              data?.map((row, index) => {
                const serialNumber = pagination && pagination.page && pagination.limit
                  ? (pagination.page - 1) * pagination.limit + index + 1
                  : index + 1;

                return (
                  <tr
                    key={row._id}
                    className={`hover:bg-blue-50/30 transition-colors ${selectedIds?.includes(row._id) ? 'bg-blue-50' : 'bg-white'
                      }`}
                  >
                    <td className="px-2 py-1 align-middle border-b border-gray-50/50">
                      <input
                        type="checkbox"
                        checked={selectedIds?.includes(row._id)}
                        onChange={() => onSelectRow(row._id)}
                        className="rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                    </td>

                    {/* S.No. Cell */}
                    <td className="px-2 py-1 text-gray-400 font-bold text-[9px] align-middle border-b border-gray-50/50 border-r border-gray-50/50">
                      {serialNumber}
                    </td>

                    {visibleColumns.map((col) => (
                      <td key={col.key} className="px-2 py-1 text-gray-700 font-medium align-middle border-b border-gray-50/50">
                        {col.render ? col.render(row) : (
                          <span className="truncate max-w-xs block leading-tight">
                            {getNestedValue(row, col.key) ?? '—'}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-1 align-middle border-b border-gray-50/50">
                      <div className="flex items-center justify-end gap-0.5">
                        {row._actions}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
}

function ColumnFilter({ column, filter, onChange, onEnter, onClear }) {
  const type = column.type || 'text';
  const hasOptions = column.options && column.options.length > 0;

  // Default operator for enums is 'in' (multi-select)
  const defaultOp = hasOptions ? 'in' : (type === 'text' ? 'contains' : 'equals');
  const operator = filter?.operator || defaultOp;
  const value = filter?.value || (operator === 'in' ? [] : '');
  const value2 = filter?.value2 || '';

  const handleOpChange = (e) => {
    const newOp = e.target.value;
    const isMulti = newOp === 'in';
    const newFilter = {
      ...filter,
      operator: newOp,
      value: isMulti ? [] : ''
    };
    onChange(newFilter, false);
  };

  const handleValueChange = (e) => {
    const newFilter = {
      ...filter,
      operator,
      value: e.target.value
    };
    onChange(newFilter, false);
  };

  const handleMultiSelectToggle = (optValue) => {
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = currentValues.includes(optValue)
      ? currentValues.filter(v => v !== optValue)
      : [...currentValues, optValue];

    onChange({ ...filter, operator: 'in', value: newValues }, false);
  };

  const handleValue2Change = (e) => {
    onChange({ ...filter, operator, value2: e.target.value }, false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onEnter();
  };

  const isUnary = ['is_empty', 'is_not_empty'].includes(operator);

  return (
    <div className="flex flex-col gap-3 min-w-0" onClick={(e) => e.stopPropagation()}>
      {!hasOptions && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Operator</label>
          <select
            value={operator}
            onChange={handleOpChange}
            className="w-full min-w-0 text-xs py-1.5 px-2 rounded-lg border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
          >
            {type === 'text' && (
              <>
                <option value="contains">Contains</option>
                <option value="not_contains">Doesn't Contain</option>
                <option value="is">Is</option>
                <option value="isn't">Isn't</option>
                <option value="starts_with">Starts With</option>
                <option value="ends_with">Ends With</option>
                <option value="is_empty">Is Empty</option>
                <option value="is_not_empty">Is Not Empty</option>
              </>
            )}
            {(type === 'number' || type === 'date') && (
              <>
                <option value="equals">Is</option>
                <option value="isn't">Isn't</option>
                <option value="gt">{type === 'date' ? 'After' : 'Greater Than'}</option>
                <option value="lt">{type === 'date' ? 'Before' : 'Less Than'}</option>
                {type === 'date' && <option value="between">Between</option>}
                <option value="is_empty">Is Empty</option>
                <option value="is_not_empty">Is Not Empty</option>
              </>
            )}
          </select>
        </div>
      )}

      {hasOptions ? (
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Select Values</label>
          <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {column.options.map(opt => {
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              const optValue = typeof opt === 'object' ? opt.value : opt;
              const isChecked = Array.isArray(value) && value.includes(optValue);

              return (
                <label key={optValue} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer transition-colors group">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleMultiSelectToggle(optValue)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span className={`text-[11px] truncate ${isChecked ? 'text-blue-700 font-bold' : 'text-gray-600'}`}>
                    {optLabel}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ) : (
        !isUnary && (
          <>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                {operator === 'between' ? 'From' : 'Value'}
              </label>
              <input
                type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                value={value}
                onChange={handleValueChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter value..."
                className="w-full min-w-0 text-xs py-1.5 px-2 rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
                autoFocus
              />
            </div>

            {operator === 'between' && type === 'date' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">To</label>
                <input
                  type="date"
                  value={value2}
                  onChange={handleValue2Change}
                  onKeyDown={handleKeyDown}
                  className="w-full min-w-0 text-xs py-1.5 px-2 rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium"
                />
              </div>
            )}
          </>
        )
      )}

      <div className="flex gap-2 pt-3 mt-1 border-t border-gray-50">
        <button
          onClick={onClear}
          className="flex-1 px-3 py-2 text-[11px] font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent"
        >
          Reset
        </button>
        <button
          onClick={onEnter}
          className="flex-1 px-3 py-2 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 transition-all"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
