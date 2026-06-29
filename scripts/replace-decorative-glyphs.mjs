import fs from 'fs';
import path from 'path';

function walk(dir, acc = []) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name === '.git') continue;
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p, acc);
        else if (/\.(jsx?|tsx?)$/.test(ent.name)) acc.push(p);
    }
    return acc;
}

function transform(content) {
    let s = content;
    s = s.replace(/'—'/g, "'-'");
    s = s.replace(/"—"/g, '"-"');
    s = s.replace(/<span>·<\/span>/g, ',');
    s = s.replace(/\{' '\}· /g, "{', '}");
    s = s.replace(/ ·\{' '\}/g, ", {' '}");
    s = s.replace(/ · /g, ', ');
    s = s.replace(/ — /g, ', ');
    s = s.replace(/ →/g, '');
    s = s.replace(/→/g, '');
    s = s.replace(/—/g, ', ');
    s = s.replace(/–/g, '-');
    s = s.replace(/·/g, ',');
    s = s.replace(/, , /g, ', ');
    s = s.replace(/,  +/g, ', ');
    s = s.replace(/,\s*,/g, ',');
    return s;
}

const roots = ['src', path.join('server', 'src')];
let changed = 0;
for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const file of walk(root)) {
        if (file.includes('__tests__') || file.includes('.test.') || file.includes('.spec.')) continue;
        const raw = fs.readFileSync(file, 'utf8');
        const next = transform(raw);
        if (next !== raw) {
            fs.writeFileSync(file, next);
            changed += 1;
        }
    }
}
console.log(`Updated ${changed} files`);
