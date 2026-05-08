/**
 * i18n.js — Skill Convert GUI
 * Usage: window.setLang('zh'|'en'), window.toggleLang(), window.t('key')
 */

const translations = {
  zh: {
    // Header / tabs
    tab_browser:    '🗂️ 本机 Skills',
    tab_convert:    '⚙️ 转换',
    lang_btn:       'EN',

    // Browser page
    browser_title:  '本机 Skills',
    browser_refresh:'↻ 刷新',
    browser_loading:'⏳ 扫描 skill 目录…',
    browser_meta_tpl: '共 {skills} 个 skill，{dirs} 个目录',
    pick_workspace: '📁 选 Workspace',
    change_workspace:'📁 更改路径',
    empty_no_ws:    '(未选择 workspace)',
    empty_missing:  '目录不存在：',
    empty_no_skill: '暂无 skill — ',
    cvt_btn:        '转换 →',

    // Convert page
    label_skill_dir:'Skill 目录',
    label_mode:     '模式',
    label_from:     '来源平台',
    label_to:       '目标平台',
    label_out_dir:  '输出目录 (可选)',
    btn_convert:    '转换',
    btn_clear:      '清空',
    btn_copy:       '复制',
    btn_open_folder:'📂 打开输出目录',
    dz_prompt:      '点击浏览或拖拽 skill 文件夹至此',
    output_placeholder: '选择 skill 目录后点击「转换」',
    mode_convert:   '格式转换',
    mode_lint:      '兼容度检查',
    mode_dry:       '预览 Diff (dry-run)',
  },
  en: {
    tab_browser:    '🗂️ Local Skills',
    tab_convert:    '⚙️ Convert',
    lang_btn:       '中',

    browser_title:  'Local Skills',
    browser_refresh:'↻ Refresh',
    browser_loading:'⏳ Scanning skill directories…',
    browser_meta_tpl:'{skills} skill(s) across {dirs} director(ies)',
    pick_workspace: '📁 Select Workspace',
    change_workspace:'📁 Change Path',
    empty_no_ws:    '(no workspace selected)',
    empty_missing:  'Directory not found: ',
    empty_no_skill: 'No skills found — ',
    cvt_btn:        'Convert →',

    label_skill_dir:'Skill Directory',
    label_mode:     'Mode',
    label_from:     'From Platform',
    label_to:       'To Platform',
    label_out_dir:  'Output Directory (optional)',
    btn_convert:    'Convert',
    btn_clear:      'Clear',
    btn_copy:       'Copy',
    btn_open_folder:'📂 Open Output Folder',
    dz_prompt:      'Click to browse or drag skill folder here',
    output_placeholder: 'Select a skill directory and click Convert',
    mode_convert:   'Format Convert',
    mode_lint:      'Compatibility Check',
    mode_dry:       'Preview Diff (dry-run)',
  },
};

// ── Public API ────────────────────────────────────────────────
let _currentLang = 'zh';

function t(key) {
  return (translations[_currentLang] || translations.zh)[key] || key;
}

function setLang(lang) {
  if (!translations[lang]) return;
  _currentLang = lang;
  try { localStorage.setItem('lang', lang); } catch (_) {}
  _applyLang();
}

function toggleLang() {
  setLang(_currentLang === 'zh' ? 'en' : 'zh');
}

function _applyLang() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
}

function initI18n() {
  let lang = 'zh';
  try { lang = localStorage.getItem('lang') || 'zh'; } catch (_) {}
  _currentLang = lang;
  _applyLang();
}

// Expose globally
window.t          = t;
window.setLang    = setLang;
window.toggleLang = toggleLang;
window.initI18n   = initI18n;
window.translations = translations;
