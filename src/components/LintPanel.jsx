export default function LintPanel({ result }) {
  const { score, stdout } = result;

  // Parse issues from stdout
  const lines = (stdout || '').split('\n');
  const issues = lines.filter(l => l.match(/^\s+(❌|⚠️)/));
  const noIssues = stdout.includes('No issues found');

  const scoreColor =
    score >= 80 ? 'text-emerald-400' :
    score >= 60 ? 'text-yellow-400' :
    'text-red-400';

  const scoreBarColor =
    score >= 80 ? 'bg-emerald-500' :
    score >= 60 ? 'bg-yellow-500' :
    'bg-red-500';

  return (
    <div className="border border-slate-600/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-800/60 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <span className="font-semibold text-white text-sm">兼容度检查</span>
        </div>
        {score !== null && (
          <div className="flex items-center gap-3">
            <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreBarColor}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className={`font-bold text-lg tabular-nums ${scoreColor}`}>
              {score}<span className="text-sm font-normal text-slate-400">/100</span>
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {noIssues ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <span>✅</span>
            <span>完全跨平台兼容，无任何 issue！</span>
          </div>
        ) : issues.length > 0 ? (
          <ul className="space-y-1.5">
            {issues.map((line, i) => (
              <li key={i} className="text-xs font-mono text-slate-300 leading-relaxed">
                {line.trim()}
              </li>
            ))}
          </ul>
        ) : (
          <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
            {stdout}
          </pre>
        )}
      </div>
    </div>
  );
}
