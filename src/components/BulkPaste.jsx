/** @jsxImportSource preact */
import { useState } from 'preact/hooks'

function parseBulk(text) {
  return text.split('\n').map(line => {
    const line_ = line.trim()
    if (!line_) return null
    const idx = line_.indexOf(': ')
    if (idx === -1) return { raw: line_, valid: false }
    return { label: line_.slice(0, idx).trim(), value: line_.slice(idx + 2).trim(), valid: true }
  }).filter(Boolean)
}

export default function BulkPaste({ onImport, onCancel, existingLabels }) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)

  function handleParse() {
    const rows = parseBulk(text)
    setPreview(rows)
  }

  function handleConfirm() {
    const valid = preview.filter(r => r.valid)
    const dupes = valid.filter(r => existingLabels.includes(r.label))
    if (dupes.length > 0) {
      if (!confirm(`${dupes.length} label(s) already exist (${dupes.map(d => d.label).join(', ')}). Overwrite?`)) return
    }
    onImport(valid)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div class="section-header">
        <span>Bulk Paste</span>
        <button class="btn btn-icon" onClick={onCancel}>✕</button>
      </div>
      <textarea
        class="bulk-area"
        placeholder={"label: value\nanother: 12345/67890\n…"}
        value={text}
        onInput={e => { setText(e.target.value); setPreview(null) }}
      />
      {preview ? (
        <>
          <div class="bulk-preview">
            {preview.map((r, i) => (
              <div key={i} class={`bulk-preview-row ${r.valid ? '' : 'invalid'}`}>
                {r.valid
                  ? <><span class="bulk-preview-label">{r.label}</span><span>{r.value}</span></>
                  : <span>⚠ {r.raw}</span>
                }
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button class="btn" onClick={() => setPreview(null)}>Back</button>
            <button class="btn btn-primary" onClick={handleConfirm}>
              Import {preview.filter(r => r.valid).length} rows
            </button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button class="btn" onClick={onCancel}>Cancel</button>
          <button class="btn btn-primary" onClick={handleParse} disabled={!text.trim()}>Preview</button>
        </div>
      )}
    </div>
  )
}
