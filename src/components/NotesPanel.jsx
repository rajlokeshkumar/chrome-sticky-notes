/** @jsxImportSource preact */
import { useState, useEffect, useRef } from 'preact/hooks'
import { getNotes, saveNotes } from '../storage/storage.js'
import { nanoid } from '../utils/nanoid.js'

const NOTE_COLORS = [
  '#fef08a', // yellow
  '#bbf7d0', // green
  '#fecdd3', // pink
  '#bfdbfe', // blue
  '#e9d5ff', // purple
  '#fed7aa', // orange
  '#a5f3fc', // cyan
  '#d9f99d', // lime
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function NotesPanel() {
  const [notes, setNotes] = useState([])
  const [activeId, setActiveId] = useState(null)     // null = grid view
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(NOTE_COLORS[0])
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saved, setSaved] = useState(false)
  const nameInputRef = useRef(null)
  const saveTimer = useRef(null)
  const notesRef = useRef(notes)

  useEffect(() => {
    getNotes().then(setNotes)
  }, [])

  useEffect(() => { notesRef.current = notes }, [notes])

  useEffect(() => {
    if (showNewForm) setTimeout(() => nameInputRef.current?.focus(), 50)
  }, [showNewForm])

  const activeNote = notes.find(n => n.id === activeId) ?? null

  async function persist(updated) {
    setNotes(updated)
    await saveNotes(updated)
  }

  async function createNote() {
    const name = newName.trim() || 'Untitled'
    const note = { id: nanoid(), name, color: newColor, content: '', created: today(), updated: today() }
    const updated = [...notes, note]
    await persist(updated)
    setShowNewForm(false)
    setNewName('')
    setNewColor(NOTE_COLORS[updated.length % NOTE_COLORS.length])
    setActiveId(note.id)
  }

  function autoSave(id, field, value) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, [field]: value, updated: today() } : n))
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const updated = notesRef.current.map(n => n.id === id ? { ...n, [field]: value, updated: today() } : n)
      await saveNotes(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 1200)
    }, 500)
  }

  async function deleteNote(id) {
    const updated = notes.filter(n => n.id !== id)
    await persist(updated)
    if (activeId === id) setActiveId(null)
    setConfirmDelete(null)
  }

  // ── Grid view ──
  if (!activeNote) {
    return (
      <div class="panel">
        {showNewForm && (
          <div class="new-note-form">
            <input
              ref={nameInputRef}
              placeholder="Note name…"
              value={newName}
              onInput={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createNote(); if (e.key === 'Escape') setShowNewForm(false) }}
            />
            <ColorPicker value={newColor} onChange={setNewColor} />
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button class="btn" onClick={() => setShowNewForm(false)}>Cancel</button>
              <button class="btn btn-primary" onClick={createNote}>Create</button>
            </div>
          </div>
        )}

        <div class="notes-grid">
          {notes.map(n => (
            <div
              key={n.id}
              class="note-card"
              style={{ background: n.color }}
              onClick={() => confirmDelete !== n.id && setActiveId(n.id)}
            >
              <div class="note-card-name">{n.name}</div>
              <div class="note-card-preview">{n.content || <em style={{ opacity: .5 }}>Empty</em>}</div>

              {confirmDelete === n.id ? (
                <div
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={e => e.stopPropagation()}
                >
                  <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>Delete?</span>
                  <button
                    class="btn btn-danger"
                    style={{ padding: '3px 10px', fontSize: '12px' }}
                    onClick={() => deleteNote(n.id)}
                  >Yes</button>
                  <button
                    class="btn"
                    style={{ padding: '3px 10px', fontSize: '12px' }}
                    onClick={() => setConfirmDelete(null)}
                  >No</button>
                </div>
              ) : (
                <button
                  class="note-card-del"
                  onClick={e => { e.stopPropagation(); setConfirmDelete(n.id) }}
                  title="Delete note"
                >✕</button>
              )}
            </div>
          ))}

          {!showNewForm && (
            <button class="note-add-btn" onClick={() => setShowNewForm(true)}>
              + New Note
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Editor view ──
  return (
    <div class="panel">
      <div class="note-editor">
        <div class="note-editor-header">
          <button class="btn btn-icon" onClick={() => setActiveId(null)} title="Back">← Back</button>
          <input
            class="note-editor-name"
            value={activeNote.name}
            onInput={e => autoSave(activeNote.id, 'name', e.target.value)}
            placeholder="Note name"
          />
          {saved && <span style={{ fontSize: '10px', color: 'var(--accent2)', flexShrink: 0 }}>Saved ✓</span>}
        </div>

        <ColorPicker
          value={activeNote.color}
          onChange={color => autoSave(activeNote.id, 'color', color)}
        />

        <textarea
          class="note-textarea"
          placeholder="Start typing…"
          value={activeNote.content}
          onInput={e => autoSave(activeNote.id, 'content', e.target.value)}
          autoFocus
        />
      </div>
    </div>
  )
}

function ColorPicker({ value, onChange }) {
  return (
    <div class="color-picker">
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Color:</span>
      {NOTE_COLORS.map(c => (
        <div
          key={c}
          class={`color-dot ${value === c ? 'selected' : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          title={c}
        />
      ))}
    </div>
  )
}
