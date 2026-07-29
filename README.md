# 📌 Chrome Sticky Notes Extension

A personal Chrome extension that replaces Excel and Windows Sticky Notes during web application testing. Keeps test data and daily tasks inside the browser — accessible in under 3 seconds via a keyboard shortcut.

---

## Features

**Test Data Panel**
- Store label:value datapoints (e.g. `account: 9980023`)
- One-click copy to clipboard
- Live search/filter across labels and values
- Inline edit (double-click any label or value)
- Pin rows to keep them permanently at the top
- Bulk paste — paste a block of `label: value` lines and import them all at once
- Value history — last 5 values per row, restorable with one click
- URL-aware surfacing — auto-filters to datapoints linked to the current site
- Reverse capture — detects when you paste into a page field and offers to save it
- Command-type rows with distinct styling
- JSON export for backup

**Daily Planner Panel**
- Checkbox task list with strike-through on completion
- Daily carryover — incomplete tasks automatically roll forward each day
- Age indicator — tasks show how many days they've been carried
- Full history preserved until manually erased

**General**
- Light / dark theme toggle (persisted)
- Keyboard shortcut to open popup from any tab
- `Alt+Shift+N` default shortcut (configurable)
- "Developed by LOKI" — built for personal use

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later (npm included)
- Google Chrome

---

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/rajlokeshkumar/chrome-sticky-notes.git
cd chrome-sticky-notes

# 2. Install dependencies
npm install

# 3. Build the extension
npm run build
```

The built extension will be output to the `dist/` folder.

---

## Loading into Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder inside the project directory
5. The Sticky Notes icon will appear in your Chrome toolbar

---

## Configuring the Keyboard Shortcut

1. Go to `chrome://extensions/shortcuts`
2. Find **Sticky Notes** → "Open Sticky Notes"
3. Click the pencil icon and press your preferred key combo (default: `Alt+Shift+N`)

> You can also click the ⌨ button inside the popup to jump directly to the shortcut settings page.

---

## Development

To watch for file changes and rebuild automatically:

```bash
npm run dev
```

After each rebuild, go to `chrome://extensions` and click the **refresh icon** on the Sticky Notes card to reload the extension.

---

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run build` | Build for production → `dist/` |
| `npm run dev` | Build and watch for changes |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Bundler | [Vite](https://vitejs.dev/) |
| Chrome plugin | [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin) |
| UI | [Preact](https://preactjs.com/) |
| Storage | `chrome.storage.local` |
| Target | Chrome Manifest V3 |

---

## Project Structure

```
chrome-sticky-notes/
├── manifest.json               # Chrome extension manifest (MV3)
├── vite.config.js              # Vite + crxjs build config
├── public/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── src/
│   ├── popup/
│   │   ├── popup.html          # Popup entry point
│   │   ├── popup.jsx           # App root — tabs, theme, watermark
│   │   └── popup.css           # All styles (light + dark theme)
│   ├── components/
│   │   ├── TestDataPanel.jsx   # Test Data tab
│   │   ├── DatapointRow.jsx    # Single datapoint row
│   │   ├── BulkPaste.jsx       # Bulk import UI
│   │   ├── DailyPlannerPanel.jsx # Daily Planner tab
│   │   └── ReverseCaptureBar.jsx # Paste-detection save prompt
│   ├── background/
│   │   └── background.js       # Service worker (message relay)
│   ├── content/
│   │   └── content.js          # Content script (reverse capture)
│   ├── storage/
│   │   └── storage.js          # chrome.storage.local wrapper
│   └── utils/
│       ├── nanoid.js            # Lightweight ID generator
│       └── export.js            # JSON export helper
└── scripts/
    └── gen-icons.mjs           # Generates placeholder PNG icons
```

---

## Data Storage

All data is stored locally in `chrome.storage.local` (~10 MB quota). Nothing leaves your machine — no network requests, no telemetry, no third-party services.

Export your data anytime via the **↓ Export** button in the Test Data panel. This downloads a `sticky-notes-export-YYYY-MM-DD.json` file to your Downloads folder.

---

*Developed by LOKI*
