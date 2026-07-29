/** @jsxImportSource preact */
import { useState, useEffect, useRef } from 'preact/hooks'
import { getDatapoints, saveDatapoints, getProjects, saveProjects, getSettings, saveSettings } from '../storage/storage.js'
import DatapointRow from './DatapointRow.jsx'
import BulkPaste from './BulkPaste.jsx'
import ReverseCaptureBar from './ReverseCaptureBar.jsx'
import { nanoid } from '../utils/nanoid.js'

const PALETTE = ['#89b4fa','#a6e3a1','#fab387','#f38ba8','#cba6f7','#94e2d5','#f9e2af','#89dceb']

export default function TestDataPanel({ rcValue, onRcDismiss }) {
  const [datapoints, setDatapoints] = useState([])
  const [projects, setProjects] = useState([])
  const [activeProject, setActiveProject] = useState('all') // 'all' | project id
  const [search, setSearch] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newValue, setNewValue] = useState('')
  const [addError, setAddError] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [toast, setToast] = useState('')
  const [currentDomain, setCurrentDomain] = useState('')
  const [domainFilter, setDomainFilter] = useState(true)
  const [addingProject, setAddingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const searchRef = useRef(null)
  const projectInputRef = useRef(null)

  useEffect(() => {
    Promise.all([getDatapoints(), getProjects(), getSettings()]).then(([dps, projs, s]) => {
      setDatapoints(dps)
      setProjects(projs)
      if (s.lastSearchQuery !== undefined) setSearch(s.lastSearchQuery)
      if (s.activeProject) setActiveProject(s.activeProject)
    })
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

  useEffect(() => {
    if (addingProject) setTimeout(() => projectInputRef.current?.focus(), 50)
  }, [addingProject])

  async function persistDps(updated) {
    setDatapoints(updated)
    await saveDatapoints(updated)
  }

  async function persistProjects(updated) {
    setProjects(updated)
    await saveProjects(updated)
  }

  function switchProject(id) {
    setActiveProject(id)
    saveSettings({ activeProject: id })
  }

  async function addProject() {
    const name = newProjectName.trim()
    if (!name) { setAddingProject(false); return }
    const color = PALETTE[projects.length % PALETTE.length]
    const proj = { id: nanoid(), name, color }
    const updated = [...projects, proj]
    await persistProjects(updated)
    setNewProjectName('')
    setAddingProject(false)
    switchProject(proj.id)
  }

  async function deleteProject(id) {
    const updated = projects.filter(p => p.id !== id)
    await persistProjects(updated)
    // Unassign datapoints that belonged to this project
    const updatedDps = datapoints.map(d => d.projectId === id ? { ...d, projectId: null } : d)
    await persistDps(updatedDps)
    if (activeProject === id) switchProject('all')
  }

  function filtered() {
    let list = [...datapoints]

    // Project filter
    if (activeProject !== 'all') {
      list = list.filter(d => d.projectId === activeProject)
    }

    // Domain filter
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
    const dp = {
      id: nanoid(), label, value, pinned: false, type: 'data', domain: '',
      projectId: activeProject !== 'all' ? activeProject : null,
      history: [], created: today(), updated: today()
    }
    await persistDps([...datapoints, dp])
    setNewLabel('')
    setNewValue('')
  }

  async function updateDatapoint(id, changes) {
    const updated = datapoints.map(d => d.id === id ? { ...d, ...changes, updated: today() } : d)
    await persistDps(updated)
  }

  async function deleteDatapoint(id) {
    await persistDps(datapoints.filter(d => d.id !== id))
  }

  async function handleBulkImport(rows) {
    const newRows = rows.map(r => ({
      id: nanoid(), label: r.label, value: r.value, pinned: false, type: 'data', domain: '',
      projectId: activeProject !== 'all' ? activeProject : null,
      history: [], created: today(), updated: today(),
    }))
    await persistDps([...datapoints, ...newRows])
    setShowBulk(false)
    showToast(`${newRows.length} datapoints imported`)
  }

  async function handleRcSave(label, value) {
    const dp = {
      id: nanoid(), label: label.trim(), value: value.trim(), pinned: false, type: 'data',
      domain: '', projectId: activeProject !== 'all' ? activeProject : null,
      history: [], created: today(), updated: today()
    }
    await persistDps([...datapoints, dp])
    onRcDismiss()
    showToast('Saved')
  }

  const visibleList = filtered()
  const pinnedList = visibleList.filter(d => d.pinned)
  const unpinnedList = visibleList.filter(d => !d.pinned)
  const activeProj = projects.find(p => p.id === activeProject)

  return (
    <div class="panel">
      {rcValue && (
        <ReverseCaptureBar value={rcValue} onSave={handleRcSave} onDismiss={onRcDismiss} />
      )}

      {/* Project selector */}
      <div class="project-bar">
        <button
          class={`project-pill ${activeProject === 'all' ? 'active' : ''}`}
          style={activeProject === 'all' ? { background: 'var(--accent)' } : {}}
          onClick={() => switchProject('all')}
        >
          All
        </button>
        {projects.map(p => (
          <button
            key={p.id}
            class={`project-pill ${activeProject === p.id ? 'active' : ''}`}
            style={activeProject === p.id ? { background: p.color } : { borderColor: p.color + '88', color: p.color }}
            onClick={() => switchProject(p.id)}
          >
            {p.name}
            <span
              class="project-pill-x"
              onClick={e => { e.stopPropagation(); deleteProject(p.id) }}
              title="Delete project"
            >×</span>
          </button>
        ))}
        {addingProject ? (
          <input
            ref={projectInputRef}
            class="project-add-input"
            placeholder="Project name…"
            value={newProjectName}
            onInput={e => setNewProjectName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addProject(); if (e.key === 'Escape') { setAddingProject(false); setNewProjectName('') } }}
            onBlur={addProject}
          />
        ) : (
          <button class="project-pill" onClick={() => setAddingProject(true)} title="Add project">+ Project</button>
        )}
      </div>

      {/* Search */}
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          ref={searchRef}
          class="search-input"
          placeholder={activeProj ? `Search in ${activeProj.name}…` : 'Search label or value…'}
          value={search}
          onInput={e => setSearch(e.target.value)}
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

      {/* Datapoint list */}
      <div class="dp-list">
        {pinnedList.map((dp, i) => (
          <DatapointRow
            key={dp.id} dp={dp} index={i}
            currentDomain={currentDomain} projects={projects}
            onUpdate={updateDatapoint} onDelete={deleteDatapoint} onCopied={showToast}
          />
        ))}
        {unpinnedList.map((dp, i) => (
          <DatapointRow
            key={dp.id} dp={dp} index={pinnedList.length + i}
            currentDomain={currentDomain} projects={projects}
            onUpdate={updateDatapoint} onDelete={deleteDatapoint} onCopied={showToast}
          />
        ))}
        {visibleList.length === 0 && (
          <div class="empty">
            {search
              ? 'No matches'
              : activeProject !== 'all'
                ? `No datapoints in ${activeProj?.name ?? 'this project'} yet.`
                : 'No datapoints yet.\nUse the form below to add one.'
            }
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
            <button class="btn btn-icon" onClick={() => setShowBulk(true)}>⊞ Bulk</button>
            <button class="btn btn-icon" onClick={async () => { const { default: dl } = await import('../utils/export.js'); dl() }}>↓ Export</button>
          </div>
        </>
      )}

      {toast && <div class="toast">{toast}</div>}
    </div>
  )
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
