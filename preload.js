const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('skillConvert', {
  pickDir: () => ipcRenderer.invoke('pick-dir'),
  pickOutDir: () => ipcRenderer.invoke('pick-out-dir'),
  openFolder: (p) => ipcRenderer.invoke('open-folder', p),
  convert: (opts) => ipcRenderer.invoke('convert', opts),
});
