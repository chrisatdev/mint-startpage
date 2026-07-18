# Mint Startpage

Mint Startpage replaces the default Chromium new tab with a clean dashboard for organizing links in groups. It is local-first, lightweight, and designed for fast navigation.

## Quick path

1. Load the extension as unpacked in a Chromium-based browser.
2. Open a new tab to manage groups and links.
3. Click the extension icon to save the current page into a group.

## What it does

| Area | Features |
| --- | --- |
| Group organization | Create, rename, delete, and reorder groups |
| Link management | Add, edit, delete, and drag links between groups |
| Sidebar navigation | Switch groups from a left sidebar with icon tabs |
| Search | Live filtering by title or URL, plus Google search on `Enter` |
| Quick save | Save the current tab from the extension popup with prefilled title and URL |
| Favicons | Favicon mode, initial-letter mode, or no icon |
| Personalization | Solid colors, gradients, images, dark mode, and mint-themed UI |
| Data safety | Export, import, and reset local data |

## Current highlights

- **Minimal sidebar layout** for faster scanning when you have many groups.
- **Responsive link grid** to use horizontal space better.
- **Scroll between groups** when you reach the top or bottom of the content area.
- **Mint light theme** and **mint-blue dark theme**.
- **Reliable favicon fallback chain**:
  - Google favicon service
  - DuckDuckGo icons
  - Direct `/favicon.ico`
  - Local SVG fallback

## Keyboard shortcuts

Press `?` inside the new tab page to open the shortcuts overlay.

| Shortcut | Action |
| --- | --- |
| `/` | Focus search |
| `Enter` | Search current text on Google |
| `Esc` | Clear search or close shortcuts panel |
| `←` | Previous group |
| `→` | Next group |
| `?` | Show or hide shortcuts panel |

## Extension popup: Save current tab

Click the extension icon in the browser toolbar to open a quick-save form.

The popup:

- reads the current tab title
- reads the current tab URL
- lets you edit both before saving
- lets you choose the destination group

This makes saving pages much faster than opening a new tab and entering the data manually.

## Settings

You can configure:

- background color
- custom gradients
- local background image
- dark mode
- link icon mode:
  - favicon
  - initial letter
  - no icon

## Privacy

- No tracking
- No analytics
- No external backend
- Data stored locally with `chrome.storage.local`

## Load the extension

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder.

## Project structure

| File | Purpose |
| --- | --- |
| `newtab.html` / `newtab.css` / `newtab.js` | Main startpage UI |
| `settings.html` / `settings.css` / `settings.js` | Appearance and data settings |
| `popup.html` / `popup.css` / `popup.js` | Save-current-tab popup |
| `utils/storage.js` | Local storage helpers |
| `manifest.json` | Chromium extension manifest |

## Status

Mint Startpage is currently focused on:

- fast link access
- simple visual organization
- local-first customization
- low-friction saving of new links

Made by Chris @ Dev
