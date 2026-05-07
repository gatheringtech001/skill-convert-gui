const SPINNER = (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

export default function ActionButtons({ canAct, loading, onPreview, onConvert, onLint }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Preview Diff */}
      <button
        onClick={onPreview}
        disabled={!canAct || loading}
        className={`
          flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm
          transition-all duration-150
          ${canAct && !loading
            ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 hover:border-slate-500'
            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}
        `}
      >
        {loading === 'preview' ? SPINNER : '🔍'}
        <span>预览 Diff</span>
      </button>

      {/* Convert */}
      <button
        onClick={onConvert}
        disabled={!canAct || loading}
        className={`
          flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm
          transition-all duration-150
          ${canAct && !loading
            ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-500/20'
            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}
        `}
      >
        {loading === 'convert' ? SPINNER : '⚡'}
        <span>开始转换</span>
      </button>

      {/* Lint */}
      <button
        onClick={onLint}
        disabled={!canAct || loading}
        className={`
          flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm
          transition-all duration-150
          ${canAct && !loading
            ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 hover:border-slate-500'
            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}
        `}
      >
        {loading === 'lint' ? SPINNER : '📊'}
        <span>检查兼容度</span>
      </button>
    </div>
  );
}
