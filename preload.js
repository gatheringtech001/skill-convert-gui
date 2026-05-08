const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('skillConvert', {
  // v1.0 — convert operations
  scanSkills:          ()      => ipcRenderer.invoke('scan-skills'),
  pickDir:             ()      => ipcRenderer.invoke('pick-dir'),
  pickOutDir:          ()      => ipcRenderer.invoke('pick-out-dir'),
  openFolder:          (p)     => ipcRenderer.invoke('open-folder', p),
  convert:             (opts)  => ipcRenderer.invoke('convert', opts),

  // v1.1 — skill browser
  scanSkillsWorkspace: (ws)    => ipcRenderer.invoke('scan-skills-workspace', ws),
  pickWorkspace:       ()      => ipcRenderer.invoke('pick-workspace'),
});
