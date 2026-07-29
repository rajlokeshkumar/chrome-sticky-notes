const QUOTA_WARNING_BYTES = 9 * 1024 * 1024 // warn at 9MB of 10MB

export async function getAll() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(null, (data) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
      else resolve(data)
    })
  })
}

export async function get(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (data) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
      else resolve(data)
    })
  })
}

export async function set(items) {
  await checkQuota()
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
      else resolve()
    })
  })
}

export async function remove(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(keys, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
      else resolve()
    })
  })
}

async function checkQuota() {
  return new Promise((resolve) => {
    chrome.storage.local.getBytesInUse(null, (bytes) => {
      if (bytes > QUOTA_WARNING_BYTES) {
        console.warn(`[StickyNotes] Storage at ${Math.round(bytes / 1024)}KB — approaching limit`)
      }
      resolve()
    })
  })
}

// --- Datapoints ---

export async function getDatapoints() {
  const { datapoints = [] } = await get('datapoints')
  return datapoints
}

export async function saveDatapoints(datapoints) {
  await set({ datapoints })
}

// --- Notes ---

export async function getNotes() {
  const { notes = [] } = await get('notes')
  return notes
}

export async function saveNotes(notes) {
  await set({ notes })
}

// --- Projects ---

export async function getProjects() {
  const { projects = [] } = await get('projects')
  return projects
}

export async function saveProjects(projects) {
  await set({ projects })
}

// --- Tasks ---

export async function getTasks() {
  const { tasks = {} } = await get('tasks')
  return tasks
}

export async function saveTasks(tasks) {
  await set({ tasks })
}

// --- Settings ---

export async function getSettings() {
  const { settings = { lastSearchQuery: '', activePanel: 'test-data', theme: 'dark' } } = await get('settings')
  return settings
}

export async function saveSettings(patch) {
  const current = await getSettings()
  await set({ settings: { ...current, ...patch } })
}
