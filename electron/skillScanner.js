// IPC handler: scan skill directories and return skill metadata
const YAML_FRONT_MATTER = /^---\n([\s\S]*?)\n---/;

function parseFrontmatterField(content, field) {
  const match = content.match(YAML_FRONT_MATTER);
  if (!match) return null;
  const lines = match[1].split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    if (key === field) {
      return line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

function readSkillMeta(skillDir) {
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  let name = path.basename(skillDir);
  let description = '';

  if (fs.existsSync(skillMdPath)) {
    try {
      const content = fs.readFileSync(skillMdPath, 'utf8');
      const fmName = parseFrontmatterField(content, 'name');
      const fmDesc = parseFrontmatterField(content, 'description');
      if (fmName) name = fmName;
      if (fmDesc) {
        description = fmDesc.slice(0, 80) + (fmDesc.length > 80 ? '…' : '');
      } else {
        // Try first non-empty line of body after frontmatter
        const body = content.replace(YAML_FRONT_MATTER, '').trim();
        const firstLine = body.split('\n').find(l => l.trim() && !l.startsWith('#'));
        if (firstLine) description = firstLine.trim().slice(0, 80);
      }
    } catch {}
  }

  return { name, description, path: skillDir };
}

function scanSkillDir(dirPath) {
  const exists = fs.existsSync(dirPath);
  if (!exists) return { exists: false, skills: [] };

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const skills = entries
      .filter(e => e.isDirectory())
      .map(e => readSkillMeta(path.join(dirPath, e.name)));
    return { exists: true, skills };
  } catch {
    return { exists: true, skills: [] };
  }
}

module.exports = { scanSkillDir };
