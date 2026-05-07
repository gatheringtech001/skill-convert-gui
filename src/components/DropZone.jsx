import { useRef } from 'react';

export default function DropZone({ onDrop, onPickFolder, skillName, skillPath, isDragOver, setIsDragOver }) {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const items = Array.from(e.dataTransfer.items);
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && file.path) {
          // In Electron, file.path gives the real fs path
          // For folders, we need webkitRelativePath or check if it's a directory
          // Electron exposes .path on File objects
          onDrop(file.path);
          return;
        }
      }
    }
    // Try via files
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].path) {
      onDrop(files[0].path);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onPickFolder}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-all duration-200
        ${isDragOver
          ? 'border-sky-400 bg-sky-400/10 drop-active'
          : skillPath
          ? 'border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10'
          : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'}
      `}
    >
      {skillPath ? (
        <div className="space-y-1">
          <div className="text-3xl">📁</div>
          <p className="font-semibold text-white text-base">{skillName}</p>
          <p className="text-xs text-slate-400 font-mono break-all">{skillPath}</p>
          <p className="text-xs text-slate-500 mt-2">Click to change folder</p>
        </div>
      ) : (
        <div className="space-y-2 pointer-events-none">
          <div className="text-4xl">{isDragOver ? '📂' : '🗂️'}</div>
          <p className="text-slate-300 font-medium">
            {isDragOver ? '松手放入 skill 文件夹' : '拖拽 skill 文件夹到这里'}
          </p>
          <p className="text-slate-500 text-sm">或点击选择文件夹</p>
        </div>
      )}
    </div>
  );
}
