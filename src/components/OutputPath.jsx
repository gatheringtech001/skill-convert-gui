export default function OutputPath({ value, onChange, platform }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
        输出路径 (Output Path)
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Select output directory..."
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white font-mono
            focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
            placeholder-slate-500"
        />
      </div>
      <p className="text-xs text-slate-500">
        {platform === 'all'
          ? '转换到所有平台，子目录按平台名称创建'
          : `默认路径：${getPlatformHint(platform)}`}
      </p>
    </div>
  );
}

function getPlatformHint(platform) {
  const hints = {
    claude:    '%USERPROFILE%\\.claude\\skills\\  (Mac: ~/.claude/skills/)',
    codex:     '%USERPROFILE%\\.codex\\skills\\   (Mac: ~/.codex/skills/)',
    copilot:   '%USERPROFILE%\\.copilot\\skills\\  (Mac: ~/.copilot/skills/)',
    universal: '%USERPROFILE%\\.agents\\skills\\   (Mac: ~/.agents/skills/)',
    all:       '自定义输出目录，子目录按平台',
  };
  return hints[platform] || '';
}
