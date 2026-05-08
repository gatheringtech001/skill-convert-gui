import { useState, useEffect, useCallback } from 'react';

const PLATFORM_COLORS = {
  claude:    'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  codex:     'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  copilot:   'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  universal: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
};

const PLATFORM_ICONS = {
  claude:    '🟣',
  codex:     '⬛',
  copilot:   '🟢',
  universal: '🌐',
};

function SkillCard({ skill, platform, onConvert }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/40 hover:border-slate-600/60 transition-all group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-white text-sm truncate">{skill.name}</span>
          <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-mono ${PLATFORM_COLORS[platform]}`}>
            {PLATFORM_ICONS[platform]} {platform}
          </span>
        </div>
        {skill.description ? (
          <p className="text-xs text-slate-400 leading-relaxed truncate">{skill.description}</p>
        ) : (
          <p className="text-xs text-slate-600 italic">No description</p>
        )}
        <p className="text-xs text-slate-600 font-mono mt-0.5 truncate">{skill.path}</p>
      </div>
      <button
        onClick={() => onConvert(skill.path, platform)}
        className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sky-600/80 hover:bg-sky-500 text-white opacity-0 group-hover:opacity-100 transition-all"
      >
        转换 →
      </button>
    </div>
  );
}

function PlatformGroup({ group, onConvert, onPickWorkspace, copilotWorkspace }) {
  const isCopilot = group.platform === 'copilot';

  return (
    <div className="space-y-2">
      {/* Group Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{PLATFORM_ICONS[group.platform]}</span>
          <span className="text-sm font-semibold text-white">{group.label}</span>
          {group.exists && (
            <span className="text-xs text-slate-500">({group.skills.length})</span>
          )}
        </div>
        {isCopilot && (
          <button
            onClick={onPickWorkspace}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
          >
            {copilotWorkspace ? '📁 更改路径' : '📁 选 Workspace'}
          </button>
        )}
      </div>

      {/* Skill list or empty state */}
      {!group.exists ? (
        <div className="px-4 py-3 bg-slate-800/30 rounded-lg border border-dashed border-slate-700/40">
          <p className="text-xs text-slate-500">
            目录不存在：<span className="font-mono text-slate-600">{group.dirPath || '(未选择 workspace)'}</span>
          </p>
        </div>
      ) : group.skills.length === 0 ? (
        <div className="px-4 py-3 bg-slate-800/30 rounded-lg border border-dashed border-slate-700/40">
          <p className="text-xs text-slate-500">暂无 skill。路径：<span className="font-mono text-slate-600">{group.dirPath}</span></p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {group.skills.map(skill => (
            <SkillCard
              key={skill.path}
              skill={skill}
              platform={group.platform}
              onConvert={onConvert}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SkillBrowser({ onConvert }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copilotWorkspace, setCopilotWorkspace] = useState(null);

  const scan = useCallback(async (workspace) => {
    setLoading(true);
    try {
      const result = await window.api.scanSkills(workspace || null);
      setGroups(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    scan(copilotWorkspace);
  }, [copilotWorkspace, scan]);

  const handlePickWorkspace = async () => {
    const ws = await window.api.pickWorkspace();
    if (ws) {
      setCopilotWorkspace(ws);
    }
  };

  const totalSkills = groups.reduce((n, g) => n + (g.skills?.length || 0), 0);

  return (
    <div className="space-y-1">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white">本机 Skills</h2>
          {!loading && (
            <p className="text-xs text-slate-500 mt-0.5">
              共 {totalSkills} 个 skill，{groups.filter(g => g.exists).length} 个目录
            </p>
          )}
        </div>
        <button
          onClick={() => scan(copilotWorkspace)}
          disabled={loading}
          className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
        >
          {loading ? (
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : '↻'} 刷新
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          扫描中…
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(group => (
            <PlatformGroup
              key={group.platform}
              group={group}
              onConvert={onConvert}
              onPickWorkspace={handlePickWorkspace}
              copilotWorkspace={copilotWorkspace}
            />
          ))}
        </div>
      )}
    </div>
  );
}
