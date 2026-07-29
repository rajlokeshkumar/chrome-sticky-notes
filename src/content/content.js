// Reverse Capture: detect paste into text inputs and offer to save the value

let lastPastedValue = null
let promptEl = null

document.addEventListener('paste', (e) => {
  const target = e.target
  if (!isTextInput(target)) return

  // Read clipboard text from the event (before it lands in the field)
  const text = (e.clipboardData || window.clipboardData)?.getData('text')
  if (!text || text === lastPastedValue) return
  lastPastedValue = text

  // Slight delay so the paste lands in the field before we prompt
  setTimeout(() => showPrompt(text, target), 150)
}, true)

function isTextInput(el) {
  return (
    el.tagName === 'INPUT' && !['checkbox', 'radio', 'file', 'button', 'submit'].includes(el.type) ||
    el.tagName === 'TEXTAREA' ||
    el.contentEditable === 'true'
  )
}

function showPrompt(value, anchorEl) {
  removePrompt()

  const shadow = document.createElement('div')
  shadow.id = '__sticky-notes-capture__'
  Object.assign(shadow.style, {
    position: 'fixed',
    zIndex: '2147483647',
    bottom: '16px',
    right: '16px',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '13px',
  })

  const root = shadow.attachShadow({ mode: 'closed' })
  root.innerHTML = `
    <style>
      .prompt {
        background: #1e1e2e;
        color: #cdd6f4;
        border: 1px solid #45475a;
        border-radius: 8px;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 16px rgba(0,0,0,.4);
        max-width: 320px;
      }
      .label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .val { color: #89b4fa; font-weight: 600; }
      button {
        border: none; border-radius: 5px; padding: 4px 10px;
        cursor: pointer; font-size: 12px; font-weight: 600;
      }
      .save { background: #89b4fa; color: #1e1e2e; }
      .dismiss { background: transparent; color: #6c7086; }
    </style>
    <div class="prompt">
      <span class="label">Save <span class="val">${escapeHtml(truncate(value, 30))}</span>?</span>
      <button class="save">Save</button>
      <button class="dismiss">✕</button>
    </div>
  `

  root.querySelector('.save').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'REVERSE_CAPTURE', value })
    removePrompt()
  })
  root.querySelector('.dismiss').addEventListener('click', removePrompt)

  document.body.appendChild(shadow)
  promptEl = shadow

  // Auto-dismiss after 6 seconds
  setTimeout(removePrompt, 6000)
}

function removePrompt() {
  promptEl?.remove()
  promptEl = null
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '…' : str
}
