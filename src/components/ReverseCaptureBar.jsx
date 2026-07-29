/** @jsxImportSource preact */
import { useState } from 'preact/hooks'

export default function ReverseCaptureBar({ value, onSave, onDismiss }) {
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')

  function save() {
    if (!label.trim()) { setError('Label required'); return }
    onSave(label, value)
  }

  return (
    <div class="rc-banner">
      <div class="rc-banner-title">Save pasted value?</div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
        {value.length > 60 ? value.slice(0, 60) + '…' : value}
      </div>
      <div class="rc-banner-row">
        <input
          placeholder="Label…"
          value={label}
          onInput={e => { setLabel(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && save()}
          autoFocus
        />
        <button class="btn btn-primary" onClick={save}>Save</button>
        <button class="btn btn-icon" onClick={onDismiss}>✕</button>
      </div>
      {error && <div class="field-error">{error}</div>}
    </div>
  )
}
