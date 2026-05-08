#!/usr/bin/env node

/**
 * skill-convert - Convert AI agent skills between Claude Code, Codex, Copilot, and Universal formats
 * Usage: node skill-convert.js <input-dir> --from <platform> --to <platform> [options]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ============================================================
// TOOL NAME MAPPING TABLE
// ============================================================
const TOOL_MAPPINGS = {
  // concept -> { claude, codex, copilot, universal }
  read_file: {
    claude:    ['Use the Read tool', 'Use Read tool', 'Use Read to', 'use the Read tool', 'use Read tool'],
    codex:     ['shell cat', 'use shell to cat', 'cat the file', 'use cat to read'],
    copilot:   ['#codebase', 'use #codebase to read', '#file'],
    universal: ['读取文件', 'read the file', 'open the file', '打开文件'],
  },
  edit_file: {
    claude:    ['Use the Edit tool', 'Use Edit tool', 'Use Edit to', 'use the Edit tool', 'use Edit tool'],
    codex:     ['apply_patch', 'use apply_patch', 'use apply_patch to'],
    copilot:   ['#editFiles', 'use #editFiles to', '#editor'],
    universal: ['编辑文件', 'edit the file', 'modify the file', '修改文件'],
  },
  run_command: {
    claude:    ['Use the Bash tool to', 'Use Bash tool to', 'Use the Bash tool', 'Use Bash tool', 'Use Bash to', 'use the Bash tool to', 'use the Bash tool', 'use Bash to', 'using Bash'],
    codex:     ['Run via shell:', 'run via shell', 'execute with shell'],
    copilot:   ['runInTerminal', 'Run in terminal:', 'run in terminal', 'use runInTerminal'],
    universal: ['运行 shell 命令：', '运行 shell 命令', 'run the shell command', 'execute the command', '运行命令', 'run shell'],
  },
  search: {
    claude:    ['Use the Grep tool', 'Use Grep tool', 'Use Grep to', 'use the Grep tool', 'use Grep to'],
    codex:     ['shell grep', 'use shell grep', 'grep via shell'],
    copilot:   ['#search', 'use #search to'],
    universal: ['搜索文件', 'search the file', 'search for', '搜索', 'grep'],
  },
  list_files: {
    claude:    ['Use the LS tool', 'Use LS tool', 'Use LS to', 'use LS to'],
    codex:     ['shell ls', 'use shell ls', 'list with shell'],
    copilot:   ['#codebase', 'use #codebase to list'],
    universal: ['列出文件', 'list the files', '列出目录', 'list the directory'],
  },
  write_file: {
    claude:    ['Use the Write tool', 'Use Write tool', 'Use Write to', 'use Write to', 'use the Write tool'],
    codex:     ['apply_patch', 'create via apply_patch'],
    copilot:   ['#editFiles', 'use #editFiles to create'],
    universal: ['写入文件', 'write to file', 'create the file', '创建文件'],
  },
};

// Platform-specific frontmatter fields
const PLATFORM_FIELDS = {
  claude:    { add: [], remove: [] },
  codex:     { add: [], remove: ['allowed-tools'] },
  copilot:   { add: [], remove: ['allowed-tools'] },
  universal: { add: [], remove: ['allowed-tools'] },
};

// Platform default output paths
const DEFAULT_OUTPUT_PATHS = {
  claude:    path.join(os.homedir(), '.claude', 'skills'),
  codex:     path.join(os.homedir(), '.codex', 'skills'),
  copilot:   path.join(os.homedir(), '.copilot', 'skills'),
  universal: path.join(os.homedir(), '.agents', 'skills'),
};

// CLI warning patterns for scripts/
const CLI_WARNING_PATTERNS = [
  { pattern: /\bclaude\s+(--print|exec|run|-p)\b/g, platform: 'Claude CLI', suggestion: 'Replace with a generic shell command or remove' },
  { pattern: /\bcodex\s+(exec|run|-e)\b/g, platform: 'Codex CLI', suggestion: 'Replace with a generic shell command or remove' },
  { pattern: /\bgh\s+copilot\b/g, platform: 'GitHub Copilot CLI', suggestion: 'Replace with a generic shell command or remove' },
  { pattern: /\$CLAUDE_[A-Z_]+/g, platform: 'Claude env var', suggestion: 'Replace with standard environment variable' },
  { pattern: /\$CODEX_[A-Z_]+/g, platform: 'Codex env var', suggestion: 'Replace with standard environment variable' },
];

// ============================================================
// FRONTMATTER PARSER (simple YAML)
// ============================================================
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content, hasFrontmatter: false };

  const fmLines = match[1].split('\n');
  const frontmatter = {};

  for (const line of fmLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // Parse array values like [Read, Edit, Bash]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim());
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body: match[2], hasFrontmatter: true };
}

function serializeFrontmatter(frontmatter) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  return lines.join('\n') + '\n';
}

// ============================================================
// AUTO-DETECT SOURCE PLATFORM
// ============================================================
function detectPlatform(skillDir) {
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) return null;

  const content = fs.readFileSync(skillMdPath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(content);

  // Check for allowed-tools -> likely Claude
  if (frontmatter['allowed-tools']) return 'claude';

  // Check body for platform-specific tool names
  let claudeScore = 0, codexScore = 0, copilotScore = 0;

  for (const concept of Object.values(TOOL_MAPPINGS)) {
    for (const phrase of (concept.claude || [])) {
      if (body.includes(phrase)) claudeScore++;
    }
    for (const phrase of (concept.codex || [])) {
      if (body.includes(phrase)) codexScore++;
    }
    for (const phrase of (concept.copilot || [])) {
      if (body.includes(phrase)) copilotScore++;
    }
  }

  const max = Math.max(claudeScore, codexScore, copilotScore);
  if (max === 0) return 'universal';
  if (claudeScore === max) return 'claude';
  if (codexScore === max) return 'codex';
  if (copilotScore === max) return 'copilot';
  return 'universal';
}

// ============================================================
// BODY TRANSFORMER
// ============================================================
function transformBody(body, fromPlatform, toPlatform) {
  let result = body;

  for (const [concept, platforms] of Object.entries(TOOL_MAPPINGS)) {
    const sourcePhrases = platforms[fromPlatform] || [];
    const targetPhrases = platforms[toPlatform] || [];
    if (!targetPhrases.length) continue;

    const targetPhrase = targetPhrases[0]; // Use first (canonical) target phrase

    for (const sourcePhrase of sourcePhrases) {
      // Case-insensitive replace
      const regex = new RegExp(sourcePhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      result = result.replace(regex, targetPhrase);
    }
  }

  return result;
}

// ============================================================
// FRONTMATTER TRANSFORMER
// ============================================================
function transformFrontmatter(frontmatter, fromPlatform, toPlatform) {
  const result = { ...frontmatter };
  const toConfig = PLATFORM_FIELDS[toPlatform] || { add: [], remove: [] };

  // Remove platform-specific fields
  for (const field of toConfig.remove) {
    delete result[field];
  }

  // Add platform-specific fields
  for (const [key, value] of Object.entries(toConfig.add || {})) {
    result[key] = value;
  }

  return result;
}

// ============================================================
// SCRIPTS SCANNER
// ============================================================
function scanScripts(scriptsDir) {
  const warnings = [];
  if (!fs.existsSync(scriptsDir)) return warnings;

  const files = fs.readdirSync(scriptsDir).filter(f =>
    f.endsWith('.sh') || f.endsWith('.js') || f.endsWith('.py') || f.endsWith('.ts')
  );

  for (const file of files) {
    const filePath = path.join(scriptsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    for (const { pattern, platform, suggestion } of CLI_WARNING_PATTERNS) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        const lineNum = content.slice(0, match.index).split('\n').length;
        warnings.push({
          file: `scripts/${file}`,
          line: lineNum,
          match: match[0],
          platform,
          suggestion,
        });
      }
    }
  }

  return warnings;
}

// ============================================================
// LINT MODE
// ============================================================
function lintSkill(skillDir) {
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    return { score: 0, issues: [{ severity: 'error', message: 'SKILL.md not found' }] };
  }

  const content = fs.readFileSync(skillMdPath, 'utf8');
  const { frontmatter, body, hasFrontmatter } = parseFrontmatter(content);
  const issues = [];
  let deductions = 0;

  // Check required fields
  if (!hasFrontmatter) {
    issues.push({ severity: 'error', message: 'Missing YAML frontmatter' });
    deductions += 30;
  } else {
    if (!frontmatter.name) {
      issues.push({ severity: 'error', message: 'Missing required field: name' });
      deductions += 20;
    }
    if (!frontmatter.description) {
      issues.push({ severity: 'error', message: 'Missing required field: description' });
      deductions += 20;
    }
    if (frontmatter['allowed-tools']) {
      issues.push({ severity: 'warning', message: '`allowed-tools` field is Claude-specific — remove for cross-platform compatibility' });
      deductions += 10;
    }
  }

  // Check for platform-specific tool names in body
  let platformSpecificCount = 0;
  for (const [concept, platforms] of Object.entries(TOOL_MAPPINGS)) {
    for (const phrase of [...(platforms.claude || []), ...(platforms.codex || []), ...(platforms.copilot || [])]) {
      if (body.includes(phrase)) {
        platformSpecificCount++;
        issues.push({ severity: 'warning', message: `Platform-specific tool name found: "${phrase}" — replace with natural language` });
        deductions += 5;
      }
    }
  }

  // Check scripts
  const scriptWarnings = scanScripts(path.join(skillDir, 'scripts'));
  for (const w of scriptWarnings) {
    issues.push({ severity: 'warning', message: `${w.file}:${w.line} — ${w.platform} call: "${w.match}" — ${w.suggestion}` });
    deductions += 5;
  }

  const score = Math.max(0, 100 - deductions);

  return { score, issues };
}

// ============================================================
// CONVERT SKILL
// ============================================================
function convertSkill(skillDir, fromPlatform, toPlatform, outputDir, options = {}) {
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    throw new Error(`SKILL.md not found in: ${skillDir}`);
  }

  const content = fs.readFileSync(skillMdPath, 'utf8');
  const { frontmatter, body, hasFrontmatter } = parseFrontmatter(content);

  const newFrontmatter = transformFrontmatter(frontmatter, fromPlatform, toPlatform);
  const newBody = transformBody(body, fromPlatform, toPlatform);
  const newContent = hasFrontmatter
    ? serializeFrontmatter(newFrontmatter) + newBody
    : newBody;

  const scriptWarnings = scanScripts(path.join(skillDir, 'scripts'));

  if (options.dryRun) {
    console.log('\n📋 DRY RUN — No files will be written\n');
    console.log('=== SKILL.md DIFF ===');
    if (content !== newContent) {
      showDiff(content, newContent);
    } else {
      console.log('(No changes to SKILL.md)');
    }
    if (scriptWarnings.length > 0) {
      console.log('\n⚠️  Script warnings:');
      for (const w of scriptWarnings) {
        console.log(`  [${w.file}:${w.line}] ${w.platform}: "${w.match}"\n  → ${w.suggestion}`);
      }
    }
    return { dryRun: true, warnings: scriptWarnings };
  }

  // Write output
  const skillName = path.basename(skillDir);
  const destDir = path.join(outputDir, skillName);
  fs.mkdirSync(destDir, { recursive: true });

  // Write converted SKILL.md
  fs.writeFileSync(path.join(destDir, 'SKILL.md'), newContent, 'utf8');

  // Copy other files (scripts, references, assets)
  for (const subdir of ['scripts', 'references', 'assets']) {
    const src = path.join(skillDir, subdir);
    if (fs.existsSync(src)) {
      copyDir(src, path.join(destDir, subdir));
    }
  }

  return { destDir, warnings: scriptWarnings };
}

// ============================================================
// BIDIRECTIONAL (all three platforms)
// ============================================================
function convertBidirectional(skillDir, fromPlatform, outputBaseDir, options = {}) {
  const targets = ['claude', 'codex', 'copilot'].filter(p => p !== fromPlatform);
  targets.push('universal');

  const results = {};
  for (const target of targets) {
    const outDir = path.join(outputBaseDir, target);
    results[target] = convertSkill(skillDir, fromPlatform, target, outDir, options);
  }
  return results;
}

// ============================================================
// UTILITIES
// ============================================================
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function showDiff(original, updated) {
  const origLines = original.split('\n');
  const newLines = updated.split('\n');
  const maxLen = Math.max(origLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const n = newLines[i];
    if (o === n) {
      // same
    } else if (o === undefined) {
      console.log(`+ ${n}`);
    } else if (n === undefined) {
      console.log(`- ${o}`);
    } else {
      console.log(`- ${o}`);
      console.log(`+ ${n}`);
    }
  }
}

function printHelp() {
  console.log(`
skill-convert — Convert AI agent skills between platforms

USAGE:
  npx skill-convert <input-dir> [options]

OPTIONS:
  --from <platform>     Source platform (claude|codex|copilot|universal)
  --to <platform>       Target platform (claude|codex|copilot|universal)
  --auto-detect         Auto-detect source platform from SKILL.md
  --out <dir>           Custom output directory
  --bidirectional       Output all platforms to dist/{claude,codex,copilot,universal}/
  --dry-run             Preview changes without writing files
  --lint                Check cross-platform compatibility score
  --help                Show this help

EXAMPLES:
  node skill-convert.js ./my-skill --from claude --to codex
  node skill-convert.js ./my-skill --from claude --to universal
  node skill-convert.js ./my-skill --auto-detect --to copilot
  node skill-convert.js ./my-skill --from claude --bidirectional --out ./dist
  node skill-convert.js ./my-skill --lint
  node skill-convert.js ./my-skill --from claude --to codex --dry-run

PLATFORMS:
  claude      Claude Code  (~/.claude/skills/)
  codex       OpenAI Codex (~/.codex/skills/)
  copilot     GitHub Copilot (~/.copilot/skills/)
  universal   All agents   (~/.agents/skills/)  ← recommended
`);
}

// ============================================================
// MAIN
// ============================================================
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const inputDir = args[0];
  if (!inputDir || inputDir.startsWith('--')) {
    console.error('Error: Missing input directory');
    printHelp();
    process.exit(1);
  }

  const absInputDir = path.resolve(inputDir);
  if (!fs.existsSync(absInputDir)) {
    console.error(`Error: Input directory not found: ${absInputDir}`);
    process.exit(1);
  }

  // Parse flags
  const flagIdx = (flag) => args.indexOf(flag);
  const flagVal = (flag) => {
    const i = flagIdx(flag);
    return i !== -1 ? args[i + 1] : null;
  };
  const hasFlag = (flag) => args.includes(flag);

  // Lint mode
  if (hasFlag('--lint')) {
    const { score, issues } = lintSkill(absInputDir);
    console.log(`\n🔍 Lint Report: ${path.basename(absInputDir)}`);
    console.log(`📊 Compatibility Score: ${score}/100`);
    if (issues.length === 0) {
      console.log('✅ No issues found — fully cross-platform compatible!');
    } else {
      console.log('\nIssues:');
      for (const issue of issues) {
        const icon = issue.severity === 'error' ? '❌' : '⚠️ ';
        console.log(`  ${icon} ${issue.message}`);
      }
    }
    process.exit(score >= 70 ? 0 : 1);
  }

  // Determine platforms
  let fromPlatform = flagVal('--from');
  const toPlatform = flagVal('--to');
  const outDir = flagVal('--out');
  const dryRun = hasFlag('--dry-run');
  const bidirectional = hasFlag('--bidirectional');
  const autoDetect = hasFlag('--auto-detect');

  if (autoDetect || !fromPlatform) {
    fromPlatform = detectPlatform(absInputDir);
    if (!fromPlatform) {
      console.error('Error: Could not auto-detect source platform. Use --from <platform>.');
      process.exit(1);
    }
    console.log(`🔍 Auto-detected source platform: ${fromPlatform}`);
  }

  const validPlatforms = ['claude', 'codex', 'copilot', 'universal'];
  if (!validPlatforms.includes(fromPlatform)) {
    console.error(`Error: Invalid --from platform: ${fromPlatform}. Must be one of: ${validPlatforms.join(', ')}`);
    process.exit(1);
  }

  if (bidirectional) {
    const outputBaseDir = outDir || path.join(process.cwd(), 'dist');
    console.log(`\n🔄 Converting to all platforms → ${outputBaseDir}`);
    const results = convertBidirectional(absInputDir, fromPlatform, outputBaseDir, { dryRun });
    for (const [platform, result] of Object.entries(results)) {
      if (result.dryRun) {
        console.log(`  [dry-run] ${platform}`);
      } else {
        console.log(`  ✅ ${platform} → ${result.destDir}`);
        if (result.warnings.length > 0) {
          console.log(`     ⚠️  ${result.warnings.length} script warning(s)`);
        }
      }
    }
    return;
  }

  if (!toPlatform) {
    console.error('Error: Missing --to platform. Use --to <platform> or --bidirectional.');
    printHelp();
    process.exit(1);
  }

  if (!validPlatforms.includes(toPlatform)) {
    console.error(`Error: Invalid --to platform: ${toPlatform}. Must be one of: ${validPlatforms.join(', ')}`);
    process.exit(1);
  }

  const outputDir = outDir || DEFAULT_OUTPUT_PATHS[toPlatform];

  console.log(`\n⚙️  Converting: ${fromPlatform} → ${toPlatform}`);
  console.log(`   Input:  ${absInputDir}`);
  if (!dryRun) console.log(`   Output: ${outputDir}`);

  try {
    const result = convertSkill(absInputDir, fromPlatform, toPlatform, outputDir, { dryRun });

    if (!result.dryRun) {
      console.log(`\n✅ Done! Converted skill written to: ${result.destDir}`);
      if (result.warnings.length > 0) {
        console.log(`\n⚠️  Script warnings (${result.warnings.length}):`);
        for (const w of result.warnings) {
          console.log(`  [${w.file}:${w.line}] ${w.platform}: "${w.match}"\n  → ${w.suggestion}`);
        }
      }
    }
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
