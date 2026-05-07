const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { execFile, exec } = require('child_process');
const fs = require('fs');
const os = require('os');

const isDev = process.env.VITE_DEV === '1';

// Path to bundled skill-convert.js
function getSkillConvertPath() {
  if (isDev) {
    // During dev, find it from node_modules
    return path.join(__dirname, '..', 'node_modules', 'skill-convert', 'skill-convert.js');
  }
  // In production, it's in extraResources
  return path.join(process.resourcesPath, 'skill-convert', 'skill-convert.js');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Skill Convert',
    backgroundColor: '#0f172a',
    show: false,
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.once('ready-to-show', () => win.show());

  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ============================================================
// IPC HANDLERS
// ============================================================

// Pick a folder via native dialog
ipcMain.handle('pick-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Skill Folder',
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// Open folder in system file explorer
ipcMain.handle('open-folder', async (_, folderPath) => {
  shell.openPath(folderPath);
});

// Run skill-convert with given args, return { stdout, stderr, exitCode }
function runSkillConvert(args) {
  return new Promise((resolve) => {
    const scriptPath = getSkillConvertPath();
    const nodeBin = process.execPath; // Use Electron's bundled Node
    execFile(nodeBin, [scriptPath, ...args], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: err ? (err.code || 1) : 0,
      });
    });
  });
}

// Detect platform from a skill folder
ipcMain.handle('detect-platform', async (_, folderPath) => {
  const result = await runSkillConvert([folderPath, '--auto-detect', '--dry-run', '--to', 'universal']);
  // Parse "Auto-detected source platform: xxx" from stdout
  const match = result.stdout.match(/Auto-detected source platform:\s*(\w+)/i);
  return match ? match[1] : null;
});

// Lint a skill folder
ipcMain.handle('lint-skill', async (_, folderPath) => {
  const result = await runSkillConvert([folderPath, '--lint']);
  // Parse score and issues
  const scoreMatch = result.stdout.match(/Compatibility Score:\s*(\d+)\/100/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
  return {
    score,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  };
});

// Dry-run convert (preview diff)
ipcMain.handle('preview-convert', async (_, { folderPath, from, to }) => {
  const args = [folderPath, '--from', from, '--to', to, '--dry-run'];
  if (to === 'all') {
    args[args.indexOf('--to')] = '--to';
    args[args.indexOf('all')] = 'universal';
    args.push('--bidirectional');
    args.splice(args.indexOf('--to'), 2);
  }
  const result = await runSkillConvert(
    to === 'all'
      ? [folderPath, '--from', from, '--bidirectional', '--dry-run']
      : [folderPath, '--from', from, '--to', to, '--dry-run']
  );
  return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode };
});

// Actual convert
ipcMain.handle('convert-skill', async (_, { folderPath, from, to, outPath }) => {
  let args;
  if (to === 'all') {
    args = [folderPath, '--from', from, '--bidirectional', '--out', outPath];
  } else {
    args = [folderPath, '--from', from, '--to', to, '--out', outPath];
  }
  const result = await runSkillConvert(args);
  return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode };
});

// Get default output path for a platform
ipcMain.handle('default-output-path', async (_, platform) => {
  const home = os.homedir();
  const map = {
    claude:    path.join(home, '.claude', 'skills'),
    codex:     path.join(home, '.codex', 'skills'),
    copilot:   path.join(home, '.copilot', 'skills'),
    universal: path.join(home, '.agents', 'skills'),
    all:       path.join(home, 'skill-convert-dist'),
  };
  return map[platform] || path.join(home, 'skill-convert-dist');
});
