const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Import skill-convert core
const skillConvertPath = path.join(__dirname, 'skill-convert.js');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 720,
    minHeight: 560,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Skill Convert',
    backgroundColor: '#0f172a',
    show: false,
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  win.once('ready-to-show', () => {
    win.show();
  });

  // Remove menu bar
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

// ============================================================
// IPC Handlers
// ============================================================

// Pick skill directory
ipcMain.handle('pick-dir', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Skill Directory',
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

// Pick output directory
ipcMain.handle('pick-out-dir', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Output Directory',
    properties: ['openDirectory', 'createDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

// Open folder in explorer
ipcMain.handle('open-folder', async (e, folderPath) => {
  shell.openPath(folderPath);
});

// Run skill-convert
ipcMain.handle('convert', async (e, opts) => {
  const { inputDir, fromPlatform, toPlatform, outDir, dryRun, bidirectional, lint } = opts;

  // Build argv
  const argv = ['node', 'skill-convert.js', inputDir];

  if (lint) {
    argv.push('--lint');
  } else {
    if (fromPlatform === 'auto') {
      argv.push('--auto-detect');
    } else {
      argv.push('--from', fromPlatform);
    }
    if (bidirectional) {
      argv.push('--bidirectional');
    } else {
      argv.push('--to', toPlatform);
    }
    if (outDir) argv.push('--out', outDir);
    if (dryRun) argv.push('--dry-run');
  }

  // Capture stdout by monkey-patching process.argv and console
  const originalArgv = process.argv;
  const originalExit = process.exit;
  let output = '';
  let exitCode = 0;

  const origLog = console.log;
  const origError = console.error;

  try {
    process.argv = argv;
    process.exit = (code) => { exitCode = code || 0; throw new Error('__EXIT__'); };
    console.log = (...args) => { output += args.join(' ') + '\n'; };
    console.error = (...args) => { output += '[ERROR] ' + args.join(' ') + '\n'; };

    // Re-require (clear cache first)
    delete require.cache[skillConvertPath];
    require(skillConvertPath);
  } catch (err) {
    if (err.message !== '__EXIT__') {
      output += '\n[EXCEPTION] ' + err.message;
      exitCode = 1;
    }
  } finally {
    process.argv = originalArgv;
    process.exit = originalExit;
    console.log = origLog;
    console.error = origError;
  }

  // Find output directory for "Open Folder" button
  let outputPath = null;
  if (!dryRun && !lint) {
    const skillName = path.basename(inputDir);
    const base = outDir || getDefaultOutDir(bidirectional ? null : toPlatform);
    outputPath = bidirectional ? base : path.join(base, skillName);
    if (!fs.existsSync(outputPath)) outputPath = base;
  }

  return { output, exitCode, outputPath };
});

function getDefaultOutDir(platform) {
  const map = {
    claude: path.join(os.homedir(), '.claude', 'skills'),
    codex: path.join(os.homedir(), '.codex', 'skills'),
    copilot: path.join(os.homedir(), '.copilot', 'skills'),
    universal: path.join(os.homedir(), '.agents', 'skills'),
  };
  return map[platform] || path.join(os.homedir(), '.agents', 'skills');
}

// ─────────────────────────────────────────────────────────────
// v1.1: scanSkillsWorkspace + pickWorkspace
// ─────────────────────────────────────────────────────────────
ipcMain.handle('pick-workspace', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Copilot Workspace (looks for .github/skills/)',
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('scan-skills-workspace', async (e, workspacePath) => {
  const home = os.homedir();
  const dirs = [
    { platform: 'claude',    label: 'Claude Code',    dir: path.join(home, '.claude', 'skills') },
    { platform: 'codex',     label: 'Codex',          dir: path.join(home, '.codex', 'skills') },
    { platform: 'universal', label: 'Universal',      dir: path.join(home, '.agents', 'skills') },
    { platform: 'copilot',   label: 'GitHub Copilot', dir: workspacePath ? path.join(workspacePath, '.github', 'skills') : null },
  ];

  return dirs.map(({ platform, label, dir }) => {
    if (!dir) return { platform, label, dir: null, exists: false, skills: [] };
    const exists = fs.existsSync(dir);
    if (!exists) return { platform, label, dir, exists: false, skills: [] };
    try {
      const skills = fs.readdirSync(dir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => {
          const skillDir = path.join(dir, e.name);
          return parseSkillMeta(skillDir) || { name: e.name, description: '', dir: skillDir };
        });
      return { platform, label, dir, exists: true, skills };
    } catch {
      return { platform, label, dir, exists: true, skills: [] };
    }
  });
});

// scan-skills: no-arg alias — scans default platform dirs (no arg needed)
ipcMain.handle('scan-skills', async () => {
  const home = os.homedir();
  const dirs = [
    { platform: 'claude',    label: 'Claude Code',    dir: path.join(home, '.claude', 'skills') },
    { platform: 'codex',     label: 'Codex',          dir: path.join(home, '.codex', 'skills') },
    { platform: 'universal', label: 'Universal',      dir: path.join(home, '.agents', 'skills') },
    { platform: 'copilot',   label: 'GitHub Copilot', dir: path.join(home, '.github', 'skills') },
    { platform: 'openclaw',  label: 'OpenClaw',       dir: path.join(home, '.openclaw-2', 'workspace-backend', 'skills') },
  ];

  const result = {};
  for (const { platform, label, dir } of dirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const skills = fs.readdirSync(dir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => {
          const skillDir = path.join(dir, e.name);
          return parseSkillMeta(skillDir) || { name: e.name, description: '', dir: skillDir };
        });
      if (skills.length > 0) result[platform] = skills;
    } catch {}
  }
  return result;
});
