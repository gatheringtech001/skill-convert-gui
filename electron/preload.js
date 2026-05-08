const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Folder / file pickers
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  pickWorkspace: () => ipcRenderer.invoke('pick-workspace'),
  openFolder: (p) => ipcRenderer.invoke('open-folder', p),

  // Skill convert operations
  detectPlatform: (p) => ipcRenderer.invoke('detect-platform', p),
  lintSkill: (p) => ipcRenderer.invoke('lint-skill', p),
  previewConvert: (opts) => ipcRenderer.invoke('preview-convert', opts),
  convertSkill: (opts) => ipcRenderer.invoke('convert-skill', opts),
  defaultOutputPath: (platform) => ipcRenderer.invoke('default-output-path', platform),

  // v1.1 skill browser
  scanSkills: (copilotWorkspace) => ipcRenderer.invoke('scan-skills', copilotWorkspace),
});
