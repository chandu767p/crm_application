import React, { useState, useRef, useEffect } from 'react';

export default function ColumnSettings({ columns, onChange }) {
  const [showMenu, setShowMenu] = useState(false);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const dragIdxRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleColumn = (key) => {
    const newColumns = columns.map((c) =>
      c.key === key ? { ...c, hidden: !c.hidden } : c
    );
    onChange(newColumns);
  };

  const handleDragStart = (e, idx) => {
    dragIdxRef.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    const from = dragIdxRef.current;
    if (from === null || from === idx) return;

    const copy = [...columns];
    const [moved] = copy.splice(from, 1);
    copy.splice(idx, 0, moved);
    onChange(copy);
    setDragOverIdx(null);
    dragIdxRef.current = null;
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        id="column-settings-toggle"
        onClick={() => setShowMenu(!showMenu)}
        className={`btn-secondary btn-sm h-8 px-3 flex items-center gap-2 transition-all shadow-sm ${showMenu ? 'bg-gray-100 border-gray-400' : ''
          }`}
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <span className="font-bold">Columns</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-150 origin-top-right">
          <div className="px-3 pb-2 flex items-center justify-between border-b border-gray-50 mb-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Table Columns</span>
            <button onClick={() => setShowMenu(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {columns.map((col, idx) => (
              <label
                key={col.key || idx}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={() => { setDragOverIdx(null); dragIdxRef.current = null; }}
                className={`flex items-center gap-2.5 px-3 py-1.5 hover:bg-blue-50/50 cursor-pointer transition-colors ${dragOverIdx === idx ? 'bg-blue-50 border-y border-blue-100' : ''
                  }`}
              >
                <span title="Drag to reorder" className="text-gray-200 hover:text-blue-400 cursor-grab active:cursor-grabbing text-[9px] w-3 font-black">⋮⋮</span>
                <input
                  type="checkbox"
                  checked={!col.hidden}
                  onChange={() => toggleColumn(col.key)}
                  className="rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className={`flex-1 text-[11px] font-bold truncate ${col.hidden ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-700'}`}>
                  {col.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
