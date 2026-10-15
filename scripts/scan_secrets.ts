import { execSync } from 'child_process';
import fs from 'fs';

const trackedFiles = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
const leaks: { file: string; type: string; match: string }[] = [];

for (const file of trackedFiles) {
  if (file === '.env.example' || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.pptx') || file.endsWith('.pdf')) continue;
  try {
    const content = fs.readFileSync(file, 'utf8');
    const googleMatch = content.match(/AIza[a-zA-Z0-9_-]{35}/);
    if (googleMatch) leaks.push({ file, type: 'Google API Key', match: googleMatch[0].slice(0, 8) + '...' });

    const openrouterMatch = content.match(/sk-or-v1-[a-f0-9]{64}/);
    if (openrouterMatch) leaks.push({ file, type: 'OpenRouter Key', match: openrouterMatch[0].slice(0, 8) + '...' });

    const genericKeyMatch = content.match(/sk-[a-zA-Z0-9]{32,}/);
    if (genericKeyMatch) leaks.push({ file, type: 'Secret Key (sk-...)', match: genericKeyMatch[0].slice(0, 8) + '...' });

    const deepseekMatch = content.match(/sk-[a-f0-9]{32}/);
    if (deepseekMatch) leaks.push({ file, type: 'DeepSeek / Hex API Key', match: deepseekMatch[0].slice(0, 8) + '...' });
  } catch (e) {}
}

console.log('Total tracked files scanned:', trackedFiles.length);
console.log('Leaks detected:', leaks.length === 0 ? 'NONE (CLEAN)' : JSON.stringify(leaks, null, 2));
