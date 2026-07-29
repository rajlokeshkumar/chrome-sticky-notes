/** @jsxImportSource preact */
import { useState, useEffect } from 'preact/hooks'
import { getTasks, saveTasks } from '../storage/storage.js'
import { nanoid } from '../utils/nanoid.js'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a, b) {
  return Math.floor((new Date(b) - new Date(a)) / 86400000)
}

export default function DailyPlannerPanel() {
  const [tasks, setTasks] = useState({}) // { "YYYY-MM-DD": [task, …] }
  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')

  const today = todayKey()

  useEffect(() => {
    getTasks().then(stored => {
      const carried = carryOver(stored, today)
      setTasks(carried)
      saveTasks(carried)
    })
  }, [])

  function carryOver(stored, today) {
    const result = { ...stored }
    if (!result[today]) result[today] = []

    const alreadyThere = new Set(result[today].map(t => t.id))

    // Collect incomplete tasks from all prior days
    Object.entries(result).forEach(([date, dayTasks]) => {
      if (date >= today) return
      dayTasks.forEach(task => {
        if (!task.completed && !alreadyThere.has(task.id)) {
          const age = daysBetween(task.originalDate || date, today)
          result[today].push({ ...task, age })
          alreadyThere.add(task.id)
        }
      })
    })

    return result
  }

  async function persist(updated) {
    setTasks(updated)
    await saveTasks(updated)
  }

  async function addTask() {
    const text = newText.trim()
    if (!text) return
    const task = { id: nanoid(), text, completed: false, completedDate: null, originalDate: today, age: 0 }
    const updated = { ...tasks, [today]: [...(tasks[today] || []), task] }
    await persist(updated)
    setNewText('')
  }

  async function toggleTask(id) {
    const updated = { ...tasks }
    updated[today] = updated[today].map(t => {
      if (t.id !== id) return t
      const completed = !t.completed
      return { ...t, completed, completedDate: completed ? today : null, age: completed ? 0 : t.age }
    })
    await persist(updated)
  }

  async function deleteTask(id) {
    const updated = { ...tasks, [today]: tasks[today].filter(t => t.id !== id) }
    await persist(updated)
  }

  async function commitEdit(id) {
    const text = editDraft.trim()
    if (text) {
      const updated = { ...tasks, [today]: tasks[today].map(t => t.id === id ? { ...t, text } : t) }
      await persist(updated)
    }
    setEditingId(null)
  }

  const todayTasks = tasks[today] || []
  const carried = todayTasks.filter(t => t.age > 0 && !t.completed)
  const fresh = todayTasks.filter(t => t.age === 0 && !t.completed)
  const done = todayTasks.filter(t => t.completed)

  function ageClass(task) {
    if (task.age >= 2) return 'age-2plus'
    if (task.age === 1) return 'age-1'
    return ''
  }

  function renderTask(task) {
    return (
      <div key={task.id} class={`task-row ${ageClass(task)}`}>
        <input
          type="checkbox"
          class="task-cb"
          checked={task.completed}
          onChange={() => toggleTask(task.id)}
        />
        {editingId === task.id ? (
          <input
            class="edit-input task-text"
            value={editDraft}
            onInput={e => setEditDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitEdit(task.id); if (e.key === 'Escape') setEditingId(null) }}
            onBlur={() => commitEdit(task.id)}
            autoFocus
          />
        ) : (
          <span
            class={`task-text ${task.completed ? 'done' : ''}`}
            onDblClick={() => { setEditDraft(task.text); setEditingId(task.id) }}
          >
            {task.text}
          </span>
        )}
        {task.age > 0 && !task.completed && (
          <span class="age-badge">+{task.age}d</span>
        )}
        <button class="btn btn-icon" style={{ fontSize: '11px', color: 'var(--danger)' }} onClick={() => deleteTask(task.id)}>✕</button>
      </div>
    )
  }

  const displayDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div class="panel">
      <div class="date-badge">{displayDate}</div>
      {carried.length > 0 && (
        <div class="section-header"><span>Carried over</span></div>
      )}
      <div class="task-list">
        {carried.map(renderTask)}
        {fresh.map(renderTask)}
        {done.map(renderTask)}
        {todayTasks.length === 0 && (
          <div class="empty">No tasks today.\nAdd one below.</div>
        )}
      </div>

      <div class="task-add-row">
        <input
          placeholder="Add a task…"
          value={newText}
          onInput={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          autoFocus
        />
        <button class="btn btn-primary" onClick={addTask}>Add</button>
      </div>
    </div>
  )
}
