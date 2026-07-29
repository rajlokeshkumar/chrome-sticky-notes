/** @jsxImportSource preact */
import { render } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { getSettings, saveSettings } from '../storage/storage.js'
import TestDataPanel from '../components/TestDataPanel.jsx'
import DailyPlannerPanel from '../components/DailyPlannerPanel.jsx'

function App() {
  const [activePanel, setActivePanel] = useState('test-data')
  const [theme, setTheme] = useState('dark')
  const [rcValue, setRcValue] = useState(null)

  useEffect(() => {
    getSettings().then(s => {
      if (s.activePanel) setActivePanel(s.activePanel)
      const t = s.theme || 'dark'
      setTheme(t)
      document.documentElement.setAttribute('data-theme', t)
    })

    const handler = (msg) => {
      if (msg.type === 'REVERSE_CAPTURE') {
        setRcValue(msg.value)
        setActivePanel('test-data')
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  function switchPanel(panel) {
    setActivePanel(panel)
    saveSettings({ activePanel: panel })
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    saveSettings({ theme: next })
  }

  function openShortcutSettings() {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
    window.close()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div class="app-header">
        <span class="app-header-title">📌 Sticky Notes</span>
        <div class="header-actions">
          <button class="btn btn-icon" title="Configure keyboard shortcut" onClick={openShortcutSettings}>
            ⌨
          </button>
          <button class="btn btn-icon" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme}>
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
        </div>
      </div>

      <div class="tabs">
        <button
          class={`tab-btn ${activePanel === 'test-data' ? 'active' : ''}`}
          onClick={() => switchPanel('test-data')}
        >
          Test Data
        </button>
        <button
          class={`tab-btn ${activePanel === 'planner' ? 'active' : ''}`}
          onClick={() => switchPanel('planner')}
        >
          Daily Planner
        </button>
      </div>

      {activePanel === 'test-data' && (
        <TestDataPanel rcValue={rcValue} onRcDismiss={() => setRcValue(null)} />
      )}
      {activePanel === 'planner' && <DailyPlannerPanel />}

      <div class="watermark">Developed by LOKI</div>
    </div>
  )
}

render(<App />, document.getElementById('app'))
