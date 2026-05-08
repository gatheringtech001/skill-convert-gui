import { useState, useCallback, useEffect } from 'react';
import DropZone from './components/DropZone.jsx';
import PlatformSelector from './components/PlatformSelector.jsx';
import OutputPath from './components/OutputPath.jsx';
import ActionButtons from './components/ActionButtons.jsx';
import ResultModal from './components/ResultModal.jsx';
import LintPanel from './components/LintPanel.jsx';
import SkillBrowser from './components/SkillBrowser.jsx';

const PLATFORMS = [
  { value: 'claude',    label: 'Claude Code',      icon: '🟣' },
  { value: 'codex',     label: 'Codex',            icon: '⬛' },
  { value: 'copilot',   label: 'GitHub Copilot',   icon: '🟢' },
  { value: 'universal', label: 'Universal',        icon: '🌐' },
  { value: 'all',       label: '三家全出 (All)',    icon: '🔄' },
];

const TABS = [
  { id: 'browser', label: '本机 Skills', icon: '🗂️' },
  { id: 'convert', label: '转换',        icon: '⚙️' },
];

export default function App() {
  const [tab, setTab] = useState('browser');

  const [skillPath, setSkillPath] = useState(null);
  const [skillName, setSkillName] = useState(null);
  const [fromPlatform, setFromPlatform] = useState(null);
  const [toPlatform, setToPlatform] = useState('codex');
  const [outPath, setOutPath] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Modal state
  const [modal, setModal] = useState(null);
  const [lintResult, setLintResult] = useState(null);
  const [loading, setLoading] = useState(null);

  // Update default output path when toPlatform changes
  useEffect(() => {
    if (window.api && toPlatform) {
      window.api.defaultOutputPath(toPlatform).then(setOutPath);
    }
  }, [toPlatform]);

  const handleDrop = useCallback(async (folderPath) => {
    setSkillPath(folderPath);
    const parts = folderPath.replace(/\\/g, '/').split('/');
    setSkillName(parts[parts.length - 1]);
    setLintResult(null);

    if (window.api) {
      const detected = await window.api.detectPlatform(folderPath);
      if (detected) setFromPlatform(detected);
    }
  }, []);

  const handlePickFolder = async () => {
    if (!window.api) return;
    const p = await window.api.pickFolder();
    if (p) handleDrop(p);
  };

  // Called from SkillBrowser when user clicks 转换 on a skill
  const handleBrowserConvert = useCallback((folderPath, platform) => {
    setSkillPath(folderPath);
    const parts = folderPath.replace(/\\/g, '/').split('/');
    setSkillName(parts[parts.length - 1]);
    setFromPlatform(platform);
    setLintResult(null);
    setTab('convert'); // switch to convert tab
  }, []);

  const handlePreview = async () => {
    if (!skillPath || !fromPlatform) return;
    setLoading('preview');
    try {
      const res = await window.api.previewConvert({ folderPath: skillPath, from: fromPlatform, to: toPlatform });
      setModal({
        title: `预览 Diff — ${fromPlatform} → ${toPlatform === 'all' ? '三家全出' : toPlatform}`,
        content: res.stdout || res.stderr || '(no output)',
        type: res.exitCode === 0 ? 'info' : 'error',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleConvert = async () => {
    if (!skillPath || !fromPlatform || !outPath) return;
    setLoading('convert');
    try {
      const res = await window.api.convertSkill({ folderPath: skillPath, from: fromPlatform, to: toPlatform, outPath });
      const hasWarnings = res.stdout.includes('Script warnings') || res.stdout.includes('⚠️');
      setModal({
        title: res.exitCode === 0 ? '✅ 转换完成' : '❌ 转换失败',
        content: res.stdout || res.stderr,
        type: res.exitCode === 0 ? (hasWarnings ? 'warning' : 'success') : 'error',
        outPath: res.exitCode === 0 ? outPath : null,
      });
    } finally {
      setLoading(null);
    }
  };

  const handleLint = async () => {
    if (!skillPath) return;
    setLoading('lint');
    setLintResult(null);
    try {
      const res = await window.api.lintSkill(skillPath);
      setLintResult(res);
    } finally {
      setLoading(null);
    }
  };

  const canAct = skillPath && fromPlatform;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-3.5 border-b border-slate-700/60 bg-slate-900/80 backdrop-blur">
        <div className="text-2xl">⚙️</div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-white leading-none">Skill Convert</h1>
          <p className="text-xs text-slate-400 mt-0.5">Claude · Codex · Copilot · Universal</p>
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${tab === t.id
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'}`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        {/* ======== TAB: Skill Browser ======== */}
        {tab === 'browser' && (
          <SkillBrowser onConvert={handleBrowserConvert} />
        )}

        {/* ======== TAB: Convert ======== */}
        {tab === 'convert' && (
          <div className="space-y-5">
            {/* Drop Zone */}
            <DropZone
              onDrop={handleDrop}
              onPickFolder={handlePickFolder}
              skillName={skillName}
              skillPath={skillPath}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
            />

            {/* Platform Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <PlatformSelector
                label="来源平台 (From)"
                value={fromPlatform}
                onChange={setFromPlatform}
                platforms={PLATFORMS.filter(p => p.value !== 'all')}
                placeholder="自动识别"
              />
              <PlatformSelector
                label="目标平台 (To)"
                value={toPlatform}
                onChange={setToPlatform}
                platforms={PLATFORMS}
              />
            </div>

            {/* Output Path */}
            <OutputPath value={outPath} onChange={setOutPath} platform={toPlatform} />

            {/* Action Buttons */}
            <ActionButtons
              canAct={canAct}
              loading={loading}
              onPreview={handlePreview}
              onConvert={handleConvert}
              onLint={handleLint}
            />

            {/* Lint Result Panel */}
            {lintResult && <LintPanel result={lintResult} />}
          </div>
        )}
      </main>

      {/* Result Modal */}
      {modal && (
        <ResultModal
          modal={modal}
          onClose={() => setModal(null)}
          onOpenFolder={() => window.api?.openFolder(modal.outPath)}
        />
      )}
    </div>
  );
}
