/** @jsxImportSource preact */
import { useState, useEffect, useRef } from 'preact/hooks'
import { getDatapoints, saveDatapoints, getSettings, saveSettings } from '../storage/storage.js'
import DatapointRow from './DatapointRow.jsx'
import BulkPaste from './BulkPaste.jsx'
import ReverseCaptureBar from './ReverseCaptureBar.jsx'
import { nanoid } from '../utils/nanoid.js'

export default function TestDataPanel({ rcValue, onRcDismiss }) {
  const [datapoints, setDatapoints] = useState([])
  const [search, setSearch] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newValue, setNewValue] = useState('')
  const [addError, setAddError] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [toast, setToast] = useState('')
  const [currentDomain, setCurrentDomain] = useState('')
  const [domainFilter, setDomainFilter] = useState(true)
  const searchRef = useRef(null)

  useEffect(() => {
    getDatapoints().then(setDatapoints)
    getSettings().then(s => {
      if (s.lastSearchQuery !== undefined) setSearch(s.lastSearchQuery)
    })
    // Get current tab domain for URL-aware surfacing
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      try {
        const url = new URL(tabs[0]?.url || '')
        setCurrentDomain(url.hostname)
      } catch {}
    })
    searchRef.current?.focus()
  }, [])

  useEffect(() => {
    saveSettings({ lastSearchQuery: search })
  }, [search])

  async function persist(updated) {
    setDatapoints(updated)
    await saveDatapoints(updated)
  }

  function filtered() {
    let list = [...datapoints]
    // Domain filter: if current domain has any associated datapoints, show only those
    if (domainFilter && currentDomain) {
      const domainMatches = list.filter(d => d.domain === currentDomain)
      if (domainMatches.length > 0) list = domainMatches
    }
    const q = search.trim().toLowerCase()
    if (!q) return list
    const pinned = list.filter(d => d.pinned)
    const unpinned = list.filter(d => !d.pinned && (
      d.label.toLowerCase().includes(q) || d.value.toLowerCase().includes(q)
    ))
    return [...pinned, ...unpinned]
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 1500)
  }

  async function addDatapoint() {
    const label = newLabel.trim()
    const value = newValue.trim()
    if (!label) { setAddError('Label is required'); return }
    if (!value) { setAddError('Value is required'); return }
    setAddError('')
    const dp = { id: nanoid(), label, value, pinned: false, type: 'data', domain: '', history: [], created: today(), updated: today() }
    const updated = [...datapoints, dp]
    await persist(updated)
    setNewLabel('')
    setNewValue('')
  }

  async function updateDatapoint(id, changes) {
    const updated = datapoints.map(d => d.id === id ? { ...d, ...changes, updated: today() } : d)
    await persist(updated)
  }

  async function deleteDatapoint(id) {
    const updated = datapoints.filter(d => d.id !== id)
    await persist(updated)
  }

  async function handleBulkImport(rows) {
    const newRows = rows.map(r => ({
      id: nanoid(),
      label: r.label,
      value: r.value,
      pinned: false,
      type: 'data',
      domain: '',
      history: [],
      created: today(),
      updated: today(),
    }))
    const updated = [...datapoints, ...newRows]
    await persist(updated)
    setShowBulk(false)
    showToast(`${newRows.length} datapoints imported`)
  }

  async function handleRcSave(label, value) {
    const dp = { id: nanoid(), label: label.trim(), value: value.trim(), pinned: false, type: 'data', domain: '', history: [], created: today(), updated: today() }
    await persist([...datapoints, dp])
    onRcDismiss()
    showToast('Saved')
  }

  const visibleList = filtered()
  const pinnedList = visibleList.filter(d => d.pinned)
  const unpinnedList = visibleList.filter(d => !d.pinned)

  return (
    <div class="panel">
      {rcValue && (
        <ReverseCaptureBar
          value={rcValue}
          onSave={handleRcSave}
          onDismiss={onRcDismiss}
        />
      )}

      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          ref={searchRef}
          class="search-input"
          placeholder="Search label or value…"
          value={search}
          onInput={e => setSearch(e.target.value)}
          onKeyDown={e => handleSearchKey(e, visibleList)}
        />
      </div>

      {currentDomain && datapoints.some(d => d.domain === currentDomain) && (
        <div class="section-header">
          <span>Showing: {currentDomain}</span>
          <button class="btn btn-icon" onClick={() => setDomainFilter(f => !f)}>
            {domainFilter ? '× All' : '⌂ Site'}
          </button>
        </div>
      )}

      <div class="dp-list">
        {pinnedList.length > 0 && (
          <>
            {pinnedList.map((dp, i) => (
              <DatapointRow
                key={dp.id}
                dp={dp}
                index={i}
                currentDomain={currentDomain}
                onUpdate={updateDatapoint}
                onDelete={deleteDatapoint}
                onCopied={showToast}
              />
            ))}
          </>
        )}
        {unpinnedList.map((dp, i) => (
          <DatapointRow
            key={dp.id}
            dp={dp}
            index={pinnedList.length + i}
            currentDomain={currentDomain}
            onUpdate={updateDatapoint}
            onDelete={deleteDatapoint}
            onCopied={showToast}
          />
        ))}
        {visibleList.length === 0 && (
          <div class="empty">
            {search ? 'No matches' : 'No datapoints yet.\nUse the form below to add one.'}
          </div>
        )}
      </div>

      {showBulk ? (
        <BulkPaste
          onImport={handleBulkImport}
          onCancel={() => setShowBulk(false)}
          existingLabels={datapoints.map(d => d.label)}
        />
      ) : (
        <>
          <div class="add-form">
            <input
              placeholder="Label"
              value={newLabel}
              onInput={e => { setNewLabel(e.target.value); setAddError('') }}
              onKeyDown={e => e.key === 'Enter' && addDatapoint()}
              style={{ maxWidth: '110px' }}
            />
            <input
              placeholder="Value"
              value={newValue}
              onInput={e => { setNewValue(e.target.value); setAddError('') }}
              onKeyDown={e => e.key === 'Enter' && addDatapoint()}
            />
            <button class="btn btn-primary" onClick={addDatapoint}>Add</button>
          </div>
          {addError && <div class="field-error">{addError}</div>}
          <div class="footer-row">
            <button class="btn btn-icon" title="Bulk paste" onClick={() => setShowBulk(true)}>⊞ Bulk</button>
            <button class="btn btn-icon" title="Export JSON" onClick={exportData}>↓ Export</button>
          </div>
        </>
      )}

      {toast && <div class="toast">{toast}</div>}
    </div>
  )

  function handleSearchKey(e, list) {
    if (['1', '2', '3'].includes(e.key)) {
      const idx = parseInt(e.key) - 1
      if (list[idx]) {
        copyToClipboard(list[idx].value)
        showToast(`Copied: ${list[idx].label}`)
        window.close()
      }
    }
  }

  async function exportData() {
    const { default: dl } = await import('../utils/export.js')
    dl()
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  })
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
