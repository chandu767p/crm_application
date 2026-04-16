import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDateFromNow, getInitials, getAvatarColor } from '../../utils/helpers';

const AddNoteBox = ({ leadId, onNoteAdded }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await api.post(`/leads/${leadId}/notes`, { content });
      toast.success('Note added');
      setContent('');
      onNoteAdded(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <textarea
        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all resize-none text-[11px] font-semibold"
        rows="2"
        placeholder="Write a note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading}
      />
      <div className="flex justify-end mt-1.5">
        <button
          type="submit"
          className="btn-primary py-1 px-3 text-[10px] font-semibold  tracking-widest "
          disabled={loading || !content.trim()}
        >
          {loading ? 'Adding...' : 'Add Note'}
        </button>
      </div>
    </form>
  );
};

const NoteItem = ({ note, onUpdate, onDelete, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const canManage = currentUser?._id === note.createdBy?._id || currentUser?.role?.name === 'admin' || currentUser?.role === 'admin';

  const handleUpdate = async () => {
    if (!editContent.trim() || editContent === note.content) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.put(`/notes/${note._id}`, { content: editContent });
      toast.success('Note updated');
      onUpdate(res.data.data);
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update note');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/notes/${note._id}`);
      toast.success('Note deleted');
      onDelete(note._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete note');
    }
  };

  const creatorName = note.createdBy?.name || 'Unknown User';

  return (
    <div className="group bg-gray-50/50 rounded-xl p-2.5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200 relative mb-2">
      <div className="flex items-start gap-2">
        <div className={`w-6 h-6 rounded-full ${getAvatarColor(creatorName)} flex items-center justify-center text-white text-[9px] font-semibold shrink-0 `}>
          {getInitials(creatorName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-900">{creatorName}</span>
              <span className="text-[8px]  tracking-wider text-gray-400 font-semibold">• {formatDateFromNow(note.createdAt)}</span>
            </div>
            {canManage && !isEditing && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                  className="p-0.5 text-gray-400 hover:text-blue-500 rounded transition-colors"
                  title="Edit"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="p-0.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
              <textarea
                className="w-full p-2 text-xs border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-50 outline-none transition-all resize-none font-semibold"
                rows="2"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-1.5 mt-1.5">
                <button onClick={() => setIsEditing(false)} className="px-2 py-1 text-[10px] font-semibold text-gray-500 hover:bg-gray-100 rounded ">Cancel</button>
                <button onClick={handleUpdate} className="px-2 py-1 text-[10px] font-semibold bg-blue-600 text-white rounded  hover:bg-blue-700  transition-colors" disabled={loading}>Save</button>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-gray-700 leading-snug font-medium whitespace-pre-wrap">{note.content}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function NotesSection({ leadId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchNotes();
    fetchCurrentUser();
  }, [leadId]);

  const fetchNotes = async () => {
    try {
      const res = await api.get(`/leads/${leadId}/notes`);
      setNotes(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setCurrentUser(res.data.user);
    } catch (err) {
      console.error('Failed to fetch current user');
    }
  };

  const handleNoteAdded = (newNote) => {
    setNotes([newNote, ...notes]);
  };

  const handleNoteUpdated = (updatedNote) => {
    setNotes(notes.map(n => n._id === updatedNote._id ? updatedNote : n));
  };

  const handleNoteDeleted = (id) => {
    setNotes(notes.filter(n => n._id !== id));
  };

  if (loading) return <div className="text-center py-4 text-[10px] font-semibold  tracking-widest text-gray-400">Loading...</div>;

  return (
    <div className="bg-white rounded-xl  border border-gray-100 overflow-hidden transition-all hover:shadow-sm border-l-4 border-l-indigo-500">
      <div className="p-3 border-b border-gray-50 flex items-center justify-between bg-white">
        <h3 className="text-[10px] font-semibold text-gray-900 flex items-center gap-2  tracking-tight">
          <span className="text-base">📝</span>
          Notes
        </h3>
        <span className="text-[8px] font-semibold text-gray-400  tracking-widest bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">
          {notes.length} Total
        </span>
      </div>

      <div className="p-3 bg-blue-50/5">
        <AddNoteBox leadId={leadId} onNoteAdded={handleNoteAdded} />

        <div className={`space-y-2 mt-3 ${notes.length > 5 ? 'max-h-[400px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
          {notes.length === 0 ? (
            <div className="text-center py-5 bg-white/50 rounded-xl border border-dashed border-gray-200">
              <p className="text-[10px] font-semibold text-gray-400  tracking-widest">No notes yet</p>
            </div>
          ) : (
            notes.map(note => (
              <NoteItem
                key={note._id}
                note={note}
                onUpdate={handleNoteUpdated}
                onDelete={handleNoteDeleted}
                currentUser={currentUser}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
