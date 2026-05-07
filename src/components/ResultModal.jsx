import { useEffect } from 'react';

const TYPE_STYLES = {
  success: 'border-emerald-500/40 bg-emerald-500/5',
  warning: 'border-yellow-500/40 bg-yellow-500/5',
  error:   'border-red-500/40 bg-red-500/5',
  info:    'border-sky-500/40 bg-sky-500/5',
};

const TYPE_HEADER = {
  success: 'bg-emerald-500/10 border-emerald-500/30',
  warning: 'bg-yellow-500/10 border-yellow-500/30',
  error:   'bg-red-500/10 border-red-500/30',
  info:    'bg-sky-500/10 border-sky-500/30',
};

export default function ResultModal({ modal, onClose, onOpenFolder }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden ${TYPE_STYLES[modal.type]}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${TYPE_HEADER[modal.type]}`}>
          <h2 className="font-semibold text-white text-base">{modal.title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <pre className="text-xs font-mono text-slate-300 bg-slate-900/60 rounded-lg p-4 overflow-auto max-h-80 whitespace-pre-wrap leading-relaxed">
            {modal.content}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 pb-4">
          {modal.outPath && (
            <button
              onClick={onOpenFolder}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors"
            >
              📂 打开输出目录
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
