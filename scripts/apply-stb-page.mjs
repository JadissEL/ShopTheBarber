import fs from 'fs';
import path from 'path';

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== 'node_modules') walk(p, files);
    else if (ent.name.endsWith('.jsx') && p.includes(`${path.sep}pages${path.sep}`)) files.push(p);
  }
  return files;
}

const root = path.resolve('src');
const files = walk(root);
let n = 0;

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const next = src
    .replace(/className="min-h-screen bg-background text-foreground([^"]*)"/g, 'className="stb-page$1"')
    .replace(/className="min-h-screen bg-background([^"]*)"/g, 'className="stb-page$1"')
    .replace(/className="min-h-screen text-foreground bg-background([^"]*)"/g, 'className="stb-page$1"');
  if (next !== src) {
    fs.writeFileSync(file, next);
    n++;
  }
}

console.log(`stb-page applied to ${n} pages`);
