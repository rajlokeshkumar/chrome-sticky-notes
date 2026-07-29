/** @jsxImportSource preact */
import { useState } from 'preact/hooks'

const HISTORY_CAP = 5

export default function DatapointRow({ dp, index, currentDomain, onUpdate, onDelete, onCopied }) {
  const [editingLabel, setEditingLabel] = useState(false)
  const [editingValue, setEditingValue] = useState(false)
  const [labelDraft, setLabelDraft] = useState(dp.label)
  const [valueDraft, setValueDraft] = useState(dp.value)
  const [showHistory, setShowHistory] = useState(false)
  const [copied, setCopied] = useState(false)

  // No auto-splitting on slash — user copies the full value always

  function copy(text) {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = text; document.body.appendChild(ta); ta.select()
      document.execCommand('copy'); ta.remove()
    })
    setCopied(true)
    onCopied(`Copied`)
    setTimeout(() => { setCopied(false); window.close() }, 200)
  }

  function commitLabel() {
    const v = labelDraft.trim()
    if (v && v !== dp.label) onUpdate(dp.id, { label: v })
    setEditingLabel(false)
  }

  function commitValue() {
    const v = valueDraft.trim()
    if (v && v !== dp.value) {
      const history = [dp.value, ...(dp.history || [])].slice(0, HISTORY_CAP)
      onUpdate(dp.id, { value: v, history })
    }
    setEditingValue(false)
  }

  function restoreHistory(oldVal) {
    const history = [dp.value, ...(dp.history.filter(h => h !== oldVal))].slice(0, HISTORY_CAP)
    onUpdate(dp.id, { value: oldVal, history })
    setShowHistory(false)
  }

  return (
    <div class={`dp-row ${dp.pinned ? 'pinned' : ''}`}>
      <div class="dp-row-top">
        {/* Row number */}
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '16px', textAlign: 'right', flexShrink: 0 }}>{index + 1}</span>

        {/* Label */}
        {editingLabel ? (
          <input
            class="edit-input dp-label"
            value={labelDraft}
            onInput={e => setLabelDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitLabel(); if (e.key === 'Escape') setEditingLabel(false) }}
            onBlur={commitLabel}
            autoFocus
          />
        ) : (
          <span class="dp-label" title={dp.label} onDblClick={() => { setLabelDraft(dp.label); setEditingLabel(true) }}>
            {dp.label}
          </span>
        )}

        {/* Value */}
        {editingValue ? (
          <input
            class="edit-input dp-value"
            value={valueDraft}
            onInput={e => setValueDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitValue(); if (e.key === 'Escape') setEditingValue(false) }}
            onBlur={commitValue}
            autoFocus
          />
        ) : (
          <span class="dp-value" title={dp.value} onDblClick={() => { setValueDraft(dp.value); setEditingValue(true) }}>
            {dp.value}
          </span>
        )}

        {/* Actions */}
        <div class="dp-actions">
          {dp.type === 'command' ? (
            <button class="btn btn-cmd" title="Copy command" onClick={() => copy(dp.value)}>{'> _'}</button>
          ) : (
            <button class={`btn btn-copy ${copied ? 'copied' : ''}`} onClick={() => copy(dp.value)}>
              {copied ? '✓' : 'Copy'}
            </button>
          )}
          <button class="btn btn-icon" title="Pin" onClick={() => onUpdate(dp.id, { pinned: !dp.pinned })}>
            {dp.pinned ? '📌' : '○'}
          </button>
          <button class="btn btn-icon" title="More" onClick={() => setShowHistory(h => !h)}>⋯</button>
        </div>
      </div>

      {/* History / options drawer */}
      {showHistory && (
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {dp.history?.length > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              History:
              {dp.history.map((h, i) => (
                <button key={i} class="btn" style={{ margin: '2px', fontSize: '11px' }} onClick={() => restoreHistory(h)}>{h}</button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button class="btn btn-icon" onClick={() => { onUpdate(dp.id, { type: dp.type === 'command' ? 'data' : 'command' }); setShowHistory(false) }}>
              {dp.type === 'command' ? 'Data' : '> Cmd'}
            </button>
            {currentDomain && (
              <button class="btn btn-icon" onClick={() => { onUpdate(dp.id, { domain: dp.domain === currentDomain ? '' : currentDomain }); setShowHistory(false) }}>
                {dp.domain === currentDomain ? '× Unlink site' : '⌂ Link to site'}
              </button>
            )}
            <button class="btn btn-danger" onClick={() => onDelete(dp.id)}>Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}
