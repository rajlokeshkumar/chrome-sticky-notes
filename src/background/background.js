// Minimal service worker — message relay for content script ↔ popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REVERSE_CAPTURE') {
    chrome.runtime.sendMessage(message).catch(() => {
      // Popup not open — ignore
    })
    sendResponse({ ok: true })
  }
  return false
})
