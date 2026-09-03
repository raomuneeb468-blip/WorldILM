import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const idx1 = content.indexOf('{m.content}');
console.log(content.substring(idx1, idx1 + 100));

const idx2 = content.indexOf('Regenerate');
console.log(content.substring(idx2, idx2 + 150));
