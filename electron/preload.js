const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  openFolder: (p) => ipcRenderer.invoke('open-folder', p),
  detectPlatform: (p) => ipcRenderer.invoke('detect-platform', p),
  lintSkill: (p) => ipcRenderer.invoke('lint-skill', p),
  previewConvert: (opts) => ipcRenderer.invoke('preview-convert', opts),
  convertSkill: (opts) => ipcRenderer.invoke('convert-skill', opts),
  defaultOutputPath: (platform) => ipcRenderer.invoke('default-output-path', platform),
});
