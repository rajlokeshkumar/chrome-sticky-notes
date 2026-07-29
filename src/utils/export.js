import { getDatapoints, getTasks } from '../storage/storage.js'

export default async function exportData() {
  const [datapoints, tasks] = await Promise.all([getDatapoints(), getTasks()])
  const payload = { datapoints, tasks, exportedAt: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sticky-notes-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
