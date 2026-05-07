# Skill Convert GUI

> Windows / macOS / Linux desktop app for converting AI agent skills between **Claude Code**, **Codex**, **GitHub Copilot**, and **Universal** formats.

Built on Electron + React + Tailwind. Core conversion logic powered by [`skill-convert`](https://github.com/gatheringtech001/skill-convert).

## Screenshots

_(coming soon)_

## Installation

### Windows
1. Download `skill-convert-setup-1.0.0.exe` from [Releases](../../releases)
2. Double-click the installer, follow the wizard
3. Launch from Start Menu or Desktop shortcut

> ⚠️ Windows Defender may show "Windows protected your PC" (app is unsigned). Click **More info** → **Run anyway**.

### macOS
1. Download `skill-convert-1.0.0.dmg`
2. Open the DMG and drag **Skill Convert** to Applications
3. First launch: right-click → Open (Gatekeeper bypass for unsigned apps)

### Linux
```bash
chmod +x skill-convert-1.0.0.AppImage
./skill-convert-1.0.0.AppImage
```

## Usage

1. **Drag & drop** your skill folder into the window (or click to browse)
2. Source platform is **auto-detected** — override if needed
3. Pick **target platform** from the dropdown:
   - `Claude Code` / `Codex` / `GitHub Copilot` / `Universal` / `三家全出 (All)`
4. Confirm **output path** (pre-filled with platform default)
5. Use the action buttons:
   - **预览 Diff** — dry-run, shows what would change (no files written)
   - **开始转换** — writes converted skill to output path
   - **检查兼容度** — lint score (0–100) + issue list

## Development

```bash
# Install deps
npm install

# Run in dev mode (Vite + Electron)
npm run dev

# Build production bundles
npm run dist:win    # Windows .exe
npm run dist:mac    # macOS .dmg
npm run dist:linux  # Linux .AppImage
```

## Architecture

```
skill-convert-gui/
├── electron/
│   ├── main.js       # Electron main process + IPC handlers
│   └── preload.js    # Context bridge (secure renderer ↔ main)
├── src/
│   ├── App.jsx       # Root component
│   ├── components/   # DropZone, PlatformSelector, ActionButtons, ...
│   └── index.css     # Tailwind base
├── .github/workflows/
│   └── build.yml     # CI: build .exe + .dmg + .AppImage on tag push
└── package.json      # electron-builder config inside
```

The app **shells out** to `skill-convert.js` via `child_process.execFile` with Electron's bundled Node binary. The JS file is bundled as an `extraResource` in the production build — no separate Node installation needed.

## License

MIT
